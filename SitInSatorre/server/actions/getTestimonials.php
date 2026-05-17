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
    // Self-healing database structure check
    $conn->query("ALTER TABLE sit_in_records ADD COLUMN IF NOT EXISTS student_rating INT DEFAULT 5");
    $conn->query("ALTER TABLE sit_in_records ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0");

    // Fetch the 6 most recent 4 or 5-star testimonials with non-empty feedback, sorted by likes count DESC
    $sql = "SELECT 
            r.id as record_id,
            r.student_feedback,
            r.student_rating,
            COALESCE(r.likes_count, 0) as likes,
            r.room,
            r.ended_at,
            s.first_name,
            s.last_name,
            s.course,
            s.profile_picture
            FROM sit_in_records r
            JOIN students s ON r.student_id = s.id
            WHERE r.student_feedback IS NOT NULL 
            AND TRIM(r.student_feedback) != ''
            AND r.student_rating >= 4
            ORDER BY likes DESC, r.id DESC
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
            'room' => $row['room'],
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
