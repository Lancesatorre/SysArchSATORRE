<?php

function handle_register(mysqli $db, array $input): void {
    if (!isset($input['idNumber'], $input['firstName'], $input['lastName'], $input['email'], $input['password'])) {
        json_response(400, ['success' => false, 'message' => 'Missing required fields']);
    }

    $id_number = esc($db, $input['idNumber']);
    $first_name = esc($db, $input['firstName']);
    $last_name = esc($db, $input['lastName']);
    $middle_name = esc($db, $input['middleName'] ?? '');
    $email = esc($db, $input['email']);
    $password = password_hash($input['password'], PASSWORD_BCRYPT);
    $course = esc($db, $input['course'] ?? '');
    $year_level = intval($input['courseLevel'] ?? 0);
    $address = esc($db, $input['address'] ?? '');

    $insert_query = "INSERT INTO students (id_number, first_name, last_name, middle_name, email, password, course, year_level, address)
                    VALUES ('$id_number', '$first_name', '$last_name', '$middle_name', '$email', '$password', '$course', $year_level, '$address')";

    if ($db->query($insert_query)) {
        json_response(201, ['success' => true, 'message' => 'Registration successful']);
    }

    $error = $db->error;
    if (strpos($error, 'Duplicate entry') !== false || strpos($error, 'duplicate') !== false) {
        if (strpos($error, 'id_number') !== false) {
            json_response(409, ['success' => false, 'message' => 'Student ID is already exist.']);
        }
        if (strpos($error, 'email') !== false) {
            json_response(409, ['success' => false, 'message' => 'Email is already exist']);
        }
        json_response(409, ['success' => false, 'message' => 'Duplicate entry found.']);
    }

    json_response(500, ['success' => false, 'message' => 'Registration failed']);
}

function handle_login(mysqli $db, array $input): void {
    if (!isset($input['idNumber'], $input['password'])) {
        json_response(400, ['success' => false, 'message' => 'ID number and password required']);
    }

    $id_number = esc($db, $input['idNumber']);
    $password = $input['password'];

    if ($id_number === ADMIN_ID) {
        if (hash_equals(ADMIN_PASSWORD, $password)) {
            json_response(200, [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => 0,
                    'id_number' => ADMIN_ID,
                    'first_name' => ADMIN_FIRST_NAME,
                    'last_name' => ADMIN_LAST_NAME,
                    'email' => ADMIN_EMAIL,
                    'role' => ADMIN_ROLE,
                ],
            ]);
        }

        json_response(401, ['success' => false, 'message' => 'Invalid password']);
    }

    $query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture
              FROM students
              WHERE id_number = '$id_number'";
    $result = $db->query($query);

    if (!$result || $result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'User not found']);
    }

    $student = $result->fetch_assoc();
    $stored_password_query = 'SELECT password FROM students WHERE id = ' . $student['id'];
    $pwd_result = $db->query($stored_password_query);
    $pwd_row = $pwd_result ? $pwd_result->fetch_assoc() : null;

    if (!$pwd_row || !password_verify($password, $pwd_row['password'])) {
        json_response(401, ['success' => false, 'message' => 'Invalid password']);
    }

    $student['role'] = 'student';
    json_response(200, [
        'success' => true,
        'message' => 'Login successful',
        'user' => $student,
    ]);
}

function handle_update_profile(mysqli $db, array $input): void {
    if (!isset($input['idNumber'])) {
        json_response(400, ['success' => false, 'message' => 'ID number is required']);
    }

    $id_number = esc($db, $input['idNumber']);
    $first_name = esc($db, trim($input['firstName'] ?? ''));
    $last_name = esc($db, trim($input['lastName'] ?? ''));
    $middle_name = esc($db, trim($input['middleName'] ?? ''));
    $address = esc($db, trim($input['address'] ?? ''));
    $profile_picture = isset($input['photo']) ? esc($db, $input['photo']) : null;

    if ($first_name === '' || $last_name === '') {
        json_response(400, ['success' => false, 'message' => 'First name and last name are required']);
    }

    $update_query = "UPDATE students
                     SET first_name = '$first_name',
                         last_name = '$last_name',
                         middle_name = '$middle_name',
                         address = '$address'" . ($profile_picture ? ", profile_picture = '$profile_picture'" : '') . "
                     WHERE id_number = '$id_number'";

    if (!$db->query($update_query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to update profile']);
    }

    $fetch_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, profile_picture
                    FROM students
                    WHERE id_number = '$id_number'
                    LIMIT 1";
    $fetch_result = $db->query($fetch_query);

    if (!$fetch_result || $fetch_result->num_rows === 0) {
        json_response(404, ['success' => false, 'message' => 'User not found']);
    }

    $student = $fetch_result->fetch_assoc();
    $student['role'] = 'student';

    json_response(200, [
        'success' => true,
        'message' => 'Profile updated successfully',
        'user' => $student,
    ]);
}
