<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../database.php';

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
    $student_id = $_SESSION['student_id'];
    
    // Get POST input data
    $input = json_decode(file_get_contents('php://input'), true);
    $record_id = intval($input['record_id'] ?? 0);
    $feedback = trim($input['feedback'] ?? '');
    $rating = intval($input['rating'] ?? 5);
    
    if ($record_id <= 0) {
        throw new Exception('Invalid record ID');
    }
    
    if ($rating < 1 || $rating > 5) {
        $rating = 5;
    }
    
    // Ensure student_rating column exists in sit_in_records
    $conn->query("ALTER TABLE sit_in_records ADD COLUMN IF NOT EXISTS student_rating INT DEFAULT 5");
    
    // Update the sit-in record feedback
    $sql = "UPDATE sit_in_records 
            SET student_feedback = ?, student_rating = ? 
            WHERE id = ? AND student_id = ?";
            
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param('siii', $feedback, $rating, $record_id, $student_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Feedback submitted successfully'
        ]);
    } else {
        throw new Exception('Failed to update feedback');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
