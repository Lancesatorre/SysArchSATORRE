<?php

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

    return $db;
}

function initialize_schema(mysqli $db): void {
    $create_students_table = "
    CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_number VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        course VARCHAR(50),
        year_level INT,
        address VARCHAR(255),
        available_sessions INT NOT NULL DEFAULT 30,
        profile_picture LONGTEXT,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";

    if (!$db->query($create_students_table)) {
        debug_log('Failed to create students table: ' . $db->error);
    }

    $create_sessions_table = "
    CREATE TABLE IF NOT EXISTS sit_in_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        student_id_number VARCHAR(50) NOT NULL,
        room VARCHAR(50) DEFAULT NULL,
        purpose VARCHAR(255) DEFAULT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL DEFAULT NULL,
        status ENUM('active', 'ended') NOT NULL DEFAULT 'active',
        ended_by VARCHAR(50) DEFAULT NULL,
        INDEX idx_student_id (student_id),
        INDEX idx_student_id_number (student_id_number),
        INDEX idx_status (status),
        CONSTRAINT fk_sit_in_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )";

    if (!$db->query($create_sessions_table)) {
        debug_log('Failed to create sit_in_sessions table: ' . $db->error);
    }

    $create_records_table = "
    CREATE TABLE IF NOT EXISTS sit_in_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        student_id INT NOT NULL,
        student_id_number VARCHAR(50) NOT NULL,
        room VARCHAR(50) DEFAULT NULL,
        purpose VARCHAR(255) DEFAULT NULL,
        started_at DATETIME NOT NULL,
        ended_at DATETIME NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'Completed',
        admin_feedback TEXT DEFAULT NULL,
        student_feedback TEXT DEFAULT NULL,
        ended_by VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_record_student_id (student_id),
        INDEX idx_record_student_id_number (student_id_number),
        INDEX idx_record_created (created_at)
    )";

    if (!$db->query($create_records_table)) {
        debug_log('Failed to create sit_in_records table: ' . $db->error);
    }

    $create_announcements_table = "
    CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        tag VARCHAR(30) NOT NULL DEFAULT 'General',
        created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_announcement_created (created_at)
    )";

    if (!$db->query($create_announcements_table)) {
        debug_log('Failed to create announcements table: ' . $db->error);
    }

    $create_notification_reads_table = "
    CREATE TABLE IF NOT EXISTS notification_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id_number VARCHAR(50) NOT NULL,
        announcement_id INT NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_student_announcement (student_id_number, announcement_id),
        INDEX idx_notification_reads_student (student_id_number),
        INDEX idx_notification_reads_announcement (announcement_id),
        CONSTRAINT fk_notification_reads_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
    )";

    if (!$db->query($create_notification_reads_table)) {
        debug_log('Failed to create notification_reads table: ' . $db->error);
    }

    ensure_column_exists($db, 'students', 'profile_picture', "ALTER TABLE students ADD COLUMN profile_picture LONGTEXT AFTER address");
    ensure_column_exists($db, 'students', 'available_sessions', "ALTER TABLE students ADD COLUMN available_sessions INT NOT NULL DEFAULT 30 AFTER address");
    ensure_column_exists($db, 'sit_in_sessions', 'room', "ALTER TABLE sit_in_sessions ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
    ensure_column_exists($db, 'sit_in_sessions', 'purpose', "ALTER TABLE sit_in_sessions ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
    ensure_column_exists($db, 'sit_in_records', 'room', "ALTER TABLE sit_in_records ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
    ensure_column_exists($db, 'sit_in_records', 'purpose', "ALTER TABLE sit_in_records ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
    ensure_column_exists($db, 'sit_in_records', 'status', "ALTER TABLE sit_in_records ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Completed' AFTER duration_minutes");
    ensure_column_exists($db, 'sit_in_records', 'admin_feedback', "ALTER TABLE sit_in_records ADD COLUMN admin_feedback TEXT DEFAULT NULL AFTER status");
    ensure_column_exists($db, 'sit_in_records', 'student_feedback', "ALTER TABLE sit_in_records ADD COLUMN student_feedback TEXT DEFAULT NULL AFTER admin_feedback");

    // Keep announcement schema backward-compatible for older databases.
    ensure_column_exists($db, 'announcements', 'title', "ALTER TABLE announcements ADD COLUMN title VARCHAR(150) NOT NULL AFTER id");
    ensure_column_exists($db, 'announcements', 'message', "ALTER TABLE announcements ADD COLUMN message TEXT NOT NULL AFTER title");
    ensure_column_exists($db, 'announcements', 'tag', "ALTER TABLE announcements ADD COLUMN tag VARCHAR(30) NOT NULL DEFAULT 'General' AFTER message");
    ensure_column_exists($db, 'announcements', 'created_by', "ALTER TABLE announcements ADD COLUMN created_by VARCHAR(50) NOT NULL DEFAULT 'admin' AFTER tag");
}

function ensure_column_exists(mysqli $db, string $table, string $column, string $alterQuery): void {
    $check = $db->query("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_NAME = '$table' AND COLUMN_NAME = '$column' AND TABLE_SCHEMA = '" . DB_NAME . "'");
    if ($check && $check->num_rows === 0) {
        if (!$db->query($alterQuery)) {
            debug_log("Failed to add $column column to $table: " . $db->error);
        }
    }
}
