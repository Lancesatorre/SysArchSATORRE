<?php

function handle_student_profile_stats(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    $stats_query = "SELECT
                        COUNT(*) AS total_sessions,
                        COALESCE(SUM(duration_minutes), 0) AS total_minutes,
                        SUM(CASE WHEN YEAR(started_at) = YEAR(CURDATE()) AND MONTH(started_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) AS this_month,
                        COUNT(DISTINCT YEARWEEK(started_at, 1)) AS active_weeks
                    FROM sit_in_records
                    WHERE student_id_number = '$id_number'";
    $stats_result = $db->query($stats_query);

    if (!$stats_result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load sit-in activity']);
    }

    $stats_row = $stats_result->fetch_assoc();
    $total_sessions = intval($stats_row['total_sessions'] ?? 0);
    $total_minutes = intval($stats_row['total_minutes'] ?? 0);
    $this_month = intval($stats_row['this_month'] ?? 0);
    $active_weeks = intval($stats_row['active_weeks'] ?? 0);

    $hours_logged = round($total_minutes / 60, 1);
    $avg_per_week = $active_weeks > 0 ? round($total_sessions / $active_weeks, 1) : 0;

    $labs_query = "SELECT
                      COALESCE(NULLIF(TRIM(room), ''), 'Unspecified') AS lab,
                      COUNT(*) AS session_count
                   FROM sit_in_records
                   WHERE student_id_number = '$id_number'
                   GROUP BY COALESCE(NULLIF(TRIM(room), ''), 'Unspecified')
                   ORDER BY session_count DESC
                   LIMIT 3";
    $labs_result = $db->query($labs_query);

    if (!$labs_result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load lab usage']);
    }

    $lab_usage = [];
    while ($lab_row = $labs_result->fetch_assoc()) {
        $count = intval($lab_row['session_count'] ?? 0);
        $pct = $total_sessions > 0 ? intval(round(($count / $total_sessions) * 100)) : 0;
        $lab_usage[] = [
            'lab' => $lab_row['lab'],
            'count' => $count,
            'pct' => $pct,
        ];
    }

    json_response(200, [
        'success' => true,
        'message' => 'Profile stats loaded',
        'stats' => [
            'total_sessions' => $total_sessions,
            'this_month' => $this_month,
            'hours_logged' => $hours_logged,
            'avg_per_week' => $avg_per_week,
            'lab_usage' => $lab_usage,
        ],
    ]);
}

function handle_fetch_notifications(mysqli $db, array $input): void {
    $id_number = trim($input['idNumber'] ?? '');
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    $query = "SELECT id, title, message, tag, created_by, created_at
              FROM announcements
              ORDER BY created_at DESC, id DESC
              LIMIT 30";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to fetch notifications']);
    }

    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }

    json_response(200, [
        'success' => true,
        'message' => 'Notifications fetched',
        'notifications' => $notifications,
    ]);
}

function handle_student_current_session(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    $student_query = "SELECT id, available_sessions FROM students WHERE id_number = '$id_number' LIMIT 1";
    $student_result = $db->query($student_query);

    if (!$student_result || $student_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'Student not found']);
    }

    $student = $student_result->fetch_assoc();
    $student_id = intval($student['id'] ?? 0);

    $session_query = "SELECT id, room, purpose, started_at
                      FROM sit_in_sessions
                      WHERE student_id = $student_id AND status = 'active'
                      ORDER BY started_at DESC, id DESC
                      LIMIT 1";
    $session_result = $db->query($session_query);

    $active_session = null;
    if ($session_result && $session_result->num_rows > 0) {
        $active_session = $session_result->fetch_assoc();
    }

    json_response(200, [
        'success' => true,
        'message' => 'Student session data loaded',
        'available_sessions' => intval($student['available_sessions'] ?? 0),
        'active_session' => $active_session,
    ]);
}

function handle_student_history(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

        $query = "SELECT
                                CONCAT('record-', r.id) AS history_key,
                                r.id,
                                r.session_id,
                                r.room,
                                r.purpose,
                                r.started_at,
                                r.ended_at,
                                r.duration_minutes,
                                r.status,
                                r.admin_feedback,
                                r.student_feedback,
                                r.ended_by,
                                r.created_at
                            FROM sit_in_records r
                            WHERE r.student_id_number = '$id_number'
                            ORDER BY r.created_at DESC, r.id DESC
                            LIMIT 300";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load student history']);
    }

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }

    json_response(200, [
        'success' => true,
        'message' => 'Student history loaded',
        'records' => $records,
    ]);
}

function handle_student_submit_feedback(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    $record_id = intval($input['recordId'] ?? 0);
    $feedback = esc($db, trim($input['feedback'] ?? ''));

    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }
    if ($record_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid record ID']);
    }
    if ($feedback === '') {
        json_response(400, ['success' => false, 'message' => 'Feedback is required']);
    }

    $check_query = "SELECT id FROM sit_in_records WHERE id = $record_id AND student_id_number = '$id_number' LIMIT 1";
    $check_result = $db->query($check_query);
    if (!$check_result || $check_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'Record not found for this student']);
    }

    $query = "UPDATE sit_in_records
              SET student_feedback = '$feedback'
              WHERE id = $record_id AND student_id_number = '$id_number'";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to save feedback']);
    }

    json_response(200, [
        'success' => true,
        'message' => 'Feedback saved successfully',
    ]);
}
