<?php
// Admin end sit-in session
if ($action === 'adminEndSession' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $session_id = intval($input['sessionId'] ?? 0);
    if ($session_id <= 0) {
        http_response_code(400);
        $response['message'] = 'Valid session ID is required';
        echo json_encode($response);
        exit();
    }

    $db->begin_transaction();
    try {
        $session_query = "SELECT s.id, s.student_id, s.student_id_number, s.room, s.purpose, s.started_at,
                                 st.available_sessions
                          FROM sit_in_sessions s
                          INNER JOIN students st ON st.id = s.student_id
                          WHERE s.id = $session_id AND s.status = 'active'
                          LIMIT 1";
        $session_result = $db->query($session_query);

        if (!$session_result || $session_result->num_rows === 0) {
            throw new Exception('Active session not found');
        }

        $session = $session_result->fetch_assoc();

        $end_query = "UPDATE sit_in_sessions
                      SET status = 'ended', ended_at = NOW(), ended_by = '" . ADMIN_ID . "'
                      WHERE id = $session_id AND status = 'active'";
        if (!$db->query($end_query) || $db->affected_rows === 0) {
            throw new Exception('Failed to end session');
        }

        $deduct_query = "UPDATE students
                         SET available_sessions = CASE
                             WHEN available_sessions > 0 THEN available_sessions - 1
                             ELSE 0
                         END
                         WHERE id = {$session['student_id']}";
        if (!$db->query($deduct_query)) {
            throw new Exception('Failed to deduct student session');
        }

        $record_query = "INSERT INTO sit_in_records
                        (session_id, student_id, student_id_number, room, purpose, started_at, ended_at, duration_minutes, ended_by)
                        VALUES
                        ($session_id, {$session['student_id']}, '{$session['student_id_number']}', '{$session['room']}', '{$session['purpose']}', '{$session['started_at']}', NOW(),
                         TIMESTAMPDIFF(MINUTE, '{$session['started_at']}', NOW()), '" . ADMIN_ID . "')";
        if (!$db->query($record_query)) {
            throw new Exception('Failed to write sit-in record');
        }

        $db->commit();

        http_response_code(200);
        $response['success'] = true;
        $response['message'] = 'Session ended. One session deducted and recorded permanently.';
        echo json_encode($response);
        exit();
    } catch (Exception $txe) {
        $db->rollback();
        http_response_code(500);
        $response['message'] = $txe->getMessage();
        echo json_encode($response);
        exit();
    }
}
?>
