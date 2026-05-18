<?php

function handle_admin_list_students(mysqli $db, array $input): void {
    require_admin_access($input);

    $query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
              FROM students
              ORDER BY id DESC";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load students']);
    }

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $row['role'] = 'student';
        $students[] = $row;
    }

    json_response(200, ['success' => true, 'message' => 'Students loaded', 'students' => $students]);
}

function handle_admin_search_student(mysqli $db, array $input): void {
    require_admin_access($input);

    $keyword = trim($input['studentKeyword'] ?? '');
    if ($keyword === '') {
        json_response(400, ['success' => false, 'message' => 'Student keyword is required']);
    }

    $keyword_escaped = esc($db, $keyword);
    $query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
              FROM students
              WHERE id_number LIKE '%$keyword_escaped%'
                 OR first_name LIKE '%$keyword_escaped%'
                 OR last_name LIKE '%$keyword_escaped%'
              ORDER BY id DESC
              LIMIT 20";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Search failed']);
    }

    $students = [];
    while ($row = $result->fetch_assoc()) {
        $row['role'] = 'student';
        $students[] = $row;
    }

    json_response(200, ['success' => true, 'message' => 'Search completed', 'students' => $students]);
}

function handle_admin_update_student(mysqli $db, array $input): void {
    require_admin_access($input);

    $student_id = intval($input['id'] ?? 0);
    if ($student_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid student ID']);
    }

    $first_name = esc($db, trim($input['firstName'] ?? ''));
    $last_name = esc($db, trim($input['lastName'] ?? ''));
    $middle_name = esc($db, trim($input['middleName'] ?? ''));
    $course = esc($db, trim($input['course'] ?? ''));
    $year_level = intval($input['yearLevel'] ?? 0);
    $address = esc($db, trim($input['address'] ?? ''));
    $available_sessions = intval($input['availableSessions'] ?? 0);

    if ($first_name === '' || $last_name === '') {
        json_response(400, ['success' => false, 'message' => 'First name and last name are required']);
    }

    $query = "UPDATE students
              SET first_name = '$first_name',
                  last_name = '$last_name',
                  middle_name = '$middle_name',
                  course = '$course',
                  year_level = $year_level,
                  address = '$address',
                  available_sessions = $available_sessions
              WHERE id = $student_id";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to update student']);
    }

    json_response(200, ['success' => true, 'message' => 'Student updated successfully']);
}

function handle_admin_delete_student(mysqli $db, array $input): void {
    require_admin_access($input);

    $student_id = intval($input['id'] ?? 0);
    if ($student_id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid student ID']);
    }

    $query = "DELETE FROM students WHERE id = $student_id";
    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to delete student']);
    }

    json_response(200, ['success' => true, 'message' => 'Student deleted successfully']);
}

function handle_admin_list_testimonials(mysqli $db, array $input): void {
    require_admin_access($input);

    // Fetch all student testimonials
    $sql = "SELECT 
            t.id,
            t.student_id_number,
            t.rating,
            t.feedback,
            t.status,
            t.created_at,
            s.first_name,
            s.last_name,
            s.course,
            s.profile_picture
            FROM testimonials t
            JOIN students s ON t.student_id_number = s.id_number
            ORDER BY t.created_at DESC";
            
    $result = $db->query($sql);
    
    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load testimonials']);
    }
    
    $testimonials = [];
    while ($row = $result->fetch_assoc()) {
        $testimonials[] = [
            'id' => intval($row['id']),
            'student_id_number' => $row['student_id_number'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'course' => $row['course'],
            'rating' => intval($row['rating']),
            'feedback' => $row['feedback'],
            'status' => $row['status'],
            'profile_picture' => $row['profile_picture'],
            'created_at' => $row['created_at']
        ];
    }
    
    json_response(200, [
        'success' => true,
        'data' => $testimonials
    ]);
}

function handle_admin_moderate_testimonial(mysqli $db, array $input): void {
    require_admin_access($input);

    $id = intval($input['id'] ?? 0);
    $status = esc($db, trim($input['status'] ?? ''));

    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid testimonial ID']);
    }
    if (!in_array($status, ['approved', 'declined', 'pending'], true)) {
        json_response(400, ['success' => false, 'message' => 'Invalid moderation status']);
    }

    $sql = "UPDATE testimonials SET status = ? WHERE id = ?";
    $stmt = $db->prepare($sql);
    if (!$stmt) {
        json_response(500, ['success' => false, 'message' => 'Prepare failed: ' . $db->error]);
    }

    $stmt->bind_param('si', $status, $id);
    if ($stmt->execute()) {
        json_response(200, [
            'success' => true,
            'message' => 'Testimonial status updated to ' . $status
        ]);
    } else {
        json_response(500, ['success' => false, 'message' => 'Failed to update testimonial status']);
    }
}
