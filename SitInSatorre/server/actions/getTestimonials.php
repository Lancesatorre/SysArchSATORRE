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
    // Self-healing database structure check to guarantee likes_count column
    $conn->query("ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0");

    // Fetch the 6 most popular approved system testimonials, sorted by likes count DESC
    $sql = "SELECT 
            t.id as record_id,
            t.feedback as student_feedback,
            t.rating as student_rating,
            COALESCE(t.likes_count, 0) as likes,
            t.created_at as ended_at,
            s.first_name,
            s.last_name,
            s.course,
            s.profile_picture
            FROM testimonials t
            JOIN students s ON t.student_id_number = s.id_number
            WHERE t.status = 'approved'
            ORDER BY likes DESC, t.id DESC
            LIMIT 6";
            
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $testimonials = [];
    while ($row = $result->fetch_assoc()) {
        $testimonials[] = [
            'record_id' => intval($row['record_id']),
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'course' => $row['course'],
            'room' => 'System Review',
            'rating' => intval($row['student_rating']),
            'likes' => intval($row['likes']),
            'feedback' => $row['student_feedback'],
            'profile_picture' => $row['profile_picture'],
            'date' => date('M Y', strtotime($row['ended_at']))
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $testimonials
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
