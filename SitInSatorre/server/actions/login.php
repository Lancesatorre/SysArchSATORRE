<?php
// Login user (admin or student)
if ($action === 'login' && $request_method === 'POST') {
    debug_log("Login action triggered");
    debug_log("Input data: " . json_encode($input));
    
    if (!isset($input['idNumber']) || !isset($input['password'])) {
        debug_log("Missing ID number or password");
        http_response_code(400);
        $response['message'] = 'ID number and password required';
        echo json_encode($response);
        exit();
    }

    $id_number = $db->real_escape_string($input['idNumber']);
    $password = $input['password'];

    // Check for admin login
    if ($id_number === ADMIN_ID) {
        if (hash_equals(ADMIN_PASSWORD, $password)) {
            http_response_code(200);
            $response['success'] = true;
            $response['message'] = 'Login successful';
            $response['user'] = [
                'id' => 0,
                'id_number' => ADMIN_ID,
                'first_name' => ADMIN_FIRST_NAME,
                'last_name' => ADMIN_LAST_NAME,
                'email' => ADMIN_EMAIL,
                'role' => ADMIN_ROLE,
            ];
            echo json_encode($response);
        } else {
            http_response_code(401);
            $response['message'] = 'Invalid password';
            echo json_encode($response);
        }
        exit();
    }

    // Student login
    $query = "SELECT id, id_number, first_name, last_name, middle_name, email, course, year_level, address, available_sessions, profile_picture FROM students WHERE id_number = '$id_number'";
    $result = $db->query($query);

    debug_log("Login query executed for ID: " . $id_number);

    if ($result && $result->num_rows > 0) {
        $student = $result->fetch_assoc();
        debug_log("Student found: " . $student['id_number']);
        
        $stored_password_query = "SELECT password FROM students WHERE id = " . $student['id'];
        $pwd_result = $db->query($stored_password_query);
        $pwd_row = $pwd_result->fetch_assoc();

        if (password_verify($password, $pwd_row['password'])) {
            debug_log("Password verified for: " . $id_number);
            http_response_code(200);
            $response['success'] = true;
            $response['message'] = 'Login successful';
            $student['role'] = 'student';
            $response['user'] = $student;
            echo json_encode($response);
        } else {
            debug_log("Password verification failed for: " . $id_number);
            http_response_code(401);
            $response['message'] = 'Invalid password';
            echo json_encode($response);
        }
    } else {
        debug_log("User not found: " . $id_number);
        http_response_code(404);
        $response['message'] = 'User not found';
        echo json_encode($response);
    }
    exit();
}
?>
