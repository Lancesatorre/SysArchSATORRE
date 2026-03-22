<?php
// Admin view current sessions
if ($action === 'adminCurrentSessions' && $request_method === 'POST') {
    if (!isset($input['adminId']) || $input['adminId'] !== ADMIN_ID) {
        http_response_code(403);
        $response['message'] = 'Unauthorized admin request';
        echo json_encode($response);
        exit();
    }

    $sessions_query = "SELECT s.id, s.student_id, s.student_id_number, s.room, s.purpose, s.started_at,
                  st.first_name, st.last_name, st.course, st.year_level, st.available_sessions, st.profile_picture
                       FROM sit_in_sessions s
                       INNER JOIN students st ON st.id = s.student_id
                       WHERE s.status = 'active'
                      ORDER BY s.started_at ASC, s.id ASC";
    $sessions_result = $db->query($sessions_query);

    if (!$sessions_result) {
        http_response_code(500);
        $response['message'] = 'Failed to load current sessions';
        echo json_encode($response);
        exit();
    }

    $sessions = [];
    while ($row = $sessions_result->fetch_assoc()) {
        $sessions[] = $row;
    }

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Current sessions loaded';
    $response['sessions'] = $sessions;
    echo json_encode($response);
    exit();
}
?>
