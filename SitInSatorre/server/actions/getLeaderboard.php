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
    // Query top 5 students with the most total sit-in hours
    $sql = "SELECT 
            s.id,
            s.first_name,
            s.last_name,
            s.course,
            s.profile_picture,
            COALESCE(ROUND(SUM(r.duration_minutes) / 60, 1), 0) as total_hours,
            COUNT(r.id) as total_sessions
            FROM students s
            JOIN sit_in_records r ON s.id = r.student_id
            WHERE r.status = 'completed'
            GROUP BY s.id
            ORDER BY total_hours DESC
            LIMIT 5";
            
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $leaderboard = [];
    while ($row = $result->fetch_assoc()) {
        $leaderboard[] = [
            'id' => intval($row['id']),
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'course' => $row['course'],
            'total_hours' => floatval($row['total_hours']),
            'total_sessions' => intval($row['total_sessions']),
            'profile_picture' => $row['profile_picture']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $leaderboard
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
