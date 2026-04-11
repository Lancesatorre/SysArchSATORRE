<?php
// Update student profile
if ($action === 'updateProfile' && $request_method === 'POST') {
    debug_log("Update profile action triggered");
    debug_log("Input data: " . json_encode($input));

    if (!isset($input['idNumber'])) {
        http_response_code(400);
        $response['message'] = 'ID number is required';
        echo json_encode($response);
        exit();
    }

    $id_number = $db->real_escape_string($input['idNumber']);
    $first_name = $db->real_escape_string(trim($input['firstName'] ?? ''));
    $last_name = $db->real_escape_string(trim($input['lastName'] ?? ''));
    $middle_name = $db->real_escape_string(trim($input['middleName'] ?? ''));
    $address = $db->real_escape_string(trim($input['address'] ?? ''));
    $profile_picture = isset($input['photo']) ? $db->real_escape_string($input['photo']) : null;

    if ($first_name === '' || $last_name === '') {
        http_response_code(400);
        $response['message'] = 'First name and last name are required';
        echo json_encode($response);
        exit();
    }

    $update_query = "UPDATE students
                     SET first_name = '$first_name',
                         last_name = '$last_name',
                         middle_name = '$middle_name',
                         address = '$address'" . ($profile_picture ? ", profile_picture = '$profile_picture'" : "") . "
                     WHERE id_number = '$id_number'";

    if (!$db->query($update_query)) {
        debug_log("Profile update failed: " . $db->error);
        http_response_code(500);
        $response['message'] = 'Failed to update profile';
        echo json_encode($response);
        exit();
    }

    if ($db->affected_rows < 0) {
        http_response_code(500);
        $response['message'] = 'Failed to update profile';
        echo json_encode($response);
        exit();
    }

    $fetch_query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, profile_picture
                    FROM students WHERE id_number = '$id_number' LIMIT 1";
    $fetch_result = $db->query($fetch_query);

    if (!$fetch_result || $fetch_result->num_rows === 0) {
        http_response_code(404);
        $response['message'] = 'User not found';
        echo json_encode($response);
        exit();
    }

    $student = $fetch_result->fetch_assoc();
    $student['role'] = 'student';

    http_response_code(200);
    $response['success'] = true;
    $response['message'] = 'Profile updated successfully';
    $response['user'] = $student;
    echo json_encode($response);
    exit();
}
?>
