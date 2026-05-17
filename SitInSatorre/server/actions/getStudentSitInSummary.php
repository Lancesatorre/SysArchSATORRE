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
    
    // Get total hours (converted from duration_minutes)
    $sql_hours = "SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 as total_hours
                  FROM sit_in_records 
                  WHERE student_id = ? AND status = 'Completed'";
    
    $stmt_hours = $conn->prepare($sql_hours);
    $stmt_hours->bind_param('i', $student_id);
    $stmt_hours->execute();
    $result_hours = $stmt_hours->get_result();
    $row_hours = $result_hours->fetch_assoc();
    $total_hours = floatval($row_hours['total_hours']);
    
    // Get session count
    $sql_count = "SELECT COUNT(*) as session_count 
                  FROM sit_in_records 
                  WHERE student_id = ? AND status = 'Completed'";
    
    $stmt_count = $conn->prepare($sql_count);
    $stmt_count->bind_param('i', $student_id);
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $row_count = $result_count->fetch_assoc();
    $session_count = intval($row_count['session_count']);
    
    // Get average duration in hours
    $average_duration = $session_count > 0 ? ($total_hours / $session_count) : 0;
    
    // Get longest session duration in hours
    $sql_longest = "SELECT COALESCE(MAX(duration_minutes), 0) / 60.0 as longest_session
                    FROM sit_in_records 
                    WHERE student_id = ? AND status = 'Completed'";
    
    $stmt_longest = $conn->prepare($sql_longest);
    $stmt_longest->bind_param('i', $student_id);
    $stmt_longest->execute();
    $result_longest = $stmt_longest->get_result();
    $row_longest = $result_longest->fetch_assoc();
    $longest_session = floatval($row_longest['longest_session']);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_hours' => $total_hours,
            'session_count' => $session_count,
            'average_duration' => $average_duration,
            'longest_session' => $longest_session
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
