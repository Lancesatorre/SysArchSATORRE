<?php

function handle_admin_start_session(mysqli $db, array $input): void {
    require_admin_access($input);

    $student_id_number = esc($db, trim($input['studentIdNumber'] ?? ''));
    $room = esc($db, trim($input['room'] ?? ''));
    $purpose = esc($db, trim($input['purpose'] ?? ''));

    if ($student_id_number === '') {
        json_response(400, ['success' => false, 'message' => 'Student ID number is required']);
    }
    if ($room === '' || $purpose === '') {
        json_response(400, ['success' => false, 'message' => 'Room and purpose are required']);
    }

    $student_query = "SELECT id, id_number, available_sessions FROM students WHERE id_number = '$student_id_number' LIMIT 1";
    $student_result = $db->query($student_query);

    if (!$student_result || $student_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'Student not found']);
    }

    $student = $student_result->fetch_assoc();
    if ((int) $student['available_sessions'] <= 0) {
        json_response(400, ['success' => false, 'message' => 'Student has no available sessions left']);
    }

    $active_check_query = "SELECT id FROM sit_in_sessions WHERE student_id = {$student['id']} AND status = 'active' LIMIT 1";
    $active_check_result = $db->query($active_check_query);
    if ($active_check_result && $active_check_result->num_rows > 0) {
        json_response(409, ['success' => false, 'message' => 'Student already has an active sit-in session']);
    }

    $query = "INSERT INTO sit_in_sessions (student_id, student_id_number, room, purpose, status)
              VALUES ({$student['id']}, '{$student['id_number']}', '$room', '$purpose', 'active')";
    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to initiate sit-in session']);
    }

    json_response(201, [
        'success' => true,
        'message' => 'Sit-in session initiated successfully',
        'sessionId' => $db->insert_id,
    ]);
}

function handle_admin_current_sessions(mysqli $db, array $input): void {
    require_admin_access($input);

    $query = "SELECT s.id, s.student_id, s.student_id_number, s.room, s.purpose, s.started_at,
                     st.first_name, st.last_name, st.course, st.year_level, st.available_sessions, st.profile_picture
              FROM sit_in_sessions s
              INNER JOIN students st ON st.id = s.student_id
              WHERE s.status = 'active'
              ORDER BY s.started_at ASC, s.id ASC";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load current sessions']);
    }

    $sessions = [];
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }

    json_response(200, ['success' => true, 'message' => 'Current sessions loaded', 'sessions' => $sessions]);
}

function handle_admin_end_session(mysqli $db, array $input): void {
    require_admin_access($input);

    $session_id = intval($input['sessionId'] ?? 0);
    $admin_feedback = esc($db, trim($input['adminFeedback'] ?? ''));

    if ($session_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Valid session ID is required']);
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
                        (session_id, student_id, student_id_number, room, purpose, started_at, ended_at, duration_minutes, status, admin_feedback, ended_by)
                        VALUES
                        ($session_id, {$session['student_id']}, '{$session['student_id_number']}', '{$session['room']}', '{$session['purpose']}', '{$session['started_at']}', NOW(),
                         TIMESTAMPDIFF(MINUTE, '{$session['started_at']}', NOW()), 'Completed', '$admin_feedback', '" . ADMIN_ID . "')";
        if (!$db->query($record_query)) {
            throw new Exception('Failed to write sit-in record');
        }

        $db->commit();
        json_response(200, [
            'success' => true,
            'message' => 'Session ended. One session deducted and recorded permanently.',
        ]);
    } catch (Exception $e) {
        $db->rollback();
        json_response(500, ['success' => false, 'message' => $e->getMessage()]);
    }
}

function handle_admin_sit_in_records(mysqli $db, array $input): void {
    require_admin_access($input);

    $query = "SELECT r.id, r.session_id, r.student_id_number, r.room, r.purpose, r.started_at, r.ended_at, r.duration_minutes, r.status, r.admin_feedback, r.ended_by,
                     st.first_name, st.last_name, st.course, st.year_level, st.profile_picture
              FROM sit_in_records r
              LEFT JOIN students st ON st.id = r.student_id
              ORDER BY r.created_at ASC, r.id ASC
              LIMIT 200";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load sit-in records']);
    }

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }

    json_response(200, ['success' => true, 'message' => 'Sit-in records loaded', 'records' => $records]);
}
