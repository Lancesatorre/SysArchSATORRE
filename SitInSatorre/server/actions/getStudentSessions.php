<?php
header('Content-Type: application/json');
require_once '../config.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = get_allowed_origins();

if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../database.php';

// Check if student is logged in
session_start();
$student_id = null;

if (isset($_SESSION['student_id'])) {
    $student_id = intval($_SESSION['student_id']);
} else {
    // Fallback: Check if student id_number is passed from the request
    $id_number = isset($_GET['idNumber']) ? $_GET['idNumber'] : (isset($_GET['id_number']) ? $_GET['id_number'] : null);
    if ($id_number) {
        $student_stmt = $conn->prepare("SELECT id FROM students WHERE id_number = ?");
        $student_stmt->bind_param("s", $id_number);
        $student_stmt->execute();
        $student_res = $student_stmt->get_result()->fetch_assoc();
        if ($student_res) {
            $student_id = intval($student_res['id']);
        }
    }
}

if (!$student_id) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

try {
    
    // Get filter parameters
    $lab_id = isset($_GET['lab_id']) ? $_GET['lab_id'] : null;
    $lab_name = isset($_GET['lab_name']) ? $_GET['lab_name'] : null;
    $start_date = isset($_GET['start_date']) ? $_GET['start_date'] : null;
    $end_date = isset($_GET['end_date']) ? $_GET['end_date'] : null;
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $per_page = isset($_GET['per_page']) ? intval($_GET['per_page']) : 10;
    $sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'session_date';
    $sort_order = isset($_GET['sort_order']) ? strtoupper($_GET['sort_order']) : 'DESC';
    
    // Validate sort order
    if ($sort_order !== 'ASC') {
        $sort_order = 'DESC';
    }
    
    // Map sort key to columns
    $sort_map = [
        'session_date' => 'r.started_at',
        'time_in' => 'r.started_at',
        'time_out' => 'r.ended_at',
        'duration_minutes' => 'r.duration_minutes',
        'pc_number' => 'pc_number',
        'lab_name' => 'r.room',
        'status' => 'r.status'
    ];
    $sort_column = isset($sort_map[$sort_by]) ? $sort_map[$sort_by] : 'r.started_at';
    
    // Build base query
    $where_conditions = ["r.student_id = ?"];
    $params = [$student_id];
    $types = 'i';
    
    // Add filters
    if ($lab_name) {
        $where_conditions[] = "r.room = ?";
        $params[] = $lab_name;
        $types .= 's';
    } elseif ($lab_id) {
        if (is_numeric($lab_id)) {
            // Fetch lab name to match room column in sit_in_records
            $lab_stmt = $conn->prepare("SELECT lab_name FROM labs WHERE id = ?");
            $lab_stmt->bind_param("i", $lab_id);
            $lab_stmt->execute();
            $lab_res = $lab_stmt->get_result()->fetch_assoc();
            $lab_name = $lab_res ? $lab_res['lab_name'] : '';
        } else {
            $lab_name = $lab_id;
        }
        
        $where_conditions[] = "r.room = ?";
        $params[] = $lab_name;
        $types .= 's';
    }
    
    if ($start_date) {
        $where_conditions[] = "DATE(r.started_at) >= ?";
        $params[] = $start_date;
        $types .= 's';
    }
    
    if ($end_date) {
        $where_conditions[] = "DATE(r.started_at) <= ?";
        $params[] = $end_date;
        $types .= 's';
    }
    
    $where_clause = implode(' AND ', $where_conditions);
    
    // Get total count
    $sql_count = "SELECT COUNT(*) as total 
                  FROM sit_in_records r 
                  WHERE $where_clause";
    
    $stmt_count = $conn->prepare($sql_count);
    $stmt_count->bind_param($types, ...$params);
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $row_count = $result_count->fetch_assoc();
    $total_count = intval($row_count['total']);

    // Get unique rooms/labs for this student
    $sql_unique_labs = "SELECT DISTINCT room as lab_name FROM sit_in_records WHERE student_id = ? AND room IS NOT NULL AND room != ''";
    $stmt_ulabs = $conn->prepare($sql_unique_labs);
    $stmt_ulabs->bind_param('i', $student_id);
    $stmt_ulabs->execute();
    $res_ulabs = $stmt_ulabs->get_result();
    $available_labs = [];
    while ($row = $res_ulabs->fetch_assoc()) {
        $available_labs[] = $row['lab_name'];
    }
    
    // Pagination offset
    $offset = ($page - 1) * $per_page;
    
    // Get sessions
    $sql = "SELECT 
            r.id as session_id,
            DATE(r.started_at) as session_date,
            r.started_at as time_in,
            r.ended_at as time_out,
            r.duration_minutes,
            COALESCE(r.pc_number, res.pc_number) as pc_number,
            CASE WHEN r.reservation_id IS NOT NULL THEN 'Reservation' ELSE 'Walk-in' END as entry_type,
            r.room as lab_name,
            r.status,
            r.admin_feedback,
            r.student_feedback,
            COALESCE(r.student_rating, 5) as student_rating
            FROM sit_in_records r
            LEFT JOIN reservations res ON r.reservation_id = res.id
            WHERE $where_clause
            ORDER BY $sort_column $sort_order
            LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($sql);
    
    // Clone params & types to append pagination
    $query_params = $params;
    $query_types = $types;
    
    $query_params[] = $per_page;
    $query_params[] = $offset;
    $query_types .= 'ii';
    
    $stmt->bind_param($query_types, ...$query_params);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sessions = [];
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'sessions' => $sessions,
            'total_count' => $total_count,
            'available_labs' => $available_labs
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
