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
        $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

        $query = "SELECT
                                a.id,
                                a.title,
                                a.message,
                                a.tag,
                                a.created_by,
                                a.created_at,
                                CASE WHEN nr.id IS NULL THEN 0 ELSE 1 END AS is_read
                            FROM announcements a
                            LEFT JOIN notification_reads nr
                                ON nr.announcement_id = a.id
                             AND nr.student_id_number = '$id_number'
                            ORDER BY a.created_at DESC, a.id DESC
                            LIMIT 30";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to fetch notifications']);
    }

    $notifications = [];
    $unread_count = 0;
    while ($row = $result->fetch_assoc()) {
        $is_read = intval($row['is_read'] ?? 0);
        $row['is_read'] = $is_read;
        if ($is_read === 0) {
            $unread_count++;
        }
        $notifications[] = $row;
    }

    json_response(200, [
        'success' => true,
        'message' => 'Notifications fetched',
        'notifications' => $notifications,
        'unreadCount' => $unread_count,
    ]);
}

function handle_mark_notification_read(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    $notification_id = intval($input['notificationId'] ?? 0);

    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }
    if ($notification_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid notification ID']);
    }

    $exists_query = "SELECT id FROM announcements WHERE id = $notification_id LIMIT 1";
    $exists_result = $db->query($exists_query);
    if (!$exists_result || $exists_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'Notification not found']);
    }

    $query = "INSERT INTO notification_reads (student_id_number, announcement_id)
              VALUES ('$id_number', $notification_id)
              ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to mark notification as read']);
    }

    json_response(200, [
        'success' => true,
        'message' => 'Notification marked as read',
    ]);
}

function handle_mark_all_notifications_read(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    $query = "INSERT INTO notification_reads (student_id_number, announcement_id)
              SELECT '$id_number', a.id
              FROM announcements a
              LEFT JOIN notification_reads nr
                ON nr.announcement_id = a.id
               AND nr.student_id_number = '$id_number'
              WHERE nr.id IS NULL";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to mark all notifications as read']);
    }

    json_response(200, [
        'success' => true,
        'message' => 'All notifications marked as read',
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

    $session_query = "SELECT s.id, s.room, s.purpose, s.started_at, COALESCE(res.pc_number, 'Walk-in') as pc_number
                      FROM sit_in_sessions s
                      LEFT JOIN reservations res ON s.reservation_id = res.id
                      WHERE s.student_id = $student_id AND s.status = 'active'
                      ORDER BY s.started_at DESC, s.id DESC
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
                                COALESCE(r.pc_number, res.pc_number) as pc_number,
                                CASE WHEN r.reservation_id IS NOT NULL THEN 'Reservation' ELSE 'Walk-in' END as entry_type,
                                r.status,
                                r.admin_feedback,
                                r.student_feedback,
                                r.ended_by,
                                r.created_at
                            FROM sit_in_records r
                            LEFT JOIN reservations res ON r.reservation_id = res.id
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
    json_response(403, [
        'success' => false,
        'message' => 'Student feedback submission is disabled. Only admin feedback is allowed.',
    ]);
}

function handle_student_sit_in_summary(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    // Get student ID from ID number
    $student_query = "SELECT id FROM students WHERE id_number = '$id_number' LIMIT 1";
    $student_result = $db->query($student_query);

    if (!$student_result || $student_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'Student not found']);
    }

    $student = $student_result->fetch_assoc();
    $student_id = intval($student['id'] ?? 0);

    try {
        // Get total hours from sit_in_records (duration_minutes)
        $sql_hours = "SELECT COALESCE(SUM(duration_minutes) / 60.0, 0) as total_hours
                      FROM sit_in_records 
                      WHERE student_id = ? AND status = 'Completed'";
        
        $stmt_hours = $db->prepare($sql_hours);
        $stmt_hours->bind_param('i', $student_id);
        $stmt_hours->execute();
        $result_hours = $stmt_hours->get_result();
        $row_hours = $result_hours->fetch_assoc();
        $total_hours = floatval($row_hours['total_hours'] ?? 0);
        
        // Get session count
        $sql_count = "SELECT COUNT(*) as session_count 
                      FROM sit_in_records 
                      WHERE student_id = ? AND status = 'Completed'";
        
        $stmt_count = $db->prepare($sql_count);
        $stmt_count->bind_param('i', $student_id);
        $stmt_count->execute();
        $result_count = $stmt_count->get_result();
        $row_count = $result_count->fetch_assoc();
        $session_count = intval($row_count['session_count'] ?? 0);
        
        // Get average duration in hours
        $average_duration = $session_count > 0 ? ($total_hours / $session_count) : 0;
        
        // Get longest session duration in hours
        $sql_longest = "SELECT COALESCE(MAX(duration_minutes) / 60.0, 0) as longest_session
                        FROM sit_in_records 
                        WHERE student_id = ? AND status = 'Completed'";
        
        $stmt_longest = $db->prepare($sql_longest);
        $stmt_longest->bind_param('i', $student_id);
        $stmt_longest->execute();
        $result_longest = $stmt_longest->get_result();
        $row_longest = $result_longest->fetch_assoc();
        $longest_session = floatval($row_longest['longest_session'] ?? 0);
        
        json_response(200, [
            'success' => true,
            'message' => 'Sit-in summary loaded',
            'data' => [
                'total_hours' => $total_hours,
                'session_count' => $session_count,
                'average_duration' => $average_duration,
                'longest_session' => $longest_session
            ]
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_student_reservations(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    // Get student ID from ID number
    $student_query = "SELECT id FROM students WHERE id_number = '$id_number' LIMIT 1";
    $student_result = $db->query($student_query);

    if (!$student_result || $student_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'Student not found']);
    }

    $student = $student_result->fetch_assoc();
    $student_id = intval($student['id'] ?? 0);

    try {
        $sql = "SELECT 
                r.id,
                r.student_id,
                r.pc_id,
                r.lab_id,
                r.pc_number,
                l.lab_name,
                r.reservation_date,
                r.time_from,
                r.time_to,
                r.status,
                r.decline_reason,
                r.created_at,
                r.approved_at
                FROM reservations r
                JOIN labs l ON r.lab_id = l.id
                WHERE r.student_id = ?
                ORDER BY 
                CASE 
                    WHEN r.status = 'pending' THEN 1
                    WHEN r.status = 'approved' THEN 2
                    WHEN r.status = 'active' THEN 3
                    WHEN r.status = 'completed' THEN 4
                    WHEN r.status = 'declined' THEN 5
                    WHEN r.status = 'failed_to_appear' THEN 6
                    ELSE 7
                END,
                r.reservation_date DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $student_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $reservations = [];
        while ($row = $result->fetch_assoc()) {
            $reservations[] = [
                'id' => intval($row['id'] ?? 0),
                'student_id' => intval($row['student_id'] ?? 0),
                'pc_id' => intval($row['pc_id'] ?? 0),
                'lab_id' => intval($row['lab_id'] ?? 0),
                'pc_number' => $row['pc_number'] ?? '',
                'lab_name' => $row['lab_name'] ?? '',
                'reservation_date' => $row['reservation_date'] ?? '',
                'time_from' => $row['time_from'] ?? '',
                'time_to' => $row['time_to'] ?? '',
                'status' => $row['status'] ?? 'pending',
                'decline_reason' => $row['decline_reason'] ?? null,
                'created_at' => $row['created_at'] ?? '',
                'approved_at' => $row['approved_at'] ?? null,
            ];
        }

        json_response(200, [
            'success' => true,
            'message' => 'Reservations loaded',
            'data' => $reservations
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}
function handle_get_lab_availability(mysqli $db, array $input): void {
    try {
        $current_time = date('H:i:s');
        $current_date = date('Y-m-d');

        $sql = "SELECT 
                    l.id, 
                    l.lab_name, 
                    l.status,
                    COUNT(p.id) as total_pcs,
                    SUM(CASE 
                        WHEN p.status = 'available' 
                        AND NOT EXISTS (
                            SELECT 1 FROM reservations r 
                            WHERE r.pc_id = p.id 
                            AND r.reservation_date = '$current_date'
                            AND '$current_time' BETWEEN r.time_from AND r.time_to
                            AND r.status = 'approved'
                        ) THEN 1 ELSE 0 END) as available_pcs
                FROM labs l
                LEFT JOIN pcs p ON l.id = p.lab_id
                GROUP BY l.id, l.lab_name, l.status";
        
        $result = $db->query($sql);

        $labs = [];
        while ($row = $result->fetch_assoc()) {
            $labs[] = [
                'id' => intval($row['id']),
                'lab_name' => $row['lab_name'],
                'status' => $row['status'],
                'total_pcs' => intval($row['total_pcs']),
                'available_pcs' => intval($row['available_pcs']),
            ];
        }

        json_response(200, [
            'success' => true,
            'message' => 'Lab availability loaded',
            'data' => $labs
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_get_pc_availability(mysqli $db, array $input): void {
    $lab_id = intval($input['lab_id'] ?? 0);
    $date = esc($db, $input['date'] ?? date('Y-m-d'));
    $manual_start = esc($db, $input['startTime'] ?? '');
    $id_number = esc($db, trim($input['idNumber'] ?? ''));

    if ($lab_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Lab ID is required']);
    }

    $slot_start = !empty($manual_start) ? $manual_start : date('H:i:s');

    try {
        // Fetch lab name
        $lab_stmt = $db->prepare("SELECT lab_name FROM labs WHERE id = ?");
        $lab_stmt->bind_param('i', $lab_id);
        $lab_stmt->execute();
        $lab_res = $lab_stmt->get_result()->fetch_assoc();
        $lab_name = $lab_res ? $lab_res['lab_name'] : '';

        // Get current student ID if provided
        $my_id = 0;
        if ($id_number) {
            $s_res = $db->query("SELECT id FROM students WHERE id_number = '$id_number'");
            if ($s_res && $row = $s_res->fetch_assoc()) {
                $my_id = intval($row['id']);
            }
        }

        // Find ALL PCs in the lab
        $sql = "SELECT id, pc_number, status FROM pcs WHERE lab_id = ? ORDER BY CAST(REPLACE(pc_number, 'PC-', '') AS UNSIGNED) ASC";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $lab_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $pcs = [];
        $current_time = date('H:i:s');

        while ($row = $result->fetch_assoc()) {
            // 1. Check if PC is reserved within 3 hours of the requested Date/Time Slot (cross-date aware)
            $requested_datetime = $date . ' ' . $slot_start;
            $check_sql = "SELECT id, student_id, time_from, status FROM reservations 
                          WHERE pc_id = ? 
                          AND ABS(TIMESTAMPDIFF(SECOND, CONCAT(reservation_date, ' ', time_from), ?)) < 10800
                          AND status IN ('pending', 'approved', 'active')";

            $check_stmt = $db->prepare($check_sql);
            $check_stmt->bind_param('is', $row['id'], $requested_datetime);
            $check_stmt->execute();
            $check_res = $check_stmt->get_result();
            
            $is_reserved_for_slot = false;
            $is_mine_slot = false;
            $slot_status = null;
            
            $slot_rows = [];
            while ($slot_res_row = $check_res->fetch_assoc()) {
                $is_reserved_for_slot = true;
                $slot_rows[] = $slot_res_row;
            }
            
            if ($is_reserved_for_slot) {
                $chosen_slot_row = null;
                foreach ($slot_rows as $s_row) {
                    if ($s_row['status'] === 'approved') {
                        $chosen_slot_row = $s_row;
                        break;
                    }
                }
                if (!$chosen_slot_row) {
                    $chosen_slot_row = $slot_rows[0];
                }
                
                $slot_status = $chosen_slot_row['status'];
                
                foreach ($slot_rows as $s_row) {
                    if (intval($s_row['student_id']) === $my_id) {
                        $is_mine_slot = true;
                        $slot_status = $s_row['status'];
                    }
                }
            }

            // 2. Check if PC is reserved RIGHT NOW (Occupied state)
            // A PC is occupied now if there is an APPROVED reservation for today AND the current time is within its window
            $now_sql = "SELECT id, student_id FROM reservations 
                       WHERE pc_id = ? 
                       AND reservation_date = CURRENT_DATE
                       AND ? BETWEEN time_from AND time_to
                       AND status = 'approved'";
            $now_stmt = $db->prepare($now_sql);
            $now_stmt->bind_param('is', $row['id'], $current_time);
            $now_stmt->execute();
            $now_res = $now_stmt->get_result();
            $now_res_row = $now_res->fetch_assoc();
            $is_occupied_now = !!$now_res_row;
            $is_mine_now = $now_res_row && intval($now_res_row['student_id']) === $my_id;

            // 3. Check if PC has ANY pending/approved reservation today at all
            $any_sql = "SELECT id, student_id FROM reservations 
                       WHERE pc_id = ? 
                       AND reservation_date = ?
                       AND status IN ('pending', 'approved', 'active')";
            $any_stmt = $db->prepare($any_sql);
            $any_stmt->bind_param('is', $row['id'], $date);
            $any_stmt->execute();
            $any_res = $any_stmt->get_result();
            $has_any_today = $any_res->num_rows > 0;

            $is_my_pc_today = false;
            if ($my_id > 0 && $has_any_today) {
                while ($any_row = $any_res->fetch_assoc()) {
                    if (intval($any_row['student_id'] ?? 0) === $my_id) {
                        $is_my_pc_today = true;
                        break;
                    }
                }
            }

            // Check if this PC has any pending or approved reservation by ME on ANY date in the future or today
            $is_my_pc_ever = false;
            $my_slot_status = null;
            if ($my_id > 0) {
                $ever_sql = "SELECT status FROM reservations 
                            WHERE pc_id = ? 
                            AND student_id = ? 
                            AND reservation_date >= CURRENT_DATE 
                            AND status IN ('pending', 'approved', 'active')
                            LIMIT 1";
                $ever_stmt = $db->prepare($ever_sql);
                $ever_stmt->bind_param('ii', $row['id'], $my_id);
                $ever_stmt->execute();
                $ever_res = $ever_stmt->get_result();
                if ($ever_row = $ever_res->fetch_assoc()) {
                    $is_my_pc_ever = true;
                    $my_slot_status = $ever_row['status'];
                }
            }

            // Check if this PC currently has an active sitting session (either Walk-in or Reservation)
            $session_sql = "SELECT s.id, s.started_at, s.student_id_number, s.student_id 
                            FROM sit_in_sessions s 
                            WHERE (s.pc_number = ? AND s.room = ? AND s.status = 'active') 
                            OR (s.reservation_id IN (SELECT id FROM reservations WHERE pc_id = ?) AND s.status = 'active')
                            LIMIT 1";
            $session_stmt = $db->prepare($session_sql);
            $session_stmt->bind_param('ssi', $row['pc_number'], $lab_name, $row['id']);
            $session_stmt->execute();
            $session_res = $session_stmt->get_result();
            
            $is_session_active = false;
            $session_started_date_raw = null;
            $session_started_time_raw = null;
            $session_started_date = null;
            $session_started_time = null;
            $session_student_id_number = null;
            $is_my_active_session = false;

            if ($session_row = $session_res->fetch_assoc()) {
                $is_session_active = true;
                $session_started_at = $session_row['started_at'];
                $session_started_date_raw = date('Y-m-d', strtotime($session_started_at));
                $session_started_time_raw = date('H:i:s', strtotime($session_started_at));
                $session_started_date = date('F j, Y', strtotime($session_started_at));
                $session_started_time = date('g:i A', strtotime($session_started_at));
                $session_student_id_number = $session_row['student_id_number'];
                if ($my_id > 0 && intval($session_row['student_id']) === $my_id) {
                    $is_my_active_session = true;
                }
            }

            // Check if this PC has any pending or approved reservation by ANYONE on ANY date in the future or today
            $all_reservations = [];
            
            // If there is an active session, prepend it as the first reservation item to enforce the 3 hrs rule
            if ($is_session_active) {
                $all_reservations[] = [
                    'status' => 'active',
                    'reservation_date' => $session_started_date,
                    'reservation_time' => $session_started_time,
                    'reservation_date_raw' => $session_started_date_raw,
                    'reservation_time_raw' => $session_started_time_raw,
                    'reserved_by_me' => $is_my_active_session,
                    'student_id_number' => $session_student_id_number,
                    'is_session_active' => true,
                    'session_started_date' => $session_started_date,
                    'session_started_time' => $session_started_time,
                    'session_started_date_raw' => $session_started_date_raw,
                    'session_started_time_raw' => $session_started_time_raw,
                ];
            }

            $ever_any_sql = "SELECT r.status, r.reservation_date, r.time_from, r.student_id, s.started_at, s.status AS session_status, st.id_number AS student_id_number 
                             FROM reservations r 
                             JOIN students st ON r.student_id = st.id
                             LEFT JOIN sit_in_sessions s ON s.reservation_id = r.id AND s.status = 'active'
                             WHERE r.pc_id = ? 
                             AND r.reservation_date >= CURRENT_DATE 
                             AND r.status IN ('pending', 'approved', 'active')
                             ORDER BY r.reservation_date ASC, r.time_from ASC";
            $ever_any_stmt = $db->prepare($ever_any_sql);
            $ever_any_stmt->bind_param('i', $row['id']);
            $ever_any_stmt->execute();
            $ever_any_res = $ever_any_stmt->get_result();
            while ($ever_any_row = $ever_any_res->fetch_assoc()) {
                if ($ever_any_row['session_status'] === 'active') {
                    // Already added as active session above, skip to prevent duplicates
                    continue;
                }
                
                $disp_date = date('F j, Y', strtotime($ever_any_row['reservation_date']));
                $disp_time = date('g:i A', strtotime($ever_any_row['time_from']));
                
                $all_reservations[] = [
                    'status' => $ever_any_row['status'],
                    'reservation_date' => $disp_date,
                    'reservation_time' => $disp_time,
                    'reservation_date_raw' => $ever_any_row['reservation_date'],
                    'reservation_time_raw' => $ever_any_row['time_from'],
                    'reserved_by_me' => (intval($ever_any_row['student_id']) === $my_id),
                    'student_id_number' => $ever_any_row['student_id_number'],
                    'is_session_active' => false,
                    'session_started_date' => null,
                    'session_started_time' => null,
                    'session_started_date_raw' => null,
                    'session_started_time_raw' => null,
                ];
            }

            $is_reserved_ever = false;
            $any_slot_status = null;
            $reserved_date = null;
            $reserved_time = null;
            $reserved_date_raw = null;
            $reserved_time_raw = null;
            $reserved_by_me = false;
            $student_id_number = null;

            if (count($all_reservations) > 0) {
                $is_reserved_ever = true;
                $first_res = $all_reservations[0];
                $any_slot_status = $first_res['status'];
                $reserved_date = $first_res['reservation_date'];
                $reserved_time = $first_res['reservation_time'];
                $reserved_date_raw = $first_res['reservation_date_raw'];
                $reserved_time_raw = $first_res['reservation_time_raw'];
                $reserved_by_me = $first_res['reserved_by_me'];
                $student_id_number = $first_res['student_id_number'];
            }

            // PC is logically available for booking ONLY if status is 'available' AND not reserved for that EXACT slot AND no active sitting session
            $is_available = ($row['status'] === 'available') && !$is_reserved_for_slot && !$is_session_active;

            $pcs[] = [
                'pc_number' => $row['pc_number'],
                'status' => $row['status'],
                'available' => $is_available,
                'is_reserved' => $has_any_today || $is_reserved_ever,
                'is_reserved_slot' => $is_reserved_for_slot,
                'is_mine' => $is_mine_slot || $is_mine_now || $is_my_pc_today || $is_my_pc_ever,
                'occupied_now' => $is_occupied_now,
                'slot_status' => $slot_status !== null ? $slot_status : ($my_slot_status !== null ? $my_slot_status : $any_slot_status),
                'reserved_date' => $reserved_date,
                'reserved_time' => $reserved_time,
                'reserved_date_raw' => $reserved_date_raw,
                'reserved_time_raw' => $reserved_time_raw,
                'reserved_by_me' => $reserved_by_me,
                'student_id_number' => $student_id_number,
                'is_session_active' => $is_session_active,
                'session_started_date' => $session_started_date,
                'session_started_time' => $session_started_time,
                'session_started_date_raw' => $session_started_date_raw,
                'session_started_time_raw' => $session_started_time_raw,
                'session_student_id_number' => $session_student_id_number,
                'all_reservations' => $all_reservations
            ];
        }

        json_response(200, [
            'success' => true,
            'message' => 'PC availability loaded',
            'data' => $pcs
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_create_reservation(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    $lab_id = intval($input['lab_id'] ?? 0);
    $pc_number = esc($db, $input['pc_number'] ?? '');
    
    $date = esc($db, $input['reservation_date'] ?? date('Y-m-d'));
    $time_from = esc($db, $input['startTime'] ?? '');
    $time_to = esc($db, $input['endTime'] ?? '');

    if ($id_number === '' || $lab_id <= 0 || empty($pc_number) || empty($time_from)) {
        json_response(400, ['success' => false, 'message' => 'Missing required reservation data']);
    }

    $slot_start = $time_from;
    $slot_end = !empty($time_to) ? $time_to : date('H:i:s', strtotime($time_from . ' +1 hour'));

    try {
        // Get student ID
        $student_q = "SELECT id FROM students WHERE id_number = '$id_number' LIMIT 1";
        $student_res = $db->query($student_q);
        if (!$student_res || $student_res->num_rows === 0) {
            json_response(404, ['success' => false, 'message' => 'Student not found']);
        }
        $student_id = intval($student_res->fetch_assoc()['id']);

        // Get PC ID
        $pc_q = "SELECT id FROM pcs WHERE lab_id = $lab_id AND pc_number = '$pc_number' LIMIT 1";
        $pc_res = $db->query($pc_q);
        if (!$pc_res || $pc_res->num_rows === 0) {
            json_response(404, ['success' => false, 'message' => 'PC not found in this lab']);
        }
        $pc_id = intval($pc_res->fetch_assoc()['id']);

        // Get lab name first
        $lab_stmt = $db->prepare("SELECT lab_name FROM labs WHERE id = ?");
        $lab_stmt->bind_param('i', $lab_id);
        $lab_stmt->execute();
        $lab_res = $lab_stmt->get_result()->fetch_assoc();
        $lab_name = $lab_res ? $lab_res['lab_name'] : '';

        // Check if there is an active sitting session on this PC (either walk-in or reservation), and check 3 hours rule from its started_at time
        $session_check_sql = "SELECT s.id, s.started_at, s.student_id FROM sit_in_sessions s 
                              WHERE (s.pc_number = ? AND s.room = ? AND s.status = 'active')
                              OR (s.reservation_id IN (SELECT id FROM reservations WHERE pc_id = ?) AND s.status = 'active')";
        $session_check_stmt = $db->prepare($session_check_sql);
        $session_check_stmt->bind_param('ssi', $pc_number, $lab_name, $pc_id);
        $session_check_stmt->execute();
        $session_check_res = $session_check_stmt->get_result();
        if ($session_row = $session_check_res->fetch_assoc()) {
            $started_time = date('H:i:s', strtotime($session_row['started_at']));
            $started_date = date('Y-m-d', strtotime($session_row['started_at']));
            
            if ($date === $started_date) {
                $started_sec = strtotime($started_time);
                $requested_sec = strtotime($slot_start);
                
                if (abs($started_sec - $requested_sec) < 10800) {
                    $conflicting_time = date('g:i A', $started_sec);
                    if (intval($session_row['student_id']) === $student_id) {
                        json_response(400, [
                            'success' => false, 
                            'message' => "Booking Conflict Detected. Your selected time is within 3 hours of your active session started time ($conflicting_time)."
                        ]);
                    } else {
                        json_response(400, [
                            'success' => false, 
                            'message' => "Booking Conflict Detected. Your selected time is within 3 hours of the active session started time ($conflicting_time) on this PC."
                        ]);
                    }
                }
            }
        }

        // Check if already reserved within 3 hours (including active status reservations)
        $check_sql = "SELECT id, student_id, time_from FROM reservations 
                     WHERE pc_id = ? 
                     AND reservation_date = ? 
                     AND ABS(TIME_TO_SEC(time_from) - TIME_TO_SEC(?)) < 10800 
                     AND status IN ('pending', 'approved', 'active')";
        $check_stmt = $db->prepare($check_sql);
        $check_stmt->bind_param('iss', $pc_id, $date, $slot_start);
        $check_stmt->execute();
        $check_res = $check_stmt->get_result();
        if ($check_res->num_rows > 0) {
            $conflicting = $check_res->fetch_assoc();
            $conflicting_time = date('g:i A', strtotime($conflicting['time_from']));
            if (intval($conflicting['student_id']) === $student_id) {
                json_response(400, [
                    'success' => false, 
                    'message' => "You already have a reservation at $conflicting_time. You must choose a time at least 3 hours before or after."
                ]);
            } else {
                json_response(400, [
                    'success' => false, 
                    'message' => "This PC is already reserved by another student at $conflicting_time. You must choose a time at least 3 hours before or after."
                ]);
            }
        }

        $sql = "INSERT INTO reservations (student_id, lab_id, pc_id, pc_number, reservation_date, time_from, time_to, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('iiissss', $student_id, $lab_id, $pc_id, $pc_number, $date, $slot_start, $slot_end);
        
        if ($stmt->execute()) {
            json_response(201, ['success' => true, 'message' => 'Reservation created successfully']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to create reservation']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_delete_reservation(mysqli $db, array $input): void {
    $reservation_id = intval($input['reservation_id'] ?? 0);

    if ($reservation_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid reservation ID']);
    }

    try {
        // Change from DELETE to UPDATE status
        $sql = "UPDATE reservations SET status = 'cancelled' WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('i', $reservation_id);
        
        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                json_response(200, ['success' => true, 'message' => 'Reservation cancelled successfully']);
            } else {
                json_response(404, ['success' => false, 'message' => 'Reservation not found']);
            }
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to cancel reservation']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_get_personal_alerts(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    try {
        $sql = "SELECT n.* FROM student_notifications n 
                JOIN students s ON n.student_id = s.id 
                WHERE s.id_number = ? 
                ORDER BY n.created_at DESC LIMIT 50";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('s', $id_number);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = [
                'id' => intval($row['id']),
                'type' => $row['type'],
                'title' => $row['title'],
                'message' => $row['message'],
                'is_read' => $row['is_read'] == 1,
                'created_at' => $row['created_at']
            ];
        }

        json_response(200, [
            'success' => true,
            'data' => $notifications
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_mark_personal_alert_read(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    $notif_id = intval($input['notification_id'] ?? 0);

    if ($id_number === '' || $notif_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid parameters']);
    }

    try {
        $sql = "UPDATE student_notifications n
                JOIN students s ON n.student_id = s.id
                SET n.is_read = 1 
                WHERE n.id = ? AND s.id_number = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('is', $notif_id, $id_number);
        
        if ($stmt->execute()) {
            json_response(200, ['success' => true, 'message' => 'Notification marked as read']);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to update notification']);
        }
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_mark_all_personal_alerts_read(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    try {
        $query = "UPDATE student_notifications n
                  JOIN students s ON n.student_id = s.id
                  SET n.is_read = 1
                  WHERE s.id_number = '$id_number'";

        if (!$db->query($query)) {
            json_response(500, ['success' => false, 'message' => 'Failed to mark all personal alerts as read']);
        }

        json_response(200, [
            'success' => true,
            'message' => 'All personal alerts marked as read',
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_student_top_labs(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));

    try {
        $query = "SELECT 
                    COALESCE(NULLIF(TRIM(room), ''), 'Unspecified') AS lab,
                    COALESCE(SUM(duration_minutes) / 60.0, 0) AS total_hours,
                    COUNT(*) AS session_count
                  FROM sit_in_records
                  WHERE student_id_number = '$id_number' AND status = 'Completed'
                  GROUP BY COALESCE(NULLIF(TRIM(room), ''), 'Unspecified')
                  ORDER BY total_hours DESC
                  LIMIT 5";
                  
        $result = $db->query($query);
        if (!$result) {
            json_response(500, ['success' => false, 'message' => 'Failed to query top labs']);
        }
        
        $labs = [];
        while ($row = $result->fetch_assoc()) {
            if ($row['lab'] === 'Unspecified') continue;
            $labs[] = [
                'lab' => $row['lab'],
                'total_hours' => floatval($row['total_hours']),
                'session_count' => intval($row['session_count'])
            ];
        }
        

        
        json_response(200, [
            'success' => true,
            'data' => $labs
        ]);
    } catch (Exception $e) {
        json_response(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handle_student_get_testimonial(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    // 1. Get the latest active pending testimonial (active/editable)
    $active = null;
    $sql = "SELECT rating, feedback, status, created_at FROM testimonials 
            WHERE student_id_number = ? AND status = 'pending'
            ORDER BY created_at DESC LIMIT 1";
    $stmt = $db->prepare($sql);
    if ($stmt) {
        $stmt->bind_param('s', $id_number);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $active = [
                'rating' => intval($row['rating']),
                'feedback' => $row['feedback'],
                'status' => $row['status'],
                'created_at' => $row['created_at']
            ];
        }
    }

    // 1b. Get the overall latest testimonial (for status badge display)
    $latest = null;
    $sql_latest = "SELECT rating, feedback, status, created_at FROM testimonials 
                   WHERE student_id_number = ? 
                   ORDER BY created_at DESC LIMIT 1";
    $stmt_latest = $db->prepare($sql_latest);
    if ($stmt_latest) {
        $stmt_latest->bind_param('s', $id_number);
        $stmt_latest->execute();
        $result_latest = $stmt_latest->get_result();
        if ($row = $result_latest->fetch_assoc()) {
            $latest = [
                'rating' => intval($row['rating']),
                'feedback' => $row['feedback'],
                'status' => $row['status'],
                'created_at' => $row['created_at']
            ];
        }
    }

    // 2. Get the history of ALL testimonials submitted by this student
    $history = [];
    $history_sql = "SELECT id, rating, feedback, status, created_at FROM testimonials 
                    WHERE student_id_number = ? 
                    ORDER BY created_at DESC";
    $history_stmt = $db->prepare($history_sql);
    if ($history_stmt) {
        $history_stmt->bind_param('s', $id_number);
        $history_stmt->execute();
        $history_result = $history_stmt->get_result();
        while ($row = $history_result->fetch_assoc()) {
            $history[] = [
                'id' => intval($row['id']),
                'rating' => intval($row['rating']),
                'feedback' => $row['feedback'],
                'status' => $row['status'],
                'created_at' => $row['created_at']
            ];
        }
    }

    json_response(200, [
        'success' => true,
        'data' => [
            'active' => $active,
            'latest' => $latest,
            'history' => $history
        ]
    ]);
}

function handle_student_submit_testimonial(mysqli $db, array $input): void {
    $id_number = esc($db, trim($input['idNumber'] ?? ''));
    $rating = intval($input['rating'] ?? 0);
    $feedback = esc($db, trim($input['feedback'] ?? ''));

    if ($id_number === '') {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }
    if ($rating < 1 || $rating > 5) {
        json_response(400, ['success' => false, 'message' => 'Rating must be between 1 and 5']);
    }
    if ($feedback === '') {
        json_response(400, ['success' => false, 'message' => 'Feedback is required']);
    }

    // Check if a PENDING testimonial exists that can be updated
    $check_sql = "SELECT id FROM testimonials WHERE student_id_number = ? AND status = 'pending' LIMIT 1";
    $check_stmt = $db->prepare($check_sql);
    $check_stmt->bind_param('s', $id_number);
    $check_stmt->execute();
    $check_res = $check_stmt->get_result();

    if ($check_res->num_rows > 0) {
        // Update the existing pending testimonial
        $row = $check_res->fetch_assoc();
        $id = intval($row['id']);
        $update_sql = "UPDATE testimonials SET rating = ?, feedback = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?";
        $update_stmt = $db->prepare($update_sql);
        $update_stmt->bind_param('isi', $rating, $feedback, $id);
        if ($update_stmt->execute()) {
            json_response(200, [
                'success' => true,
                'message' => 'Testimonial updated successfully. Awaiting admin approval!'
            ]);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to update testimonial']);
        }
    } else {
        // Insert a brand new testimonial
        $insert_sql = "INSERT INTO testimonials (student_id_number, rating, feedback, status) VALUES (?, ?, ?, 'pending')";
        $insert_stmt = $db->prepare($insert_sql);
        $insert_stmt->bind_param('sis', $id_number, $rating, $feedback);
        if ($insert_stmt->execute()) {
            json_response(200, [
                'success' => true,
                'message' => 'Testimonial submitted successfully. Awaiting admin approval!'
            ]);
        } else {
            json_response(500, ['success' => false, 'message' => 'Failed to submit testimonial']);
        }
    }
}
