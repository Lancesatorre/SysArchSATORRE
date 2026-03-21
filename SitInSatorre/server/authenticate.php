<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

define('ADMIN_ID', 'A-0000');
define('ADMIN_PASSWORD', 'admin123!');
define('ADMIN_FIRST_NAME', 'Admin');
define('ADMIN_LAST_NAME', 'User');
define('ADMIN_EMAIL', 'admin@sit-in.local');
define('ADMIN_ROLE', 'admin');

// Get the origin from the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// CORS headers (needed for both Apache and PHP built-in server)
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 3600');
header("Content-Type: application/json; charset=UTF-8");

function debug_log($message) {
    error_log("[" . date('Y-m-d H:i:s') . "] " . $message);
}

debug_log("Request received - Action: " . ($_GET['action'] ?? 'none') . " Method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debug_log("Preflight request handled");
    http_response_code(200);
    exit(0);
}

// Database connection
$db = new mysqli('localhost', 'root', '');

if ($db->connect_error) {
    debug_log("Database connection failed: " . $db->connect_error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $db->connect_error]);
    exit();
}

debug_log("Database connected successfully");

// Create database if not exists
if (!$db->query("CREATE DATABASE IF NOT EXISTS sitinsatorre")) {
    debug_log("Failed to create database: " . $db->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create database']);
    exit();
}

$db->select_db('sitinsatorre');
$db->set_charset('utf8mb4');

// Create table if not exists
$create_table_query = "
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    course VARCHAR(50),
    year_level INT,
    address VARCHAR(255),
    available_sessions INT NOT NULL DEFAULT 30,
    profile_picture LONGTEXT,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (!$db->query($create_table_query)) {
    debug_log("Failed to create table: " . $db->error);
} else {
    debug_log("Table created or already exists");
}

// Ensure profile_picture column exists for existing tables
$check_profile_pic = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'profile_picture' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_profile_pic && $check_profile_pic->num_rows === 0) {
    $alter_query = "ALTER TABLE students ADD COLUMN profile_picture LONGTEXT AFTER address";
    if (!$db->query($alter_query)) {
        debug_log("Failed to add profile_picture column: " . $db->error);
    } else {
        debug_log("profile_picture column added successfully");
    }
}

// Ensure available_sessions column exists for existing tables
$check_sessions_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'available_sessions' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_sessions_col && $check_sessions_col->num_rows === 0) {
    $alter_sessions_col = "ALTER TABLE students ADD COLUMN available_sessions INT NOT NULL DEFAULT 30 AFTER address";
    if (!$db->query($alter_sessions_col)) {
        debug_log("Failed to add available_sessions column: " . $db->error);
    } else {
        debug_log("available_sessions column added successfully");
    }
}

// Create active sit-in sessions table
$create_sessions_table_query = "
CREATE TABLE IF NOT EXISTS sit_in_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    room VARCHAR(50) DEFAULT NULL,
    purpose VARCHAR(255) DEFAULT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL DEFAULT NULL,
    status ENUM('active', 'ended') NOT NULL DEFAULT 'active',
    ended_by VARCHAR(50) DEFAULT NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_student_id_number (student_id_number),
    INDEX idx_status (status),
    CONSTRAINT fk_sit_in_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
)";

if (!$db->query($create_sessions_table_query)) {
    debug_log("Failed to create sit_in_sessions table: " . $db->error);
}

// Create permanent sit-in records table
$create_records_table_query = "
CREATE TABLE IF NOT EXISTS sit_in_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    room VARCHAR(50) DEFAULT NULL,
    purpose VARCHAR(255) DEFAULT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 0,
    ended_by VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_record_student_id (student_id),
    INDEX idx_record_student_id_number (student_id_number),
    INDEX idx_record_created (created_at)
)";

if (!$db->query($create_records_table_query)) {
    debug_log("Failed to create sit_in_records table: " . $db->error);
}

// Ensure room and purpose columns exist in sit_in_sessions
$check_session_room_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_sessions' AND COLUMN_NAME = 'room' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_session_room_col && $check_session_room_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_sessions ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
}
$check_session_purpose_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_sessions' AND COLUMN_NAME = 'purpose' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_session_purpose_col && $check_session_purpose_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_sessions ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
}

// Ensure room and purpose columns exist in sit_in_records
$check_record_room_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_records' AND COLUMN_NAME = 'room' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_record_room_col && $check_record_room_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_records ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
}
$check_record_purpose_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_records' AND COLUMN_NAME = 'purpose' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_record_purpose_col && $check_record_purpose_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_records ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
}

$action = $_GET['action'] ?? '';
$request_method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Response array
$response = ['success' => false, 'message' => ''];

try {
    // REGISTER ACTION
    if ($action === 'register' && $request_method === 'POST') {
        debug_log("Register action triggered");
        debug_log("Input data: " . json_encode($input));
        
        if (!isset($input['idNumber']) || !isset($input['firstName']) || !isset($input['lastName']) || !isset($input['email']) || !isset($input['password'])) {
            debug_log("Missing required fields");
            http_response_code(400);
            $response['message'] = 'Missing required fields';
            echo json_encode($response);
            exit();
        }

        $id_number = $db->real_escape_string($input['idNumber']);
        $first_name = $db->real_escape_string($input['firstName']);
        $last_name = $db->real_escape_string($input['lastName']);
        $middle_name = $db->real_escape_string($input['middleName'] ?? '');
        $email = $db->real_escape_string($input['email']);
        $password = password_hash($input['password'], PASSWORD_BCRYPT);
        $course = $db->real_escape_string($input['course'] ?? '');
        $year_level = intval($input['courseLevel'] ?? 0);
        $address = $db->real_escape_string($input['address'] ?? '');

        $insert_query = "INSERT INTO students (id_number, first_name, last_name, middle_name, email, password, course, year_level, address) 
                        VALUES ('$id_number', '$first_name', '$last_name', '$middle_name', '$email', '$password', '$course', $year_level, '$address')";

        debug_log("Executing insert query");

        if ($db->query($insert_query)) {
            debug_log("Registration successful for: " . $email);
            http_response_code(201);
            $response['success'] = true;
            $response['message'] = 'Registration successful';
            echo json_encode($response);
        } else {
            debug_log("Insert query failed: " . $db->error);
            $error = $db->error;
            
            // Check for duplicate entry errors
            if (strpos($error, 'Duplicate entry') !== false || strpos($error, 'duplicate') !== false) {
                http_response_code(409);
                if (strpos($error, 'id_number') !== false) {
                    $response['message'] = 'Student ID is already exist.';
                } elseif (strpos($error, 'email') !== false) {
                    $response['message'] = 'Email is already exist';
                } else {
                    $response['message'] = 'Duplicate entry found.';
                }
            } else {
                http_response_code(500);
                $response['message'] = 'Registration failed';
            }
            echo json_encode($response);
        }
        exit();
    }

    // LOGIN ACTION
    elseif ($action === 'login' && $request_method === 'POST') {
        debug_log("Login action triggered");
        debug_log("Input data: " . json_encode($input));
        
        if (!isset($input['idNumber']) || !isset($input['password'])) {
            debug_log("Missing ID number or password");
            http_response_code(400);
            $response['message'] = 'ID number and password required';
            echo json_encode($response);
            exit();
        }

        $id_number = $db->real_escape_string($input['idNumber']);
        $password = $input['password'];

        if ($id_number === ADMIN_ID) {
            if (hash_equals(ADMIN_PASSWORD, $password)) {
                http_response_code(200);
                $response['success'] = true;
                $response['message'] = 'Login successful';
                $response['user'] = [
                    'id' => 0,
                    'id_number' => ADMIN_ID,
                    'first_name' => ADMIN_FIRST_NAME,
                    'last_name' => ADMIN_LAST_NAME,
                    'email' => ADMIN_EMAIL,
                    'role' => ADMIN_ROLE,
                ];
                echo json_encode($response);
            } else {
                http_response_code(401);
                $response['message'] = 'Invalid password';
                echo json_encode($response);
            }
            exit();
        }

        $query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture FROM students WHERE id_number = '$id_number'";
        $result = $db->query($query);

        debug_log("Login query executed for ID: " . $id_number);

        if ($result && $result->num_rows > 0) {
            $student = $result->fetch_assoc();
            debug_log("Student found: " . $student['id_number']);
            
            $stored_password_query = "SELECT password FROM students WHERE id = " . $student['id'];
            $pwd_result = $db->query($stored_password_query);
            $pwd_row = $pwd_result->fetch_assoc();

            if (password_verify($password, $pwd_row['password'])) {
                debug_log("Password verified for: " . $id_number);
                http_response_code(200);
                $response['success'] = true;
                $response['message'] = 'Login successful';
                $student['role'] = 'student';
                $response['user'] = $student;
                echo json_encode($response);
            } else {
                debug_log("Password verification failed for: " . $id_number);
                http_response_code(401);
                $response['message'] = 'Invalid password';
                echo json_encode($response);
            }
        } else {
            debug_log("User not found: " . $id_number);
            http_response_code(404);
            $response['message'] = 'User not found';
            echo json_encode($response);
        }
        exit();
    }

    // STUDENT: PROFILE STATS (SIT-IN ACTIVITY + LAB USAGE)
    elseif ($action === 'studentProfileStats' && $request_method === 'POST') {
        $id_number = $db->real_escape_string(trim($input['idNumber'] ?? ''));
        if ($id_number === '') {
            http_response_code(400);
            $response['message'] = 'ID number is required';
            echo json_encode($response);
            exit();
        }

        $stats_query = "SELECT
                            COUNT(*) AS total_sessions,
                            COALESCE(SUM(duration_minutes), 0) AS total_minutes,
                            SUM(CASE WHEN YEAR(started_at) = YEAR(CURDATE()) AND MONTH(started_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) AS this_month,
                            COUNT(DISTINCT YEARWEEK(started_at, 1)) AS active_weeks
                        FROM sit_in_records
                        WHERE student_id_number = '$id_number'";
        $stats_result = $db->query($stats_query);

        if (!$stats_result) {
            http_response_code(500);
            $response['message'] = 'Failed to load sit-in activity';
            echo json_encode($response);
            exit();
        }

        $stats_row = $stats_result->fetch_assoc();
        $total_sessions = intval($stats_row['total_sessions'] ?? 0);
        $total_minutes = intval($stats_row['total_minutes'] ?? 0);
        $this_month = intval($stats_row['this_month'] ?? 0);
        $active_weeks = intval($stats_row['active_weeks'] ?? 0);
        $hours_logged = round($total_minutes / 60, 1);
        $avg_per_week = $active_weeks > 0 ? round($total_sessions / $active_weeks, 1) : 0;

        $labs_query = "SELECT
                          COALESCE(NULLIF(TRIM(room), ''), 'Unspecified') AS lab,
                          COUNT(*) AS session_count
                       FROM sit_in_records
                       WHERE student_id_number = '$id_number'
                       GROUP BY COALESCE(NULLIF(TRIM(room), ''), 'Unspecified')
                       ORDER BY session_count DESC
                       LIMIT 3";
        $labs_result = $db->query($labs_query);

        if (!$labs_result) {
            http_response_code(500);
            $response['message'] = 'Failed to load lab usage';
            echo json_encode($response);
            exit();
        }

        $lab_usage = [];
        while ($lab_row = $labs_result->fetch_assoc()) {
            $count = intval($lab_row['session_count'] ?? 0);
            $pct = $total_sessions > 0 ? intval(round(($count / $total_sessions) * 100)) : 0;
            $lab_usage[] = [
                'lab' => $lab_row['lab'],
                'count' => $count,
                'pct' => $pct,
            ];
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Profile stats loaded';
        $response['stats'] = [
            'total_sessions' => $total_sessions,
            'this_month' => $this_month,
            'hours_logged' => $hours_logged,
            'avg_per_week' => $avg_per_week,
            'lab_usage' => $lab_usage,
        ];
        echo json_encode($response);
        exit();
    }

    // ADMIN: LIST ALL STUDENTS
    elseif ($action === 'adminListStudents' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $list_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
                       FROM students
                       ORDER BY id DESC";
        $list_result = $db->query($list_query);
        if (!$list_result) {
            http_response_code(500);
            $response['message'] = 'Failed to load students';
            echo json_encode($response);
            exit();
        }

        $students = [];
        while ($row = $list_result->fetch_assoc()) {
            $row['role'] = 'student';
            $students[] = $row;
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Students loaded';
        $response['students'] = $students;
        echo json_encode($response);
        exit();
    }

    // ADMIN: SEARCH STUDENT
    elseif ($action === 'adminSearchStudent' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $keyword = trim($input['studentKeyword'] ?? '');
        if ($keyword === '') {
            http_response_code(400);
            $response['message'] = 'Student keyword is required';
            echo json_encode($response);
            exit();
        }

        $keyword_escaped = $db->real_escape_string($keyword);
        $search_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
                         FROM students
                         WHERE id_number LIKE '%$keyword_escaped%'
                            OR first_name LIKE '%$keyword_escaped%'
                            OR last_name LIKE '%$keyword_escaped%'
                         ORDER BY id DESC
                         LIMIT 20";

        $search_result = $db->query($search_query);
        if (!$search_result) {
            http_response_code(500);
            $response['message'] = 'Search failed';
            echo json_encode($response);
            exit();
        }

        $students = [];
        while ($row = $search_result->fetch_assoc()) {
            $row['role'] = 'student';
            $students[] = $row;
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Search completed';
        $response['students'] = $students;
        echo json_encode($response);
        exit();
    }

    // ADMIN: UPDATE STUDENT
    elseif ($action === 'adminUpdateStudent' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $student_id = intval($input['id'] ?? 0);
        if ($student_id <= 0) {
            http_response_code(400);
            $response['message'] = 'Invalid student ID';
            echo json_encode($response);
            exit();
        }

        $first_name = $db->real_escape_string(trim($input['firstName'] ?? ''));
        $last_name = $db->real_escape_string(trim($input['lastName'] ?? ''));
        $middle_name = $db->real_escape_string(trim($input['middleName'] ?? ''));
        $course = $db->real_escape_string(trim($input['course'] ?? ''));
        $year_level = intval($input['yearLevel'] ?? 0);
        $address = $db->real_escape_string(trim($input['address'] ?? ''));
        $available_sessions = intval($input['availableSessions'] ?? 0);

        if ($first_name === '' || $last_name === '') {
            http_response_code(400);
            $response['message'] = 'First name and last name are required';
            echo json_encode($response);
            exit();
        }

        $update_student_query = "UPDATE students
                                 SET first_name = '$first_name',
                                     last_name = '$last_name',
                                     middle_name = '$middle_name',
                                     course = '$course',
                                     year_level = $year_level,
                                     address = '$address',
                                     available_sessions = $available_sessions
                                 WHERE id = $student_id";
        if (!$db->query($update_student_query)) {
            http_response_code(500);
            $response['message'] = 'Failed to update student';
            echo json_encode($response);
            exit();
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Student updated successfully';
        echo json_encode($response);
        exit();
    }

    // ADMIN: DELETE STUDENT
    elseif ($action === 'adminDeleteStudent' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $student_id = intval($input['id'] ?? 0);
        if ($student_id <= 0) {
            http_response_code(400);
            $response['message'] = 'Invalid student ID';
            echo json_encode($response);
            exit();
        }

        $delete_query = "DELETE FROM students WHERE id = $student_id";
        if (!$db->query($delete_query)) {
            http_response_code(500);
            $response['message'] = 'Failed to delete student';
            echo json_encode($response);
            exit();
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Student deleted successfully';
        echo json_encode($response);
        exit();
    }

    // ADMIN: START SIT-IN SESSION
    elseif ($action === 'adminStartSession' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $student_id_number = $db->real_escape_string(trim($input['studentIdNumber'] ?? ''));
        $room = $db->real_escape_string(trim($input['room'] ?? ''));
        $purpose = $db->real_escape_string(trim($input['purpose'] ?? ''));
        if ($student_id_number === '') {
            http_response_code(400);
            $response['message'] = 'Student ID number is required';
            echo json_encode($response);
            exit();
        }
        if ($room === '' || $purpose === '') {
            http_response_code(400);
            $response['message'] = 'Room and purpose are required';
            echo json_encode($response);
            exit();
        }

        $student_query = "SELECT id, id_number, available_sessions FROM students WHERE id_number = '$student_id_number' LIMIT 1";
        $student_result = $db->query($student_query);
        if (!$student_result || $student_result->num_rows === 0) {
            http_response_code(404);
            $response['message'] = 'Student not found';
            echo json_encode($response);
            exit();
        }

        $student = $student_result->fetch_assoc();
        if ((int)$student['available_sessions'] <= 0) {
            http_response_code(400);
            $response['message'] = 'Student has no available sessions left';
            echo json_encode($response);
            exit();
        }

        $active_check_query = "SELECT id FROM sit_in_sessions WHERE student_id = {$student['id']} AND status = 'active' LIMIT 1";
        $active_check_result = $db->query($active_check_query);
        if ($active_check_result && $active_check_result->num_rows > 0) {
            http_response_code(409);
            $response['message'] = 'Student already has an active sit-in session';
            echo json_encode($response);
            exit();
        }

        $start_session_query = "INSERT INTO sit_in_sessions (student_id, student_id_number, room, purpose, status)
                    VALUES ({$student['id']}, '{$student['id_number']}', '$room', '$purpose', 'active')";
        if (!$db->query($start_session_query)) {
            http_response_code(500);
            $response['message'] = 'Failed to initiate sit-in session';
            echo json_encode($response);
            exit();
        }

        http_response_code(201);
        $response['success'] = true;
        $response['message'] = 'Sit-in session initiated successfully';
        $response['sessionId'] = $db->insert_id;
        echo json_encode($response);
        exit();
    }

    // ADMIN: VIEW CURRENT SESSIONS
    elseif ($action === 'adminCurrentSessions' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $sessions_query = "SELECT s.id, s.student_id, s.student_id_number, s.room, s.purpose, s.started_at,
                      st.first_name, st.last_name, st.course, st.year_level, st.available_sessions, st.profile_picture
                           FROM sit_in_sessions s
                           INNER JOIN students st ON st.id = s.student_id
                           WHERE s.status = 'active'
                          ORDER BY s.started_at ASC, s.id ASC";
        $sessions_result = $db->query($sessions_query);

        if (!$sessions_result) {
            http_response_code(500);
            $response['message'] = 'Failed to load current sessions';
            echo json_encode($response);
            exit();
        }

        $sessions = [];
        while ($row = $sessions_result->fetch_assoc()) {
            $sessions[] = $row;
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Current sessions loaded';
        $response['sessions'] = $sessions;
        echo json_encode($response);
        exit();
    }

    // ADMIN: END SESSION (DEDUCT + PERMANENT RECORD)
    elseif ($action === 'adminEndSession' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $session_id = intval($input['sessionId'] ?? 0);
        if ($session_id <= 0) {
            http_response_code(400);
            $response['message'] = 'Valid session ID is required';
            echo json_encode($response);
            exit();
        }

        $db->begin_transaction();
        try {
                 $session_query = "SELECT s.id, s.student_id, s.student_id_number, s.room, s.purpose, s.started_at,
                                     st.available_sessions
                              FROM sit_in_sessions s
                              INNER JOIN students st ON st.id = s.student_id
                              WHERE s.id = $session_id AND s.status = 'active'
                              LIMIT 1";
            $session_result = $db->query($session_query);

            if (!$session_result || $session_result->num_rows === 0) {
                throw new Exception('Active session not found');
            }

            $session = $session_result->fetch_assoc();

            $end_query = "UPDATE sit_in_sessions
                          SET status = 'ended', ended_at = NOW(), ended_by = '" . ADMIN_ID . "'
                          WHERE id = $session_id AND status = 'active'";
            if (!$db->query($end_query) || $db->affected_rows === 0) {
                throw new Exception('Failed to end session');
            }

            $deduct_query = "UPDATE students
                             SET available_sessions = CASE
                                 WHEN available_sessions > 0 THEN available_sessions - 1
                                 ELSE 0
                             END
                             WHERE id = {$session['student_id']}";
            if (!$db->query($deduct_query)) {
                throw new Exception('Failed to deduct student session');
            }

            $record_query = "INSERT INTO sit_in_records
                            (session_id, student_id, student_id_number, room, purpose, started_at, ended_at, duration_minutes, ended_by)
                            VALUES
                            ($session_id, {$session['student_id']}, '{$session['student_id_number']}', '{$session['room']}', '{$session['purpose']}', '{$session['started_at']}', NOW(),
                             TIMESTAMPDIFF(MINUTE, '{$session['started_at']}', NOW()), '" . ADMIN_ID . "')";
            if (!$db->query($record_query)) {
                throw new Exception('Failed to write sit-in record');
            }

            $db->commit();

            http_response_code(200);
            $response['success'] = true;
            $response['message'] = 'Session ended. One session deducted and recorded permanently.';
            echo json_encode($response);
            exit();
        } catch (Exception $txe) {
            $db->rollback();
            http_response_code(500);
            $response['message'] = $txe->getMessage();
            echo json_encode($response);
            exit();
        }
    }

    // ADMIN: VIEW PERMANENT SIT-IN RECORDS
    elseif ($action === 'adminSitInRecords' && $request_method === 'POST') {
        if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
            http_response_code(403);
            $response['message'] = 'Unauthorized admin request';
            echo json_encode($response);
            exit();
        }

        $records_query = "SELECT r.id, r.session_id, r.student_id_number, r.room, r.purpose, r.started_at, r.ended_at, r.duration_minutes, r.ended_by,
                     st.first_name, st.last_name, st.course, st.year_level, st.profile_picture
                          FROM sit_in_records r
                          LEFT JOIN students st ON st.id = r.student_id
                         ORDER BY r.created_at ASC, r.id ASC
                          LIMIT 200";
        $records_result = $db->query($records_query);

        if (!$records_result) {
            http_response_code(500);
            $response['message'] = 'Failed to load sit-in records';
            echo json_encode($response);
            exit();
        }

        $records = [];
        while ($row = $records_result->fetch_assoc()) {
            $records[] = $row;
        }

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Sit-in records loaded';
        $response['records'] = $records;
        echo json_encode($response);
        exit();
    }

    // UPDATE PROFILE ACTION
    elseif ($action === 'updateProfile' && $request_method === 'POST') {
        debug_log("Update profile action triggered");
        debug_log("Input data: " . json_encode($input));

        if (!isset($input['idNumber'])) {
            http_response_code(400);
            $response['message'] = 'ID number is required';
            echo json_encode($response);
            exit();
        }

        $id_number = $db->real_escape_string($input['idNumber']);
        $first_name = $db->real_escape_string(trim($input['firstName'] ?? ''));
        $last_name = $db->real_escape_string(trim($input['lastName'] ?? ''));
        $middle_name = $db->real_escape_string(trim($input['middleName'] ?? ''));
        $address = $db->real_escape_string(trim($input['address'] ?? ''));
        $profile_picture = isset($input['photo']) ? $db->real_escape_string($input['photo']) : null;

        if ($first_name === '' || $last_name === '') {
            http_response_code(400);
            $response['message'] = 'First name and last name are required';
            echo json_encode($response);
            exit();
        }

        $update_query = "UPDATE students
                         SET first_name = '$first_name',
                             last_name = '$last_name',
                             middle_name = '$middle_name',
                             address = '$address'" . ($profile_picture ? ", profile_picture = '$profile_picture'" : "") . "
                         WHERE id_number = '$id_number'";

        if (!$db->query($update_query)) {
            debug_log("Profile update failed: " . $db->error);
            http_response_code(500);
            $response['message'] = 'Failed to update profile';
            echo json_encode($response);
            exit();
        }

        if ($db->affected_rows < 0) {
            http_response_code(500);
            $response['message'] = 'Failed to update profile';
            echo json_encode($response);
            exit();
        }

        $fetch_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, profile_picture
                        FROM students WHERE id_number = '$id_number' LIMIT 1";
        $fetch_result = $db->query($fetch_query);

        if (!$fetch_result || $fetch_result->num_rows === 0) {
            http_response_code(404);
            $response['message'] = 'User not found';
            echo json_encode($response);
            exit();
        }

        $student = $fetch_result->fetch_assoc();
        $student['role'] = 'student';

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Profile updated successfully';
        $response['user'] = $student;
        echo json_encode($response);
        exit();
    }

    // DEFAULT RESPONSE
    else {
        http_response_code(400);
        $response['message'] = 'Invalid action or method';
        echo json_encode($response);
    }

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Error: ' . $e->getMessage();
    echo json_encode($response);
} finally {
    $db->close();
}
?>
