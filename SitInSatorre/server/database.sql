-- Create Database
CREATE DATABASE IF NOT EXISTS sitinsatorre;
USE sitinsatorre;

-- Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    course VARCHAR(50) NOT NULL DEFAULT 'BSIT',
    year_level INT DEFAULT 1,
    address VARCHAR(255),
    available_sessions INT NOT NULL DEFAULT 30,
    profile_picture LONGTEXT,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_id_number (id_number),
    INDEX idx_email (email)
);

-- Active sit-in sessions 
CREATE TABLE IF NOT EXISTS sit_in_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    reservation_id INT DEFAULT NULL,
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
);

-- Permanent sit-in records
CREATE TABLE IF NOT EXISTS sit_in_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    student_id_number VARCHAR(50) NOT NULL,
    reservation_id INT DEFAULT NULL,
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
);

-- Announcements for student notifications
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    tag VARCHAR(30) NOT NULL DEFAULT 'General',
    created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_announcement_created (created_at)
);

-- Labs table for lab information
CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_name VARCHAR(100) NOT NULL,
    floor INT DEFAULT NULL,
    capacity INT DEFAULT 40,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lab_name (lab_name)
);

-- Reservations table for PC reservations
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pc_id INT,
    lab_id INT NOT NULL,
    pc_number VARCHAR(50),
    reservation_date DATE NOT NULL,
    time_from TIME NOT NULL,
    time_to TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    purpose VARCHAR(255) DEFAULT 'C Programming',
    decline_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_lab_id (lab_id),
    INDEX idx_status (status),
    INDEX idx_reservation_date (reservation_date),
    CONSTRAINT fk_reservations_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_lab FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);

-- student_notifications table for personalized alerts
CREATE TABLE IF NOT EXISTS student_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reservation_approved', 'reservation_declined'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_student (student_id),
    INDEX idx_notif_read (is_read),
    CONSTRAINT fk_notif_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);



-- Create PCs table
CREATE TABLE IF NOT EXISTS pcs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    pc_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lab_id (lab_id),
    INDEX idx_pc_number (pc_number),
    INDEX idx_status (status),
    CONSTRAINT fk_pcs_lab FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);

-- Create Software table
CREATE TABLE IF NOT EXISTS software (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    installation_date DATE,
    license_type VARCHAR(50) NOT NULL DEFAULT 'Open Source',
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Software Labs table
CREATE TABLE IF NOT EXISTS software_labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    software_id INT NOT NULL,
    lab_id INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    UNIQUE KEY uniq_software_lab (software_id, lab_id),
    CONSTRAINT fk_software_labs_software FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE,
    CONSTRAINT fk_software_labs_lab FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);

-- Create Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id_number VARCHAR(50) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback TEXT NOT NULL,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_testimonial_student (student_id_number),
    INDEX idx_testimonial_status (status),
    CONSTRAINT fk_testimonials_student FOREIGN KEY (student_id_number) REFERENCES students(id_number) ON DELETE CASCADE
);

-- Create Notification Reads table
CREATE TABLE IF NOT EXISTS notification_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id_number VARCHAR(50) NOT NULL,
    announcement_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_student_announcement (student_id_number, announcement_id),
    INDEX idx_notification_reads_student (student_id_number),
    INDEX idx_notification_reads_announcement (announcement_id),
    CONSTRAINT fk_notification_reads_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE
);

-- Create Time Slots table
CREATE TABLE IF NOT EXISTS time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
