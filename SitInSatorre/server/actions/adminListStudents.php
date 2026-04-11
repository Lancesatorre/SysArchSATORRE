<?php
// Admin list all students
if ($action === 'adminListStudents' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $list_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
                   FROM students
                   ORDER BY id DESC";
    $list_result = $db->query($list_query);
    if (!$list_result) {
        http_response_code(500);
        $response['message'] = 'Failed to load students';
        echo json_encode($response);
        exit();
    }

    $students = [];
    while ($row = $list_result->fetch_assoc()) {
        $row['role'] = 'student';
        $students[] = $row;
    }

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Students loaded';
    $response['students'] = $students;
    echo json_encode($response);
    exit();
}
?>
