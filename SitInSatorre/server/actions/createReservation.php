<?php
header('Content-Type: application/json');
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
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    $student_id = $_SESSION['student_id'];
    $lab_id = isset($input['lab_id']) ? intval($input['lab_id']) : null;
    $pc_number = isset($input['pc_number']) ? $input['pc_number'] : null;
    $reservation_date = isset($input['reservation_date']) ? $input['reservation_date'] : null;
    $time_slot = isset($input['time_slot']) ? $input['time_slot'] : null;
    
    // Validation
    if (!$lab_id || !$pc_number || !$reservation_date || !$time_slot) {
        throw new Exception('Missing required fields');
    }
    
    // Validate date is in future
    if (strtotime($reservation_date) < strtotime('today')) {
        throw new Exception('Cannot reserve for past dates');
    }
    
    // Get time slot details
    $time_slots = [
        'slot1' => ['start' => '09:00', 'end' => '13:00'],
        'slot2' => ['start' => '13:00', 'end' => '17:00'],
        'slot3' => ['start' => '09:00', 'end' => '17:00'],
    ];
    
    if (!isset($time_slots[$time_slot])) {
        throw new Exception('Invalid time slot');
    }
    
    $time_from = $time_slots[$time_slot]['start'];
    $time_to = $time_slots[$time_slot]['end'];
    
    // Get PC ID from PC number
    $sql_pc = "SELECT id FROM pcs WHERE lab_id = ? AND pc_number = ? AND status = 'available'";
    $stmt_pc = $conn->prepare($sql_pc);
    $stmt_pc->bind_param('is', $lab_id, $pc_number);
    $stmt_pc->execute();
    $result_pc = $stmt_pc->get_result();
    
    if ($result_pc->num_rows === 0) {
        throw new Exception('PC not found or unavailable');
    }
    
    $row_pc = $result_pc->fetch_assoc();
    $pc_id = $row_pc['id'];
    
    // Check if PC is already reserved for this date/time
    $sql_check = "SELECT id FROM reservations 
                 WHERE pc_id = ? 
                 AND reservation_date = ?
                 AND TIME(time_from) = ?
                 AND status IN ('pending', 'approved')";
    
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bind_param('iss', $pc_id, $reservation_date, $time_from);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();
    
    if ($result_check->num_rows > 0) {
        throw new Exception('This PC is already reserved for the selected time slot');
    }
    
    // Create reservation
    $sql_insert = "INSERT INTO reservations 
                  (student_id, pc_id, lab_id, pc_number, reservation_date, time_from, time_to, status, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())";
    
    $stmt_insert = $conn->prepare($sql_insert);
    if (!$stmt_insert) {
        throw new Exception('Prepare failed: ' . $conn->error);
    }
    
    $stmt_insert->bind_param('iisssss', $student_id, $pc_id, $lab_id, $pc_number, $reservation_date, $time_from, $time_to);
    
    if (!$stmt_insert->execute()) {
        throw new Exception('Failed to create reservation: ' . $stmt_insert->error);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Reservation created successfully',
        'reservation_id' => $stmt_insert->insert_id
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
