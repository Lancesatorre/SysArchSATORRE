<?php
// Get student profile statistics
if ($action === 'studentProfileStats' && $request_method === 'POST') {
    $id_number = $db->real_escape_string(trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        http_response_code(400);
        $response['message'] = 'ID number is required';
        echo json_encode($response);
        exit();
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
        http_response_code(500);
        $response['message'] = 'Failed to load sit-in activity';
        echo json_encode($response);
        exit();
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
        http_response_code(500);
        $response['message'] = 'Failed to load lab usage';
        echo json_encode($response);
        exit();
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

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Profile stats loaded';
    $response['stats'] = [
        'total_sessions' => $total_sessions,
        'this_month' => $this_month,
        'hours_logged' => $hours_logged,
        'avg_per_week' => $avg_per_week,
        'lab_usage' => $lab_usage,
    ];
    echo json_encode($response);
    exit();
}
?>
