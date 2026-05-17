<?php

function handle_admin_get_software(mysqli $db, array $input): void {
    // Read-only endpoint allowed for both administrative and student portal views


    $query = "SELECT id, name, version, category, description, installation_date, license_type, status, created_at, updated_at
              FROM software
              ORDER BY name ASC";
    $result = $db->query($query);

    if (!$result) {
        json_response(500, ['success' => false, 'message' => 'Failed to load software records']);
    }

    $records = [];
    while ($row = $result->fetch_assoc()) {
        $software_id = intval($row['id']);
        
        // Fetch assigned labs
        $labs_query = "SELECT l.id, l.lab_name, l.location, sl.status
                       FROM labs l 
                       JOIN software_labs sl ON l.id = sl.lab_id 
                       WHERE sl.software_id = $software_id";
        $labs_result = $db->query($labs_query);
        
        $assigned_labs = [];
        if ($labs_result) {
            while ($lab_row = $labs_result->fetch_assoc()) {
                $assigned_labs[] = $lab_row;
            }
        }
        
        $row['labs'] = $assigned_labs;
        $records[] = $row;
    }

    json_response(200, [
        'success' => true,
        'message' => 'Software records loaded successfully',
        'records' => $records,
    ]);
}

function handle_admin_add_software(mysqli $db, array $input): void {
    require_admin_access($input);

    $name = trim($input['name'] ?? '');
    $version = trim($input['version'] ?? '');
    $category = trim($input['category'] ?? '');
    $description = trim($input['description'] ?? '');
    $installation_date = trim($input['installation_date'] ?? '');
    $license_type = trim($input['license_type'] ?? 'Open Source');
    $status = trim($input['status'] ?? 'Active');
    $lab_ids = $input['labs'] ?? []; // Array of lab IDs

    if ($name === '' || $version === '' || $category === '') {
        json_response(400, ['success' => false, 'message' => 'Name, version, and category are required']);
    }

    // Check if name is unique
    $name_esc = esc($db, $name);
    $check_query = "SELECT 1 FROM software WHERE name = '$name_esc'";
    $check_result = $db->query($check_query);
    if ($check_result && $check_result->num_rows > 0) {
        json_response(400, ['success' => false, 'message' => 'A software application with this name already exists']);
    }

    $name_esc = esc($db, $name);
    $version_esc = esc($db, $version);
    $category_esc = esc($db, $category);
    $desc_esc = esc($db, $description);
    $inst_date_esc = $installation_date !== '' ? esc($db, $installation_date) : null;
    $license_esc = esc($db, $license_type);
    $status_esc = esc($db, $status);

    $inst_date_val = $inst_date_esc ? "'$inst_date_esc'" : "NULL";

    $query = "INSERT INTO software (name, version, category, description, installation_date, license_type, status)
              VALUES ('$name_esc', '$version_esc', '$category_esc', '$desc_esc', $inst_date_val, '$license_esc', '$status_esc')";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to create software: ' . $db->error]);
    }

    $software_id = $db->insert_id;

    // Add lab assignments
    if (is_array($lab_ids) && count($lab_ids) > 0) {
        foreach ($lab_ids as $lab_item) {
            $status_str = 'Active';
            if (is_array($lab_item)) {
                $lab_id_int = intval($lab_item['id'] ?? 0);
                $status_str = trim($lab_item['status'] ?? 'Active');
            } else {
                $lab_id_int = intval($lab_item);
            }
            if ($lab_id_int > 0) {
                $status_esc = esc($db, $status_str);
                $db->query("INSERT IGNORE INTO software_labs (software_id, lab_id, status) VALUES ($software_id, $lab_id_int, '$status_esc')");
            }
        }
    }

    json_response(201, [
        'success' => true,
        'message' => 'Software application added successfully',
        'softwareId' => $software_id,
    ]);
}

function handle_admin_edit_software(mysqli $db, array $input): void {
    require_admin_access($input);

    $id = intval($input['id'] ?? 0);
    $name = trim($input['name'] ?? '');
    $version = trim($input['version'] ?? '');
    $category = trim($input['category'] ?? '');
    $description = trim($input['description'] ?? '');
    $installation_date = trim($input['installation_date'] ?? '');
    $license_type = trim($input['license_type'] ?? 'Open Source');
    $status = trim($input['status'] ?? 'Active');
    $lab_ids = $input['labs'] ?? []; // Array of lab IDs

    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid software ID']);
    }

    if ($name === '' || $version === '' || $category === '') {
        json_response(400, ['success' => false, 'message' => 'Name, version, and category are required']);
    }

    // Check uniqueness excluding current record
    $name_esc = esc($db, $name);
    $check_query = "SELECT 1 FROM software WHERE name = '$name_esc' AND id != $id";
    $check_result = $db->query($check_query);
    if ($check_result && $check_result->num_rows > 0) {
        json_response(400, ['success' => false, 'message' => 'Another software application with this name already exists']);
    }

    $name_esc = esc($db, $name);
    $version_esc = esc($db, $version);
    $category_esc = esc($db, $category);
    $desc_esc = esc($db, $description);
    $inst_date_esc = $installation_date !== '' ? esc($db, $installation_date) : null;
    $license_esc = esc($db, $license_type);
    $status_esc = esc($db, $status);

    $inst_date_val = $inst_date_esc ? "'$inst_date_esc'" : "NULL";

    $query = "UPDATE software
              SET name = '$name_esc',
                  version = '$version_esc',
                  category = '$category_esc',
                  description = '$desc_esc',
                  installation_date = $inst_date_val,
                  license_type = '$license_esc',
                  status = '$status_esc'
              WHERE id = $id";

    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to update software: ' . $db->error]);
    }

    // Update lab assignments by deleting old and adding new
    $db->query("DELETE FROM software_labs WHERE software_id = $id");

    if (is_array($lab_ids) && count($lab_ids) > 0) {
        foreach ($lab_ids as $lab_item) {
            $status_str = 'Active';
            if (is_array($lab_item)) {
                $lab_id_int = intval($lab_item['id'] ?? 0);
                $status_str = trim($lab_item['status'] ?? 'Active');
            } else {
                $lab_id_int = intval($lab_item);
            }
            if ($lab_id_int > 0) {
                $status_esc = esc($db, $status_str);
                $db->query("INSERT IGNORE INTO software_labs (software_id, lab_id, status) VALUES ($id, $lab_id_int, '$status_esc')");
            }
        }
    }

    json_response(200, [
        'success' => true,
        'message' => 'Software application updated successfully',
    ]);
}

function handle_admin_delete_software(mysqli $db, array $input): void {
    require_admin_access($input);

    $id = intval($input['id'] ?? 0);
    if ($id <= 0) {
        json_response(400, ['success' => false, 'message' => 'Invalid software ID']);
    }

    // ON DELETE CASCADE automatically cleans up software_labs entries
    $query = "DELETE FROM software WHERE id = $id";
    if (!$db->query($query)) {
        json_response(500, ['success' => false, 'message' => 'Failed to delete software application']);
    }

    json_response(200, [
        'success' => true,
        'message' => 'Software application deleted successfully',
    ]);
}

function handle_admin_bulk_add_software(mysqli $db, array $input): void {
    require_admin_access($input);

    $software_list = $input['software_list'] ?? [];
    if (!is_array($software_list) || count($software_list) === 0) {
        json_response(400, ['success' => false, 'message' => 'No software applications provided for bulk import']);
    }

    // Fetch all active labs to map names to IDs easily
    $labs_res = $db->query("SELECT id, lab_name FROM labs");
    $lab_map = [];
    if ($labs_res) {
        while ($lab_row = $labs_res->fetch_assoc()) {
            $lab_map[strtolower(trim($lab_row['lab_name']))] = intval($lab_row['id']);
        }
    }

    $imported_count = 0;
    $updated_count = 0;

    foreach ($software_list as $item) {
        $name = trim($item['name'] ?? '');
        $version = trim($item['version'] ?? '');
        $category = trim($item['category'] ?? '');
        $description = trim($item['description'] ?? '');
        $installation_date = trim($item['installation_date'] ?? '');
        $license_type = trim($item['license_type'] ?? 'Open Source');
        $status = trim($item['status'] ?? 'Active');
        $csv_labs = $item['labs'] ?? ''; // Can be string "Lab 524, Lab 526" or array of IDs/Names

        if ($name === '' || $version === '' || $category === '') {
            continue; // Skip invalid entries
        }

        $name_esc = esc($db, $name);
        $version_esc = esc($db, $version);
        $category_esc = esc($db, $category);
        $desc_esc = esc($db, $description);
        $inst_date_esc = $installation_date !== '' ? esc($db, $installation_date) : null;
        $license_esc = esc($db, $license_type);
        $status_esc = esc($db, $status);

        $inst_date_val = $inst_date_esc ? "'$inst_date_esc'" : "NULL";

        // Check if application exists
        $check = $db->query("SELECT id FROM software WHERE name = '$name_esc'");
        $software_id = 0;
        
        if ($check && $check->num_rows > 0) {
            $existing = $check->fetch_assoc();
            $software_id = intval($existing['id']);
            
            $db->query("UPDATE software 
                        SET version = '$version_esc', 
                            category = '$category_esc', 
                            description = '$desc_esc', 
                            installation_date = $inst_date_val, 
                            license_type = '$license_esc', 
                            status = '$status_esc' 
                        WHERE id = $software_id");
            $updated_count++;
        } else {
            $db->query("INSERT INTO software (name, version, category, description, installation_date, license_type, status)
                        VALUES ('$name_esc', '$version_esc', '$category_esc', '$desc_esc', $inst_date_val, '$license_esc', '$status_esc')");
            $software_id = $db->insert_id;
            $imported_count++;
        }

        if ($software_id > 0) {
            // Delete old lab assignments for clean update
            $db->query("DELETE FROM software_labs WHERE software_id = $software_id");

            // Process assigned labs
            $assigned_labs = [];
            if (is_string($csv_labs)) {
                $assigned_labs = array_map('trim', explode(',', $csv_labs));
            } elseif (is_array($csv_labs)) {
                $assigned_labs = $csv_labs;
            }

            foreach ($assigned_labs as $lab_val) {
                if (is_numeric($lab_val)) {
                    $lab_id_int = intval($lab_val);
                    $db->query("INSERT IGNORE INTO software_labs (software_id, lab_id) VALUES ($software_id, $lab_id_int)");
                } else {
                    // Match lab name
                    $lab_key = strtolower(trim($lab_val));
                    // Check direct match
                    if (isset($lab_map[$lab_key])) {
                        $lab_id_int = $lab_map[$lab_key];
                        $db->query("INSERT IGNORE INTO software_labs (software_id, lab_id) VALUES ($software_id, $lab_id_int)");
                    } else {
                        // Check if adding "Lab " prefix matches
                        $prefixed_key = 'lab ' . $lab_key;
                        if (isset($lab_map[$prefixed_key])) {
                            $lab_id_int = $lab_map[$prefixed_key];
                            $db->query("INSERT IGNORE INTO software_labs (software_id, lab_id) VALUES ($software_id, $lab_id_int)");
                        }
                    }
                }
            }
        }
    }

    json_response(200, [
        'success' => true,
        'message' => "Bulk import completed. Added $imported_count applications, updated $updated_count applications.",
    ]);
}
