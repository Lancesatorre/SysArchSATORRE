<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

if (!isset($conn)) {
    $conn = connect_db();
}

function connect_db(): mysqli {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD);

    if ($db->connect_error) {
        debug_log('Database connection failed: ' . $db->connect_error);
        json_response(500, [
            'success' => false,
            'message' => 'Database connection failed: ' . $db->connect_error,
        ]);
    }

    if (!$db->query('CREATE DATABASE IF NOT EXISTS ' . DB_NAME)) {
        debug_log('Failed to create database: ' . $db->error);
        json_response(500, [
            'success' => false,
            'message' => 'Failed to create database',
        ]);
    }

    $db->select_db(DB_NAME);
    $db->set_charset('utf8mb4');
    $db->query("SET time_zone = '+08:00'");

    return $db;
}

function initialize_schema(mysqli $db): void {
    $sql_path = __DIR__ . '/database.sql';
    if (!file_exists($sql_path)) {
        debug_log('Database SQL schema file not found at: ' . $sql_path);
        return;
    }

    $sql_content = file_get_contents($sql_path);
    
    // Remove multi-line comments
    $sql_content = preg_replace('!/\*.*?\*/!s', '', $sql_content);
    
    // Remove inline and single-line comments
    $sql_content = preg_replace('/--.*$/m', '', $sql_content);
    $sql_content = preg_replace('/#.*$/m', '', $sql_content);
    
    // Split into individual lines to assemble queries
    $lines = explode("\n", $sql_content);
    $queries = [];
    $current_query = '';
    
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line)) {
            continue;
        }
        
        $current_query .= ' ' . $line;
        
        // If the line ends with a semicolon, it's a complete query
        if (substr(rtrim($line), -1) === ';') {
            $queries[] = trim($current_query);
            $current_query = '';
        }
    }
    
    // Execute all parsed queries in order
    foreach ($queries as $query) {
        // Skip database creation and database selection statements since connection handles that
        if (stripos($query, 'CREATE DATABASE') === 0 || stripos($query, 'USE ') === 0) {
            continue;
        }
        
        if (!$db->query($query)) {
            debug_log('Failed to execute central database.sql query: ' . $db->error . ' | Query: ' . substr($query, 0, 150));
        }
    }

    // Add location and status columns to labs if they don't exist
    ensure_column_exists($db, 'labs', 'location', "ALTER TABLE labs ADD COLUMN location VARCHAR(100) DEFAULT 'CCS Building' AFTER lab_name");
    ensure_column_exists($db, 'labs', 'status', "ALTER TABLE labs ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'active' AFTER capacity");

    // Add UNIQUE constraint to lab_name and clean up duplicates
    ensure_unique_constraint($db, 'labs', 'lab_name');

    // Clean up and rebuild PCs table to remove duplicates or fill missing ones
    $labs_result = $db->query("SELECT id FROM labs");
    if ($labs_result) {
        while ($lab = $labs_result->fetch_assoc()) {
            $lab_id = $lab['id'];
            // Check if this lab has PCs
            $pc_check = $db->query("SELECT COUNT(*) as count FROM pcs WHERE lab_id = $lab_id");
            $row = $pc_check ? $pc_check->fetch_assoc() : null;
            if (!$row || intval($row['count']) == 0) {
                for ($i = 1; $i <= 50; $i++) {
                    $db->query("INSERT IGNORE INTO pcs (lab_id, pc_number, status) VALUES ($lab_id, 'PC-$i', 'available')");
                }
            }
        }
    }

    // Add UNIQUE constraint to prevent future duplicates (if not exists)
    ensure_unique_constraint($db, 'pcs', 'lab_id, pc_number');

    ensure_column_exists($db, 'students', 'profile_picture', "ALTER TABLE students ADD COLUMN profile_picture LONGTEXT AFTER address");
    ensure_column_exists($db, 'students', 'available_sessions', "ALTER TABLE students ADD COLUMN available_sessions INT NOT NULL DEFAULT 30 AFTER address");
    ensure_column_exists($db, 'sit_in_sessions', 'reservation_id', "ALTER TABLE sit_in_sessions ADD COLUMN reservation_id INT DEFAULT NULL AFTER student_id_number");
    ensure_column_exists($db, 'sit_in_sessions', 'room', "ALTER TABLE sit_in_sessions ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
    ensure_column_exists($db, 'sit_in_sessions', 'purpose', "ALTER TABLE sit_in_sessions ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
    ensure_column_exists($db, 'sit_in_sessions', 'pc_number', "ALTER TABLE sit_in_sessions ADD COLUMN pc_number VARCHAR(50) DEFAULT NULL AFTER purpose");
    ensure_column_exists($db, 'sit_in_records', 'reservation_id', "ALTER TABLE sit_in_records ADD COLUMN reservation_id INT DEFAULT NULL AFTER student_id_number");
    ensure_column_exists($db, 'sit_in_records', 'room', "ALTER TABLE sit_in_records ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
    ensure_column_exists($db, 'sit_in_records', 'purpose', "ALTER TABLE sit_in_records ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
    ensure_column_exists($db, 'sit_in_records', 'pc_number', "ALTER TABLE sit_in_records ADD COLUMN pc_number VARCHAR(50) DEFAULT NULL AFTER purpose");
    ensure_column_exists($db, 'sit_in_records', 'status', "ALTER TABLE sit_in_records ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Completed' AFTER duration_minutes");
    ensure_column_exists($db, 'sit_in_records', 'admin_feedback', "ALTER TABLE sit_in_records ADD COLUMN admin_feedback TEXT DEFAULT NULL AFTER status");
    ensure_column_exists($db, 'sit_in_records', 'student_feedback', "ALTER TABLE sit_in_records ADD COLUMN student_feedback TEXT DEFAULT NULL AFTER admin_feedback");
    ensure_column_exists($db, 'sit_in_records', 'student_rating', "ALTER TABLE sit_in_records ADD COLUMN student_rating INT DEFAULT 5 AFTER student_feedback");

    // Keep announcement schema backward-compatible for older databases.
    ensure_column_exists($db, 'announcements', 'title', "ALTER TABLE announcements ADD COLUMN title VARCHAR(150) NOT NULL AFTER id");
    ensure_column_exists($db, 'announcements', 'message', "ALTER TABLE announcements ADD COLUMN message TEXT NOT NULL AFTER title");
    ensure_column_exists($db, 'announcements', 'tag', "ALTER TABLE announcements ADD COLUMN tag VARCHAR(30) NOT NULL DEFAULT 'General' AFTER message");
    ensure_column_exists($db, 'announcements', 'created_by', "ALTER TABLE announcements ADD COLUMN created_by VARCHAR(50) NOT NULL DEFAULT 'admin' AFTER tag");
    ensure_column_exists($db, 'software_labs', 'status', "ALTER TABLE software_labs ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Active'");

    // Ensure all Laboratory values start with "Lab "
    $db->query("UPDATE labs SET lab_name = CONCAT('Lab ', lab_name) WHERE lab_name NOT LIKE 'Lab %'");
    $db->query("UPDATE sit_in_sessions SET room = CONCAT('Lab ', room) WHERE room NOT LIKE 'Lab %' AND room IS NOT NULL AND room != ''");
    $db->query("UPDATE sit_in_records SET room = CONCAT('Lab ', room) WHERE room NOT LIKE 'Lab %' AND room IS NOT NULL AND room != ''");

    // Populate old NULL pc_number records with sequential/random PC choices to fill data cleanly
    $db->query("UPDATE sit_in_records SET pc_number = CONCAT('PC-', FLOOR(1 + RAND() * 30)) WHERE pc_number IS NULL OR pc_number = ''");
    $db->query("UPDATE sit_in_sessions SET pc_number = CONCAT('PC-', FLOOR(1 + RAND() * 30)) WHERE pc_number IS NULL OR pc_number = ''");

    // Seed default software if table is empty
    $software_count_res = $db->query("SELECT COUNT(*) as count FROM software");
    $software_count_row = $software_count_res ? $software_count_res->fetch_assoc() : null;
    if ($software_count_row && intval($software_count_row['count']) === 0) {
        $seeds = [
            [
                'name' => 'Visual Studio Code',
                'version' => '1.89.1',
                'category' => 'IDE',
                'description' => 'Lightweight and powerful source code editor.',
                'installation_date' => '2026-01-15',
                'license_type' => 'Open Source',
                'status' => 'Active',
                'labs' => ['Lab 524', 'Lab 526', 'Lab 528', 'Lab 530']
            ],
            [
                'name' => 'MySQL Workbench',
                'version' => '8.0.36',
                'category' => 'Database',
                'description' => 'Visual database design, creation and management tool.',
                'installation_date' => '2026-02-10',
                'license_type' => 'Open Source',
                'status' => 'Active',
                'labs' => ['Lab 526', 'Lab 530']
            ],
            [
                'name' => 'IntelliJ IDEA Community',
                'version' => '2024.1',
                'category' => 'IDE',
                'description' => 'Capable and ergonomic Java IDE.',
                'installation_date' => '2026-03-01',
                'license_type' => 'Open Source',
                'status' => 'Active',
                'labs' => ['Lab 524', 'Lab 528']
            ],
            [
                'name' => 'Oracle Database Express',
                'version' => '21c',
                'category' => 'Database',
                'description' => 'Free to use entry-level relational database.',
                'installation_date' => '2025-11-20',
                'license_type' => 'Educational',
                'status' => 'Active',
                'labs' => ['Lab 542', 'Lab 544']
            ],
            [
                'name' => 'Microsoft Office LTSC',
                'version' => '2021',
                'category' => 'Office',
                'description' => 'Standard office tools for word processing and spreadsheets.',
                'installation_date' => '2025-08-05',
                'license_type' => 'Proprietary',
                'status' => 'Inactive',
                'labs' => ['Lab 524', 'Lab 526', 'Lab 528', 'Lab 530', 'Lab 542', 'Lab 544']
            ],
            [
                'name' => 'Cisco Packet Tracer',
                'version' => '8.2.1',
                'category' => 'Tools',
                'description' => 'Powerful network simulation program that allows students to experiment with network behavior.',
                'installation_date' => '2026-04-05',
                'license_type' => 'Educational',
                'status' => 'Active',
                'labs' => ['Lab 524', 'Lab 528', 'Lab 542']
            ],
            [
                'name' => 'jGRASP',
                'version' => '2.0.6_11',
                'category' => 'IDE',
                'description' => 'Lightweight development environment with automatic visualizations for Java, C, C++, Python and Ada.',
                'installation_date' => '2026-04-18',
                'license_type' => 'Open Source',
                'status' => 'Active',
                'labs' => ['Lab 526', 'Lab 530', 'Lab 544']
            ]
        ];

        foreach ($seeds as $s) {
            $name = $s['name'];
            $version = $s['version'];
            $category = $s['category'];
            $desc = $s['description'];
            $inst_date = $s['installation_date'];
            $license = $s['license_type'];
            $status = $s['status'];

            $stmt = $db->prepare("INSERT INTO software (name, version, category, description, installation_date, license_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('sssssss', $name, $version, $category, $desc, $inst_date, $license, $status);
            $stmt->execute();
            $sw_id = $db->insert_id;

            if ($sw_id > 0) {
                foreach ($s['labs'] as $lab_name) {
                    $lab_res = $db->query("SELECT id FROM labs WHERE lab_name = '$lab_name'");
                    if ($lab_res && $lab_res->num_rows > 0) {
                        $lab_row = $lab_res->fetch_assoc();
                        $lab_id = intval($lab_row['id']);
                        $db->query("INSERT IGNORE INTO software_labs (software_id, lab_id) VALUES ($sw_id, $lab_id)");
                    }
                }
            }
        }
    }
}

function ensure_column_exists(mysqli $db, string $table, string $column, string $alterQuery): void {
    $check = $db->query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_NAME = '$table' AND COLUMN_NAME = '$column' AND TABLE_SCHEMA = '" . DB_NAME . "'");
    if ($check && $check->num_rows === 0) {
        if (!$db->query($alterQuery)) {
            debug_log("Failed to add $column column to $table: " . $db->error);
        }
    }
}

function ensure_unique_constraint(mysqli $db, string $table, string $columns): void {
    $constraint_name = 'uniq_' . strtolower(str_replace(', ', '_', $columns));
    $check = $db->query("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_NAME = '$table' AND CONSTRAINT_NAME = '$constraint_name' AND TABLE_SCHEMA = '" . DB_NAME . "'");
    
    if ($check && $check->num_rows === 0) {
        // First, clean up duplicates before adding the constraint
        if ($table === 'pcs' && $columns === 'lab_id, pc_number') {
            // Delete duplicates: keep only first occurrence of each lab_id + pc_number combination
            $db->query("DELETE FROM pcs WHERE id NOT IN (
                SELECT id FROM (
                    SELECT MIN(id) as id FROM pcs GROUP BY lab_id, pc_number
                ) as temp
            )");
        } elseif ($table === 'labs' && $columns === 'lab_name') {
            // Delete duplicate labs: keep only first occurrence of each lab_name
            $db->query("DELETE FROM labs WHERE id NOT IN (
                SELECT id FROM (
                    SELECT MIN(id) as id FROM labs GROUP BY lab_name
                ) as temp
            )");
        }
        
        $alter_query = "ALTER TABLE $table ADD UNIQUE KEY $constraint_name ($columns)";
        if (!$db->query($alter_query)) {
            debug_log("Failed to add unique constraint to $table: " . $db->error);
        }
    }
}
