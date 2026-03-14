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
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_id_number (id_number),
    INDEX idx_email (email)
);

-- Add a default test user (optional)
-- Password: password123
INSERT INTO students (id_number, first_name, last_name, email, course, year_level, password) 
VALUES ('20230001', 'Test', 'User', 'test@example.com', 'BSIT', 1, '$2y$10$YNMdYr.0wpvWk5a8a7MK4.lCJRvHLnFhHEcOQFvNwcT0C1yLsWuvi')
ON DUPLICATE KEY UPDATE email=email;
