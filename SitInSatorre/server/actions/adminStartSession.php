<?php
// Admin start sit-in session
if ($action === 'adminStartSession' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $student_id_number = $db->real_escape_string(trim($input['studentIdNumber'] ?? ''));
    $room = $db->real_escape_string(trim($input['room'] ?? ''));
    $purpose = $db->real_escape_string(trim($input['purpose'] ?? ''));
    if ($student_id_number === '') {
        http_response_code(400);
        $response['message'] = 'Student ID number is required';
        echo json_encode($response);
        exit();
    }
    if ($room === '' || $purpose === '') {
        http_response_code(400);
        $response['message'] = 'Room and purpose are required';
        echo json_encode($response);
        exit();
    }

    $student_query = "SELECT id, id_number, available_sessions FROM students WHERE id_number = '$student_id_number' LIMIT 1";
    $student_result = $db->query($student_query);
    if (!$student_result || $student_result->num_rows === 0) {
        http_response_code(404);
        $response['message'] = 'Student not found';
        echo json_encode($response);
        exit();
    }

    $student = $student_result->fetch_assoc();
    if ((int)$student['available_sessions'] <= 0) {
        http_response_code(400);
        $response['message'] = 'Student has no available sessions left';
        echo json_encode($response);
        exit();
    }

    $active_check_query = "SELECT id FROM sit_in_sessions WHERE student_id = {$student['id']} AND status = 'active' LIMIT 1";
    $active_check_result = $db->query($active_check_query);
    if ($active_check_result && $active_check_result->num_rows > 0) {
        http_response_code(409);
        $response['message'] = 'Student already has an active sit-in session';
        echo json_encode($response);
        exit();
    }

    $start_session_query = "INSERT INTO sit_in_sessions (student_id, student_id_number, room, purpose, status)
                VALUES ({$student['id']}, '{$student['id_number']}', '$room', '$purpose', 'active')";
    if (!$db->query($start_session_query)) {
        http_response_code(500);
        $response['message'] = 'Failed to initiate sit-in session';
        echo json_encode($response);
        exit();
    }

    http_response_code(201);
    $response['success'] = true;
    $response['message'] = 'Sit-in session initiated successfully';
    $response['sessionId'] = $db->insert_id;
    echo json_encode($response);
    exit();
}
?>
