<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Admin credentials
define('ADMIN_ID', 'A-0000');
define('ADMIN_PASSWORD', 'admin123!');
define('ADMIN_FIRST_NAME', 'Admin');
define('ADMIN_LAST_NAME', 'User');
define('ADMIN_EMAIL', 'admin@sit-in.local');
define('ADMIN_ROLE', 'admin');

// Get the origin from the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';

// Set response content type early; CORS headers handled by .htaccess
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
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (!$db->query($create_table_query)) {
    debug_log("Failed to create table: " . $db->error);
} else {
    debug_log("Table created or already exists");
}

// Get action and request data
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
            if ($password === ADMIN_PASSWORD) {
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

        $query = "SELECT id, id_number, first_name, last_name, email FROM students WHERE id_number = '$id_number'";
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
