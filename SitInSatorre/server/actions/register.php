<?php
// Register new student
if ($action === 'register' && $request_method === 'POST') {
    debug_log("Register action triggered");
    debug_log("Input data: " . json_encode($input));
    
    if (!isset($input['idNumber']) || !isset($input['firstName']) || !isset($input['lastName']) || !isset($input['email']) || !isset($input['password'])) {
        debug_log("Missing required fields");
        http_response_code(400);
        $response['message'] = 'Missing required fields';
        echo json_encode($response);
        exit();
    }

    $id_number = $db->real_escape_string($input['idNumber']);
    $first_name = $db->real_escape_string($input['firstName']);
    $last_name = $db->real_escape_string($input['lastName']);
    $middle_name = $db->real_escape_string($input['middleName'] ?? '');
    $email = $db->real_escape_string($input['email']);
    $password = password_hash($input['password'], PASSWORD_BCRYPT);
    $course = $db->real_escape_string($input['course'] ?? '');
    $year_level = intval($input['courseLevel'] ?? 0);
    $address = $db->real_escape_string($input['address'] ?? '');

    $insert_query = "INSERT INTO students (id_number, first_name, last_name, middle_name, email, password, course, year_level, address) 
                    VALUES ('$id_number', '$first_name', '$last_name', '$middle_name', '$email', '$password', '$course', $year_level, '$address')";

    debug_log("Executing insert query");

    if ($db->query($insert_query)) {
        debug_log("Registration successful for: " . $email);
        http_response_code(201);
        $response['success'] = true;
        $response['message'] = 'Registration successful';
        echo json_encode($response);
    } else {
        debug_log("Insert query failed: " . $db->error);
        $error = $db->error;
        
        // Check for duplicate entry errors
        if (strpos($error, 'Duplicate entry') !== false || strpos($error, 'duplicate') !== false) {
            http_response_code(409);
            if (strpos($error, 'id_number') !== false) {
                $response['message'] = 'Student ID is already exist.';
            } elseif (strpos($error, 'email') !== false) {
                $response['message'] = 'Email is already exist';
            } else {
                $response['message'] = 'Duplicate entry found.';
            }
        } else {
            http_response_code(500);
            $response['message'] = 'Registration failed';
        }
        echo json_encode($response);
    }
    exit();
}
?>
