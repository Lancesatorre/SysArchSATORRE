<?php
// Admin update student
if ($action === 'adminUpdateStudent' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $student_id = intval($input['id'] ?? 0);
    if ($student_id <= 0) {
        http_response_code(400);
        $response['message'] = 'Invalid student ID';
        echo json_encode($response);
        exit();
    }

    $first_name = $db->real_escape_string(trim($input['firstName'] ?? ''));
    $last_name = $db->real_escape_string(trim($input['lastName'] ?? ''));
    $middle_name = $db->real_escape_string(trim($input['middleName'] ?? ''));
    $course = $db->real_escape_string(trim($input['course'] ?? ''));
    $year_level = intval($input['yearLevel'] ?? 0);
    $address = $db->real_escape_string(trim($input['address'] ?? ''));
    $available_sessions = intval($input['availableSessions'] ?? 0);

    if ($first_name === '' || $last_name === '') {
        http_response_code(400);
        $response['message'] = 'First name and last name are required';
        echo json_encode($response);
        exit();
    }

    $update_student_query = "UPDATE students
                             SET first_name = '$first_name',
                                 last_name = '$last_name',
                                 middle_name = '$middle_name',
                                 course = '$course',
                                 year_level = $year_level,
                                 address = '$address',
                                 available_sessions = $available_sessions
                             WHERE id = $student_id";
    if (!$db->query($update_student_query)) {
        http_response_code(500);
        $response['message'] = 'Failed to update student';
        echo json_encode($response);
        exit();
    }

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Student updated successfully';
    echo json_encode($response);
    exit();
}
?>
