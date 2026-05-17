<?php

function handle_admin_get_reservations(mysqli $db, array $input): void {
    try {
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
        $db->query($cleanup_sql);

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
        $db->query($decline_pending_sql);

        // Get pending reservations
        $pending_sql = "SELECT r.*, s.first_name, s.last_name, s.id_number, s.profile_picture, l.lab_name 
                       FROM reservations r 
                       JOIN students s ON r.student_id = s.id 
                       JOIN labs l ON r.lab_id = l.id 
                       WHERE r.status = 'pending' 
                       ORDER BY r.created_at DESC";
        $pending_result = $db->query($pending_sql);
        $pending = [];
        while ($row = $pending_result->fetch_assoc()) {
            $pending[] = $row;
        }

        // Get recent logs (approved/declined)
        $logs_sql = "SELECT r.*, s.first_name, s.last_name, s.id_number, s.profile_picture, l.lab_name 
                    FROM reservations r 
                    JOIN students s ON r.student_id = s.id 
                    JOIN labs l ON r.lab_id = l.id 
                    WHERE r.status != 'pending' 
                    ORDER BY r.created_at DESC 
                    LIMIT 50";
        $logs_result = $db->query($logs_sql);
        $logs = [];
        while ($row = $logs_result->fetch_assoc()) {
            $logs[] = $row;
        }

        $current_time = date('H:i:s');
        $current_date = date('Y-m-d');

        // Get lab/PC availability (dynamic free count)
        $labs_sql = "SELECT l.*, 
                    (SELECT COUNT(*) FROM pcs WHERE lab_id = l.id) as total_pcs,
                    (SELECT COUNT(*) FROM pcs p 
                     WHERE p.lab_id = l.id 
                     AND p.status = 'available'
                     AND NOT EXISTS (
                        SELECT 1 FROM reservations r 
                        WHERE r.pc_id = p.id 
                        AND r.reservation_date = '$current_date'
                        AND '$current_time' BETWEEN r.time_from AND r.time_to
                        AND r.status = 'approved'
                     )) as available_pcs
                    FROM labs l";
        $labs_result = $db->query($labs_sql);
        $labs = [];
        while ($row = $labs_result->fetch_assoc()) {
            $labs[] = $row;
        }

        json_response(200, [
            'success' => true,
            'data' => [
                'pending' => $pending,
                'logs' => $logs,
                'labs' => $labs
            ]
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function create_notification(mysqli $db, int $student_id, string $type, string $title, string $message): bool {
    $sql = "INSERT INTO student_notifications (student_id, type, title, message) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('isss', $student_id, $type, $title, $message);
    return $stmt->execute();
}

function handle_admin_approve_reservation(mysqli $db, array $input): void {
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid reservation ID']);
    }

    try {
        // Get reservation info before update to send notification
        $res_sql = "SELECT r.*, l.lab_name FROM reservations r JOIN labs l ON r.lab_id = l.id WHERE r.id = $id";
        $res_info = $db->query($res_sql)->fetch_assoc();

        if (!$res_info) {
            json_response(404, ['success' => false, 'message' => 'Reservation not found']);
        }

        $sql = "UPDATE reservations SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        if ($stmt->execute()) {
            create_notification(
                $db, 
                intval($res_info['student_id']), 
                'reservation_approved',
                'Reservation Approved',
                "Your reservation for " . $res_info['lab_name'] . " (Unit " . $res_info['pc_number'] . ") has been approved."
            );
            json_response(200, ['success' => true, 'message' => 'Reservation approved']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to approve reservation']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_admin_decline_reservation(mysqli $db, array $input): void {
    $id = intval($input['id'] ?? 0);
    $reason = esc($db, $input['reason'] ?? 'No reason provided');
    
    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid reservation ID']);
    }

    try {
        // Get reservation info before update
        $res_sql = "SELECT r.*, l.lab_name FROM reservations r JOIN labs l ON r.lab_id = l.id WHERE r.id = $id";
        $res_info = $db->query($res_sql)->fetch_assoc();

        if (!$res_info) {
            json_response(404, ['success' => false, 'message' => 'Reservation not found']);
        }

        $sql = "UPDATE reservations SET status = 'declined', decline_reason = ? WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('si', $reason, $id);
        
        if ($stmt->execute()) {
            create_notification(
                $db, 
                intval($res_info['student_id']), 
                'reservation_declined',
                'Reservation Declined',
                "Your reservation for " . $res_info['lab_name'] . " was declined. Reason: " . $reason
            );
            json_response(200, ['success' => true, 'message' => 'Reservation declined']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to decline reservation']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_admin_get_time_slots(mysqli $db, array $input): void {
    try {
        $sql = "SELECT * FROM time_slots WHERE is_active = 1 ORDER BY start_time ASC";
        $result = $db->query($sql);
        $slots = [];
        while ($row = $result->fetch_assoc()) {
            $slots[] = $row;
        }
        json_response(200, ['success' => true, 'data' => $slots]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_admin_get_lab_pcs(mysqli $db, array $input): void {
    $lab_id = intval($input['lab_id'] ?? 0);
    if ($lab_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid lab ID']);
    }

    try {
        $sql = "SELECT * FROM pcs WHERE lab_id = ? ORDER BY CAST(REPLACE(pc_number, 'PC-', '') AS UNSIGNED) ASC";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $lab_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $pcs = [];
        $current_time = date('H:i:s');
        $current_date = date('Y-m-d');

        while ($row = $result->fetch_assoc()) {
            // Check if PC is reserved RIGHT NOW
            $now_sql = "SELECT id FROM reservations 
                       WHERE pc_id = ? 
                       AND reservation_date = ?
                       AND ? BETWEEN time_from AND time_to
                       AND status = 'approved'";
            $now_stmt = $db->prepare($now_sql);
            $now_stmt->bind_param('iss', $row['id'], $current_date, $current_time);
            $now_stmt->execute();
            $is_reserved = $now_stmt->get_result()->num_rows > 0;

            $row['is_reserved'] = $is_reserved;
            $pcs[] = $row;
        }
        json_response(200, ['success' => true, 'data' => $pcs]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_admin_update_pc_status(mysqli $db, array $input): void {
    $pc_id = intval($input['pc_id'] ?? 0);
    $status = esc($db, $input['status'] ?? 'available');
    
    if ($pc_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid PC ID']);
    }

    try {
        $sql = "UPDATE pcs SET status = ? WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('si', $status, $pc_id);
        
        if ($stmt->execute()) {
            json_response(200, ['success' => true, 'message' => 'PC status updated']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to update PC status']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
function handle_admin_create_time_slot(mysqli $db, array $input): void {
    $name = esc($db, $input['slot_name'] ?? '');
    $start = esc($db, $input['start_time'] ?? '');
    $end = esc($db, $input['end_time'] ?? '');

    if (empty($name) || empty($start) || empty($end)) {
        json_response(400, ['success' => false, 'message' => 'All fields are required']);
    }

    try {
        // Check for duplicates
        $check_sql = "SELECT id FROM time_slots WHERE slot_name = ? AND start_time = ? AND end_time = ? AND is_active = 1";
        $check_stmt = $db->prepare($check_sql);
        $check_stmt->bind_param('sss', $name, $start, $end);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            json_response(400, ['success' => false, 'message' => 'A time slot with these exact details already exists']);
        }

        $sql = "INSERT INTO time_slots (slot_name, start_time, end_time) VALUES (?, ?, ?)";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('sss', $name, $start, $end);
        
        if ($stmt->execute()) {
            json_response(201, ['success' => true, 'message' => 'Time slot created']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to create time slot']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_admin_delete_time_slot(mysqli $db, array $input): void {
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid slot ID']);
    }

    try {
        $sql = "DELETE FROM time_slots WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        if ($stmt->execute()) {
            json_response(200, ['success' => true, 'message' => 'Time slot deleted']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to delete time slot']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
function handle_admin_clear_all_time_slots(mysqli $db, array $input): void {
    try {
        $sql = "DELETE FROM time_slots";
        if ($db->query($sql)) {
            json_response(200, ['success' => true, 'message' => 'All time slots cleared']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to clear time slots']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
function handle_admin_update_lab_status(mysqli $db, array $input): void {
    $lab_id = intval($input['lab_id'] ?? 0);
    $status = esc($db, $input['status'] ?? '');

    if ($lab_id <= 0 || !in_array($status, ['active', 'inactive'])) {
        json_response(400, ['success' => false, 'message' => 'Invalid lab ID or status']);
    }

    try {
        $sql = "UPDATE labs SET status = ? WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('si', $status, $lab_id);
        
        if ($stmt->execute()) {
            json_response(200, ['success' => true, 'message' => 'Laboratory status updated']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to update laboratory status']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_admin_bulk_update_pc_status(mysqli $db, array $input): void {
    $pc_ids = $input['pc_ids'] ?? [];
    $status = esc($db, $input['status'] ?? '');

    if (empty($pc_ids) || !is_array($pc_ids) || !in_array($status, ['available', 'disabled', 'maintenance'])) {
        json_response(400, ['success' => false, 'message' => 'Invalid PC IDs or status']);
    }

    try {
        $ids_str = implode(',', array_map('intval', $pc_ids));
        $sql = "UPDATE pcs SET status = '$status' WHERE id IN ($ids_str)";
        
        if ($db->query($sql)) {
            json_response(200, ['success' => true, 'message' => 'Workstations updated successfully']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to update workstations']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
function handle_get_audit_history(mysqli $db, array $input): void {
    $search = esc($db, $input['search'] ?? '');
    $status = esc($db, $input['status'] ?? '');
    $page = intval($input['page'] ?? 1);
    $limit = 6;
    $offset = ($page - 1) * $limit;

    try {
        $where = "WHERE r.status IN ('approved', 'declined', 'cancelled', 'completed', 'failed_to_appear')";
        if ($search !== '') {
            $where .= " AND (s.first_name LIKE '%$search%' OR s.last_name LIKE '%$search%' OR s.id_number LIKE '%$search%' OR r.pc_number LIKE '%$search%' OR l.lab_name LIKE '%$search%')";
        }
        if ($status !== '') {
            $where .= " AND r.status = '$status'";
        }

        $total_q = "SELECT COUNT(*) as count FROM reservations r JOIN students s ON r.student_id = s.id JOIN labs l ON r.lab_id = l.id $where";
        $total = $db->query($total_q)->fetch_assoc()['count'];

        $sql = "SELECT r.*, s.first_name, s.last_name, s.id_number, s.profile_picture, l.lab_name 
                FROM reservations r 
                JOIN students s ON r.student_id = s.id 
                JOIN labs l ON r.lab_id = l.id 
                $where 
                ORDER BY r.created_at DESC 
                LIMIT $limit OFFSET $offset";
        
        $result = $db->query($sql);
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }

        json_response(200, [
            'success' => true,
            'logs' => $logs,
            'totalPages' => ceil($total / $limit),
            'totalLogs' => $total
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_start_session(mysqli $db, array $input): void {
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) json_response(400, ['success' => false, 'message' => 'Invalid ID']);

    try {
        $db->begin_transaction();
        
        // 1. Get reservation info
        $res_sql = "SELECT r.*, s.id_number, l.lab_name 
                    FROM reservations r 
                    JOIN students s ON r.student_id = s.id 
                    JOIN labs l ON r.lab_id = l.id 
                    WHERE r.id = $id AND r.status = 'approved'";
        $res = $db->query($res_sql)->fetch_assoc();

        if (!$res) {
            throw new Exception('Reservation not found or not approved');
        }

        // 2. Update reservation status to active
        $db->query("UPDATE reservations SET status = 'active' WHERE id = $id");

        // 3. Create sit_in_session record
        $room = $res['lab_name'];
        $purpose = esc($db, $input['purpose'] ?? $res['purpose'] ?? 'C Programming');
        $student_id = $res['student_id'];
        $student_id_number = $res['id_number'];
        $pc_number = esc($db, $res['pc_number'] ?? '');

        $session_sql = "INSERT INTO sit_in_sessions (student_id, student_id_number, reservation_id, room, purpose, pc_number, status)
                        VALUES ($student_id, '$student_id_number', $id, '$room', '$purpose', '$pc_number', 'active')";
        
        if ($db->query($session_sql)) {
            $db->commit();
            json_response(200, ['success' => true, 'message' => 'Session started and moved to Current Sessions']);
        } else {
            throw new Exception('Failed to create sit-in session record');
        }
    } catch (Exception $e) {
        $db->rollback();
        json_response(500, ['success' => false, 'message' => $e->getMessage()]);
    }
}

function handle_mark_absent(mysqli $db, array $input): void {
    $id = intval($input['id'] ?? 0);
    if ($id <= 0) json_response(400, ['success' => false, 'message' => 'Invalid ID']);

    try {
        $db->begin_transaction();

        // 1. Get PC ID to re-enable
        $res_q = "SELECT pc_id FROM reservations WHERE id = $id";
        $res = $db->query($res_q)->fetch_assoc();
        
        // 2. Update reservation status
        $sql = "UPDATE reservations SET status = 'failed_to_appear' WHERE id = ? AND status = 'approved'";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $id);
        
        if ($stmt->execute() && $stmt->affected_rows > 0) {
            // 3. Automatically re-enable PC
            if ($res) {
                $db->query("UPDATE pcs SET status = 'available' WHERE id = " . $res['pc_id']);
            }
            $db->commit();
            json_response(200, ['success' => true, 'message' => 'Marked as absent and PC re-enabled']);
        } else {
            $db->rollback();
            json_response(400, ['success' => false, 'message' => 'Failed to mark as absent.']);
        }
    } catch (Exception $e) {
        $db->rollback();
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_end_session(mysqli $db, array $input): void {
    $id = intval($input['id'] ?? 0);
    $feedback = esc($db, $input['adminFeedback'] ?? '');
    
    if ($id <= 0) json_response(400, ['success' => false, 'message' => 'Invalid ID']);

    try {
        $db->begin_transaction();

        // 1. Get Reservation & PC Info
        $res_q = "SELECT pc_id, student_id FROM reservations WHERE id = $id AND status = 'active'";
        $res = $db->query($res_q)->fetch_assoc();
        
        if (!$res) {
            throw new Exception('Active reservation not found.');
        }

        // 2. Find and end the linked sit-in session
        $sess_q = "SELECT * FROM sit_in_sessions WHERE reservation_id = $id AND status = 'active' LIMIT 1";
        $sess = $db->query($sess_q)->fetch_assoc();

        if ($sess) {
            $sess_id = $sess['id'];
            $started_at = $sess['started_at'];
            
            // Calculate duration using SQL to be safe
            $calc_q = "SELECT NOW() as now_time, TIMESTAMPDIFF(MINUTE, '$started_at', NOW()) as duration";
            $calc = $db->query($calc_q)->fetch_assoc();
            $ended_at = $calc['now_time'];
            $duration = $calc['duration'];

            // Insert into records
            $ins_q = "INSERT INTO sit_in_records 
                      (session_id, student_id, student_id_number, reservation_id, room, purpose, started_at, ended_at, duration_minutes, admin_feedback, ended_by)
                      VALUES 
                      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')";
            $stmt = $db->prepare($ins_q);
            $stmt->bind_param('iisissssss', 
                $sess_id, 
                $sess['student_id'], 
                $sess['student_id_number'], 
                $id, 
                $sess['room'], 
                $sess['purpose'], 
                $started_at, 
                $ended_at, 
                $duration, 
                $feedback
            );
            $stmt->execute();

            // Delete active session
            $db->query("DELETE FROM sit_in_sessions WHERE id = $sess_id");
            
            // Deduct session from student
            $db->query("UPDATE students SET available_sessions = available_sessions - 1 WHERE id = " . $sess['student_id']);
        }
        
        // 3. Update reservation status
        $db->query("UPDATE reservations SET status = 'completed' WHERE id = $id");
        
        // 4. Re-enable PC
        $db->query("UPDATE pcs SET status = 'available' WHERE id = " . $res['pc_id']);

        $db->commit();
        json_response(200, ['success' => true, 'message' => 'Session completed and recorded.']);
    } catch (Exception $e) {
        $db->rollback();
        json_response(500, ['success' => false, 'message' => $e->getMessage()]);
    }
}
