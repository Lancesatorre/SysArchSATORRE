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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../database.php';

// Check if student is logged in
session_start();
if (!isset($_SESSION['student_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized'
    ]);
    exit;
}

try {
    // Get DELETE data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $student_id = $_SESSION['student_id'];
    $reservation_id = isset($input['reservation_id']) ? intval($input['reservation_id']) : null;
    
    if (!$reservation_id) {
        throw new Exception('Missing reservation ID');
    }
    
    // Verify reservation belongs to student and is pending
    $sql_check = "SELECT id, status FROM reservations 
                 WHERE id = ? AND student_id = ?";
    
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bind_param('ii', $reservation_id, $student_id);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    
    if ($result_check->num_rows === 0) {
        throw new Exception('Reservation not found');
    }
    
    $row = $result_check->fetch_assoc();
    
    if ($row['status'] !== 'pending') {
        throw new Exception('Can only delete pending reservations');
    }
    
    // Delete reservation
    $sql_delete = "DELETE FROM reservations WHERE id = ? AND student_id = ?";
    
    $stmt_delete = $conn->prepare($sql_delete);
    $stmt_delete->bind_param('ii', $reservation_id, $student_id);
    
    if (!$stmt_delete->execute()) {
        throw new Exception('Failed to delete reservation: ' . $stmt_delete->error);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Reservation deleted successfully'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
