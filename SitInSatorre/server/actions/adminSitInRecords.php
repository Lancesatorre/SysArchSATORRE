<?php
// Admin view sit-in records
if ($action === 'adminSitInRecords' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $records_query = "SELECT r.id, r.session_id, r.student_id_number, r.room, r.pc_number, r.purpose, r.started_at, r.ended_at, r.duration_minutes, r.ended_by,
                 st.first_name, st.last_name, st.course, st.year_level, st.profile_picture
                      FROM sit_in_records r
                      LEFT JOIN students st ON st.id = r.student_id
                     ORDER BY r.created_at ASC, r.id ASC
                      LIMIT 200";
    $records_result = $db->query($records_query);

    if (!$records_result) {
        http_response_code(500);
        $response['message'] = 'Failed to load sit-in records';
        echo json_encode($response);
        exit();
    }

    $records = [];
    while ($row = $records_result->fetch_assoc()) {
        $records[] = $row;
    }

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Sit-in records loaded';
    $response['records'] = $records;
    echo json_encode($response);
    exit();
}
?>
