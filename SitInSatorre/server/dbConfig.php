<?php
// Database configuration and initialization

// Database connection
$db = new mysqli('localhost', 'root', '');

if ($db->connect_error) {
    debug_log("Database connection failed: " . $db->connect_error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $db->connect_error]);
    exit();
}

debug_log("Database connected successfully");

// Create database if not exists
if (!$db->query("CREATE DATABASE IF NOT EXISTS sitinsatorre")) {
    debug_log("Failed to create database: " . $db->error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create database']);
    exit();
}

$db->select_db('sitinsatorre');
$db->set_charset('utf8mb4');

// Create table if not exists
$create_table_query = "
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

if (!$db->query($create_table_query)) {
    debug_log("Failed to create table: " . $db->error);
} else {
    debug_log("Table created or already exists");
}

// Ensure profile_picture column exists for existing tables
$check_profile_pic = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'profile_picture' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_profile_pic && $check_profile_pic->num_rows === 0) {
    $alter_query = "ALTER TABLE students ADD COLUMN profile_picture LONGTEXT AFTER address";
    if (!$db->query($alter_query)) {
        debug_log("Failed to add profile_picture column: " . $db->error);
    } else {
        debug_log("profile_picture column added successfully");
    }
}

// Ensure available_sessions column exists for existing tables
$check_sessions_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'available_sessions' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_sessions_col && $check_sessions_col->num_rows === 0) {
    $alter_sessions_col = "ALTER TABLE students ADD COLUMN available_sessions INT NOT NULL DEFAULT 30 AFTER address";
    if (!$db->query($alter_sessions_col)) {
        debug_log("Failed to add available_sessions column: " . $db->error);
    } else {
        debug_log("available_sessions column added successfully");
    }
}

// Create active sit-in sessions table
$create_sessions_table_query = "
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

if (!$db->query($create_sessions_table_query)) {
    debug_log("Failed to create sit_in_sessions table: " . $db->error);
}

// Create permanent sit-in records table
$create_records_table_query = "
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
    ended_by VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_record_student_id (student_id),
    INDEX idx_record_student_id_number (student_id_number),
    INDEX idx_record_created (created_at)
)";

if (!$db->query($create_records_table_query)) {
    debug_log("Failed to create sit_in_records table: " . $db->error);
}

// Ensure room and purpose columns exist in sit_in_sessions
$check_session_room_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_sessions' AND COLUMN_NAME = 'room' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_session_room_col && $check_session_room_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_sessions ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
}
$check_session_purpose_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_sessions' AND COLUMN_NAME = 'purpose' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_session_purpose_col && $check_session_purpose_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_sessions ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
}

// Ensure room and purpose columns exist in sit_in_records
$check_record_room_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_records' AND COLUMN_NAME = 'room' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_record_room_col && $check_record_room_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_records ADD COLUMN room VARCHAR(50) DEFAULT NULL AFTER student_id_number");
}
$check_record_purpose_col = $db->query("SELECT * FROM information_schema.COLUMNS WHERE TABLE_NAME = 'sit_in_records' AND COLUMN_NAME = 'purpose' AND TABLE_SCHEMA = 'sitinsatorre'");
if ($check_record_purpose_col && $check_record_purpose_col->num_rows === 0) {
    $db->query("ALTER TABLE sit_in_records ADD COLUMN purpose VARCHAR(255) DEFAULT NULL AFTER room");
}
?>
