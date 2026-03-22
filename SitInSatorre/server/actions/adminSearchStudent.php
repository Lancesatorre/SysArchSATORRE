<?php
// Admin search student
if ($action === 'adminSearchStudent' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $keyword = trim($input['studentKeyword'] ?? '');
    if ($keyword === '') {
        http_response_code(400);
        $response['message'] = 'Student keyword is required';
        echo json_encode($response);
        exit();
    }

    $keyword_escaped = $db->real_escape_string($keyword);
    $search_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
                     FROM students
                     WHERE id_number LIKE '%$keyword_escaped%'
                        OR first_name LIKE '%$keyword_escaped%'
                        OR last_name LIKE '%$keyword_escaped%'
                     ORDER BY id DESC
                     LIMIT 20";

    $search_result = $db->query($search_query);
    if (!$search_result) {
        http_response_code(500);
        $response['message'] = 'Search failed';
        echo json_encode($response);
        exit();
    }

    $students = [];
    while ($row = $search_result->fetch_assoc()) {
        $row['role'] = 'student';
        $students[] = $row;
    }

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Search completed';
    $response['students'] = $students;
    echo json_encode($response);
    exit();
}
?>
