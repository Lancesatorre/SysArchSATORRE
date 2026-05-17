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
    $student_id = $_SESSION['student_id'];
    
    // Auto mark approved reservations as absent if they are 15 minutes past start time (time_from)
    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');
    
    $cleanup_sql = "UPDATE reservations 
                    SET status = 'failed_to_appear' 
                    WHERE status = 'approved' 
                    AND (
                        reservation_date < '$current_date' 
                        OR (
                            reservation_date = '$current_date' 
                            AND TIME_TO_SEC(TIMEDIFF('$current_time', time_from)) > 900
                        )
                    )";
    $conn->query($cleanup_sql);

    // Auto decline pending reservations if they are 15 minutes past start time (time_from)
    $decline_pending_sql = "UPDATE reservations 
                            SET status = 'declined', decline_reason = 'Auto-declined: Exceeded 15 minutes past start time without approval' 
                            WHERE status = 'pending' 
                            AND (
                                reservation_date < '$current_date' 
                                OR (
                                    reservation_date = '$current_date' 
                                    AND TIME_TO_SEC(TIMEDIFF('$current_time', time_from)) > 900
                                )
                            )";
    $conn->query($decline_pending_sql);
    
    $sql = "SELECT 
            r.id,
            r.student_id,
            r.pc_id,
            r.lab_id,
            r.pc_number,
            l.lab_name,
            r.reservation_date,
            r.time_from,
            r.time_to,
            r.status,
            r.decline_reason,
            r.created_at,
            r.approved_at
            FROM reservations r
            JOIN labs l ON r.lab_id = l.id
            WHERE r.student_id = ?
            ORDER BY 
            CASE 
                WHEN r.status = 'pending' THEN 1
                WHEN r.status = 'approved' THEN 2
                ELSE 3
            END,
            r.reservation_date DESC";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt->bind_param('i', $student_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = [
            'id' => intval($row['id']),
            'student_id' => intval($row['student_id']),
            'pc_id' => intval($row['pc_id']),
            'lab_id' => intval($row['lab_id']),
            'pc_number' => $row['pc_number'],
            'lab_name' => $row['lab_name'],
            'reservation_date' => $row['reservation_date'],
            'time_from' => $row['time_from'],
            'time_to' => $row['time_to'],
            'status' => $row['status'],
            'decline_reason' => $row['decline_reason'],
            'created_at' => $row['created_at'],
            'approved_at' => $row['approved_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $reservations
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
