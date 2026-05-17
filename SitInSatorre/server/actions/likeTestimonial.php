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

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $record_id = intval($input['record_id'] ?? 0);
    
    if ($record_id <= 0) {
        throw new Exception('Invalid testimonial ID');
    }
    
    // Ensure likes_count column exists
    $conn->query("ALTER TABLE sit_in_records ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0");
    
    // Increment the likes count
    $sql = "UPDATE sit_in_records SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param('i', $record_id);
    if ($stmt->execute()) {
        // Fetch new likes count
        $fetch_stmt = $conn->prepare("SELECT COALESCE(likes_count, 0) as likes FROM sit_in_records WHERE id = ?");
        $fetch_stmt->bind_param('i', $record_id);
        $fetch_stmt->execute();
        $likes = $fetch_stmt->get_result()->fetch_assoc()['likes'] ?? 0;
        
        echo json_encode([
            'success' => true,
            'likes' => intval($likes),
            'message' => 'Testimonial liked'
        ]);
    } else {
        throw new Exception('Failed to update likes count');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
