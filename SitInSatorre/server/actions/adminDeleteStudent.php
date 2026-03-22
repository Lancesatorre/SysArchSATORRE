<?php
// Admin delete student
if ($action === 'adminDeleteStudent' && $request_method === 'POST') {
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

    $delete_query = "DELETE FROM students WHERE id = $student_id";
    if (!$db->query($delete_query)) {
        http_response_code(500);
        $response['message'] = 'Failed to delete student';
        echo json_encode($response);
        exit();
    }

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Student deleted successfully';
    echo json_encode($response);
    exit();
}
?>
