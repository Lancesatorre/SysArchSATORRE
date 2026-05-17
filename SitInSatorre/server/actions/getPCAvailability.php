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

require_once '../config.php';
require_once '../database.php';

try {
    $lab_id = isset($_GET['lab_id']) ? intval($_GET['lab_id']) : null;
    $date = isset($_GET['date']) ? $_GET['date'] : null;
    $time_slot = isset($_GET['time_slot']) ? $_GET['time_slot'] : null;
    
    if (!$lab_id || !$date || !$time_slot) {
        throw new Exception('Missing required parameters: lab_id, date, time_slot');
    }
    
    $db = connect_db();
    initialize_schema($db);
    
    // Get time slot details
    $time_slots = [
        'slot1' => ['start' => '09:00', 'end' => '13:00'],
        'slot2' => ['start' => '13:00', 'end' => '17:00'],
        'slot3' => ['start' => '09:00', 'end' => '17:00'],
    ];
    
    if (!isset($time_slots[$time_slot])) {
        throw new Exception('Invalid time slot');
    }
    
    $slot_start = $time_slots[$time_slot]['start'];
    $slot_end = $time_slots[$time_slot]['end'];
    
    // Get all PCs in the lab
    $sql = "SELECT id, pc_number, status 
            FROM pcs 
            WHERE lab_id = ? AND status = 'available'
            ORDER BY pc_number ASC";
    
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $lab_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $pcs = [];
    while ($row = $result->fetch_assoc()) {
        // Check if PC is reserved for this date/time
        $check_sql = "SELECT id FROM reservations 
                     WHERE pc_id = ? 
                     AND reservation_date = ?
                     AND TIME(time_from) = ?
                     AND status IN ('pending', 'approved')";
        
        $check_stmt = $db->prepare($check_sql);
        $check_stmt->bind_param('iss', $row['id'], $date, $slot_start);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();
        $is_reserved = $check_result->num_rows > 0;
        
        $pcs[] = [
            'id' => intval($row['id']),
            'pc_number' => $row['pc_number'],
            'available' => !$is_reserved
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $pcs
    ]);
    
    $db->close();
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
