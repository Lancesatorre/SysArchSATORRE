<?php
/**
 * CCS Sit-In System - Customized Seeding Suite
 * Registers 21 students (ID format 2376xxxx, password '123123')
 * Generates walk-in records with Admin Feedback, Student Ratings, and NO reservation data.
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Disable time limits for deep seeds
set_time_limit(300);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

// Check DB connection
$db = connect_db();
if ($db->connect_error) {
    die("Database Connection Failed: " . $db->connect_error);
}

// Ensure database tables exist and are altered with new columns
initialize_schema($db);

$action = $_GET['action'] ?? ($argv[1] ?? null);
$logs = [];

if ($action) {
    try {
        if ($action === 'fresh') {
            $logs[] = ["type" => "info", "msg" => "Starting Fresh Re-Seed operation..."];
            
            // Disable foreign keys to safely truncate cascades
            $db->query("SET FOREIGN_KEY_CHECKS = 0");
            $logs[] = ["type" => "info", "msg" => "Disabled database foreign key constraints safely."];

            // List of tables to purge
            $tables = ['testimonials', 'sit_in_records', 'sit_in_sessions', 'reservations', 'student_notifications', 'announcements', 'students', 'time_slots', 'pcs', 'labs'];
            foreach ($tables as $table) {
                // Check if table exists before truncating to avoid errors on older databases
                $exists = $db->query("SHOW TABLES LIKE '$table'");
                if ($exists && $exists->num_rows > 0) {
                    if ($db->query("TRUNCATE TABLE $table")) {
                        $logs[] = ["type" => "success", "msg" => "Truncated table: <strong>$table</strong>"];
                    } else {
                        $logs[] = ["type" => "error", "msg" => "Failed to truncate table $table: " . $db->error];
                    }
                }
            }

            // Re-enable constraints
            $db->query("SET FOREIGN_KEY_CHECKS = 1");
            $logs[] = ["type" => "info", "msg" => "Re-enabled database foreign key constraints."];

            // 1. Seed Laboratories
            $logs[] = ["type" => "info", "msg" => "Seeding 6 College of Computer Studies laboratories..."];
            $labs_data = [
                ['Lab 524', 5, 40, '5th Floor - CCS'],
                ['Lab 526', 5, 38, '5th Floor - CCS'],
                ['Lab 528', 5, 40, '5th Floor - CCS'],
                ['Lab 530', 5, 36, '5th Floor - CCS'],
                ['Lab 542', 5, 50, '5th Floor - CCS'],
                ['Lab 544', 5, 50, '5th Floor - CCS']
            ];
            
            $inserted_labs = [];
            $lab_stmt = $db->prepare("INSERT INTO labs (lab_name, floor, capacity, location, status) VALUES (?, ?, ?, ?, 'active')");
            foreach ($labs_data as $lab) {
                $lab_stmt->bind_param("siis", $lab[0], $lab[1], $lab[2], $lab[3]);
                $lab_stmt->execute();
                $inserted_labs[$lab[0]] = $db->insert_id;
            }
            $logs[] = ["type" => "success", "msg" => "Seeded 6 laboratories successfully."];

            // PCs are automatically seeded by initialize_schema() which we run above
            $logs[] = ["type" => "success", "msg" => "Workstations generated automatically by schema initializers."];

            // 2. Seed Reservation Time Slots
            $logs[] = ["type" => "info", "msg" => "Adding standard reservation time slots..."];
            $slots = [
                ['Morning 1', '07:30:00', '09:00:00'],
                ['Morning 2', '09:00:00', '10:30:00'],
                ['Morning 3', '10:30:00', '12:00:00'],
                ['Afternoon 1', '12:30:00', '14:00:00'],
                ['Afternoon 2', '14:00:00', '15:30:00'],
                ['Afternoon 3', '15:30:00', '17:00:00'],
                ['Evening 1', '17:30:00', '19:00:00'],
                ['Evening 2', '19:00:00', '20:30:00']
            ];
            $slot_stmt = $db->prepare("INSERT INTO time_slots (slot_name, start_time, end_time, is_active) VALUES (?, ?, ?, 1)");
            foreach ($slots as $slot) {
                $slot_stmt->bind_param("sss", $slot[0], $slot[1], $slot[2]);
                $slot_stmt->execute();
            }
            $logs[] = ["type" => "success", "msg" => "Seeded 8 standard reservation time slots."];

            // 3. Seed Announcements
            $logs[] = ["type" => "info", "msg" => "Creating 5 default administrative announcements..."];
            $announcements = [
                ['CCS Laboratory Policy Reminder', 'Strictly NO eating or drinking inside the labs. Please keep your workstation tidy.', 'Rules'],
                ['Upcoming Server Maintenance', 'The CCS local compile servers will undergo minor maintenance on Saturday from 8 PM to 12 AM. Local compilers remain active.', 'Maintenance'],
                ['Midterm Programming Assessment Schedule', 'Midterm hands-on coding examinations will take place in Labs 542 and 544. Check your instructors schedules.', 'Exams'],
                ['New Python Compiler Installed', 'Python 3.12.2 interpreter has been deployed across all workstation PCs in Lab 524 and 526.', 'Updates'],
                ['Extended Lab Open Hours', 'Beginning next week, the CCS labs will remain open until 8:30 PM for final project collaborations.', 'General']
            ];
            $ann_stmt = $db->prepare("INSERT INTO announcements (title, message, tag, created_by) VALUES (?, ?, ?, 'A-0000')");
            foreach ($announcements as $ann) {
                $ann_stmt->bind_param("sss", $ann[0], $ann[1], $ann[2]);
                $ann_stmt->execute();
            }
            $logs[] = ["type" => "success", "msg" => "Created 5 announcements successfully."];

            // 4. Seed 21 Students (ID format 2376xxxx, password '123123')
            $logs[] = ["type" => "info", "msg" => "Registering 21 custom students with IDs <strong>23760001 - 23760021</strong> and password <strong>123123</strong>..."];
            
            // Hashing password '123123'
            $hashed_password = password_hash('123123', PASSWORD_BCRYPT);
            
            $student_profiles = [
                ['Liam', 'Smith', 'BSIT', 1, 'Cebu City', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Olivia', 'Johnson', 'BSCS', 2, 'Mandaue City', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Noah', 'Williams', 'BSCPE', 3, 'Lapu-Lapu City', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Emma', 'Brown', 'BSIS', 4, 'Talamban, Cebu', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Oliver', 'Jones', 'BSEM', 1, 'Consolacion, Cebu', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Ava', 'Garcia', 'BSIT', 2, 'Liloan, Cebu', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Elijah', 'Miller', 'BSCS', 3, 'Compostela, Cebu', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Charlotte', 'Davis', 'BSCPE', 4, 'Cebu City', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80'],
                ['William', 'Rodriguez', 'BSIS', 1, 'Mandaue City', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Sophia', 'Martinez', 'BSEM', 2, 'Lapu-Lapu City', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&h=256&q=80'],
                ['James', 'Hernandez', 'BSIT', 3, 'Talamban, Cebu', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Amelia', 'Lopez', 'BSCS', 4, 'Consolacion, Cebu', 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Benjamin', 'Gonzalez', 'BSCPE', 1, 'Liloan, Cebu', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Isabella', 'Wilson', 'BSIS', 2, 'Cebu City', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Lucas', 'Anderson', 'BSEM', 3, 'Mandaue City', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Mia', 'Thomas', 'BSIT', 4, 'Lapu-Lapu City', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Henry', 'Taylor', 'BSCS', 1, 'Talamban, Cebu', 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Evelyn', 'Moore', 'BSCPE', 2, 'Consolacion, Cebu', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Alexander', 'Jackson', 'BSIS', 3, 'Liloan, Cebu', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Harper', 'Martin', 'BSEM', 4, 'Cebu City', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80'],
                ['Mason', 'Lee', 'BSIT', 2, 'Mandaue City', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=256&h=256&q=80']
            ];

            $student_stmt = $db->prepare("INSERT INTO students (id_number, first_name, last_name, email, course, year_level, address, available_sessions, profile_picture, password) VALUES (?, ?, ?, ?, ?, ?, ?, 30, ?, ?)");
            
            $students_seeded = [];
            for ($i = 0; $i < 21; $i++) {
                $id_num = "2376" . str_pad($i + 1, 4, '0', STR_PAD_LEFT);
                $first = $student_profiles[$i][0];
                $last = $student_profiles[$i][1];
                $course = $student_profiles[$i][2];
                $year = $student_profiles[$i][3];
                $addr = $student_profiles[$i][4];
                $pic = $student_profiles[$i][5];
                $email = strtolower($first . "." . $last . "@uic.edu.ph");
                
                $student_stmt->bind_param("sssssisss", $id_num, $first, $last, $email, $course, $year, $addr, $pic, $hashed_password);
                $student_stmt->execute();
                
                $students_seeded[] = [
                    'id' => $db->insert_id,
                    'id_number' => $id_num,
                    'first_name' => $first,
                    'last_name' => $last,
                    'course' => $course
                ];
            }
            $logs[] = ["type" => "success", "msg" => "Seeded 21 student accounts with ID range 23760001 - 23760021."];

            // 5. Seed Walk-In Sit-In Records (NO Reservations, with Admin Feedback & Student Ratings)
            $logs[] = ["type" => "info", "msg" => "Generating 63 completed walk-in records with Admin Feedback and Student Ratings (no reservations)..."];
            
            $admin_feedback_options = [
                "Student followed all laboratory policies. Workstation returned in pristine condition.",
                "Completed coding exercises successfully. Clean desk, logged off on time.",
                "Outstanding conduct. Kept workspace neat, pushed git changes and shutdown cleanly.",
                "Checked out on time. Disciplined behavior during programming research.",
                "Workstation checked and found clean. Silent and collaborative.",
                "Cooperative and highly focused on coursework. Left unit tidy.",
                "Excellent laboratory decorum. Workstation was shutdown correctly.",
                "Followed instructions perfectly. Desk was organized and clean.",
                "Very disciplined study session. PC and keyboard returned in order."
            ];

            $student_feedback_options = [
                "Excellent computers, compile times are super fast!",
                "The laboratory was cool and quiet. Perfect study spot.",
                "Very easy check-in process. PC worked flawlessly.",
                "AC was very comfortable today. Great experience.",
                "Fast internet connection, really helped with package downloads.",
                "Super peaceful space. Got my homework done in an hour."
            ];

            $purposes = ['C Programming', 'Java Programming', 'Database Systems', 'Python Development', 'Web Development', 'System Architecture', 'Operating Systems'];
            $lab_names = array_keys($inserted_labs);

            $record_stmt = $db->prepare("INSERT INTO sit_in_records (session_id, student_id, student_id_number, reservation_id, room, purpose, pc_number, started_at, ended_at, duration_minutes, status, admin_feedback, student_feedback, student_rating, ended_by) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?, ?, 'admin')");

            $session_counter = 1000; // Mock session IDs
            foreach ($students_seeded as $student) {
                // Generate 3 history records for each student
                for ($h = 1; $h <= 3; $h++) {
                    $days_ago = rand(1, 14);
                    $start_hour = rand(8, 17);
                    $start_minute = rand(0, 59);
                    
                    $start_date_str = date('Y-m-d H:i:s', strtotime("-$days_ago days $start_hour hours $start_minute minutes"));
                    $duration = rand(45, 120); // 45 to 120 minutes
                    $end_date_str = date('Y-m-d H:i:s', strtotime($start_date_str . " +$duration minutes"));

                    $lab_chosen = $lab_names[array_rand($lab_names)];
                    $purpose_chosen = $purposes[array_rand($purposes)];
                    $pc_num = "PC-" . str_pad(rand(1, 40), 2, '0', STR_PAD_LEFT);
                    
                    $admin_fb = $admin_feedback_options[array_rand($admin_feedback_options)];
                    $student_fb = (rand(1, 10) > 3) ? $student_feedback_options[array_rand($student_feedback_options)] : null;
                    $student_rating = rand(4, 5); // 4 or 5 star ratings

                    $session_id = $session_counter++;

                    $record_stmt->bind_param("iissssssissi", 
                        $session_id, 
                        $student['id'], 
                        $student['id_number'], 
                        $lab_chosen, 
                        $purpose_chosen, 
                        $pc_num,
                        $start_date_str, 
                        $end_date_str, 
                        $duration, 
                        $admin_fb, 
                        $student_fb,
                        $student_rating
                    );
                    $record_stmt->execute();
                }
            }
            $logs[] = ["type" => "success", "msg" => "Generated 63 completed walk-in logs containing custom administrative check-out feedback and student ratings."];

            // 6. Seed 5 Active Walk-in Sessions (No Reservations)
            $logs[] = ["type" => "info", "msg" => "Starting 5 live active walk-in sessions in the laboratories..."];
            $active_stmt = $db->prepare("INSERT INTO sit_in_sessions (student_id, student_id_number, reservation_id, room, purpose, pc_number, status) VALUES (?, ?, NULL, ?, ?, ?, 'active')");
            
            // Pick 5 random students to be currently in active sessions
            $active_student_keys = array_rand($students_seeded, 5);
            $active_labs = ['Lab 524', 'Lab 526', 'Lab 528', 'Lab 530', 'Lab 542'];
            
            foreach ($active_student_keys as $index => $key) {
                $student = $students_seeded[$key];
                $lab = $active_labs[$index];
                $purpose = $purposes[array_rand($purposes)];
                $pc_num = "PC-" . str_pad(rand(1, 35), 2, '0', STR_PAD_LEFT);
                
                $active_stmt->bind_param("issss", 
                    $student['id'], 
                    $student['id_number'], 
                    $lab, 
                    $purpose, 
                    $pc_num
                );
                $active_stmt->execute();
                $logs[] = ["type" => "info", "msg" => "Checked in walk-in: <strong>{$student['first_name']} {$student['last_name']} ({$student['id_number']})</strong> in <strong>$lab</strong> at <strong>$pc_num</strong>"];
            }
            $logs[] = ["type" => "success", "msg" => "5 active live walk-in sessions initialized successfully."];
            
            // 7. Deduct available sessions based on completed logs
            $logs[] = ["type" => "info", "msg" => "Deducting completed sessions from students' available sessions..."];
            $db->query("UPDATE students s SET s.available_sessions = 30 - (SELECT COUNT(*) FROM sit_in_records r WHERE r.student_id = s.id)");
            $logs[] = ["type" => "success", "msg" => "Deducted completed sessions successfully. Active available session pools updated."];

            // 6.5 Seed Reservations
            $logs[] = ["type" => "info", "msg" => "Seeding initial reservations..."];
            $res_stmt = $db->prepare("INSERT INTO reservations (student_id_number, lab_id, pc_number, reservation_date, time_slot_id, purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            $res_data = [
                ['23760001', 1, 'PC-10', date('Y-m-d', strtotime('+1 day')), 1, 'Java Programming', 'approved'],
                ['23760002', 1, 'PC-10', date('Y-m-d', strtotime('+1 day')), 2, 'Python Project', 'approved'],
                ['23760003', 2, 'PC-15', date('Y-m-d', strtotime('+2 days')), 3, 'Database Design', 'pending'],
                ['23760004', 3, 'PC-05', date('Y-m-d', strtotime('+1 day')), 4, 'System Architecture', 'approved'],
                ['23760005', 4, 'PC-20', date('Y-m-d', strtotime('+3 days')), 5, 'Network Setup', 'pending'],
                ['23760006', 1, 'PC-10', date('Y-m-d', strtotime('+2 days')), 1, 'C++ Activity', 'approved']
            ];
            
            foreach ($res_data as $r) {
                $res_stmt->bind_param("sississ", $r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6]);
                $res_stmt->execute();
            }
            $logs[] = ["type" => "success", "msg" => "Seeded 6 sample reservations to test active visual indicators."];
            // 8. Seed Testimonials (General system reviews)
            $logs[] = ["type" => "info", "msg" => "Seeding default system testimonials..."];
            $testimonials_data = [
                ['23760001', 5, 'The CCS Sit-In monitoring system is exceptionally user-friendly! I love how clean the dark-mode layout is and the instant laboratory reservation process.', 'approved'],
                ['23760002', 5, 'Extremely seamless experience. Logging in, choosing a laboratory computer, and getting immediate feedback on remaining sessions has helped me manage my study hours perfectly.', 'approved'],
                ['23760003', 4, 'Very helpful system. Compilers and lab resources are top-tier. Pushing my repository and receiving quick administrative checkout feedback makes compiling labs enjoyable.', 'approved'],
                ['23760004', 5, 'A state-of-the-art laboratory portal. The glassmorphic design and real-time announcements look beautiful. Kudos to the development team!', 'approved'],
                ['23760005', 5, 'Highly convenient check-in process. The labs are quiet, cool, and perfect for working on system architecture projects.', 'pending'],
            ];

            $testimonial_stmt = $db->prepare("INSERT INTO testimonials (student_id_number, rating, feedback, status) VALUES (?, ?, ?, ?)");
            foreach ($testimonials_data as $test) {
                $testimonial_stmt->bind_param("siss", $test[0], $test[1], $test[2], $test[3]);
                $testimonial_stmt->execute();
            }
            $logs[] = ["type" => "success", "msg" => "Seeded 5 default student testimonials (4 approved, 1 pending)."];

            $logs[] = ["type" => "success", "msg" => "<strong>Database Seed Completed Successfully!</strong>"];
        }
        
        else if ($action === 'clear') {
            $logs[] = ["type" => "info", "msg" => "Starting purge of dynamic transaction logs..."];
            $db->query("SET FOREIGN_KEY_CHECKS = 0");
            
            $db->query("TRUNCATE TABLE sit_in_records");
            $logs[] = ["type" => "success", "msg" => "Cleared sit-in history logs."];
            
            $db->query("TRUNCATE TABLE sit_in_sessions");
            $logs[] = ["type" => "success", "msg" => "Cleared active live sessions."];
            
            $db->query("TRUNCATE TABLE reservations");
            $logs[] = ["type" => "success", "msg" => "Cleared all student reservations."];
            
            $db->query("TRUNCATE TABLE student_notifications");
            $logs[] = ["type" => "success", "msg" => "Cleared personalized alerts."];
            
            $db->query("SET FOREIGN_KEY_CHECKS = 1");
            $logs[] = ["type" => "success", "msg" => "Dynamic transactions successfully wiped! All student profiles, labs, and configurations remain untouched."];
        }
    } catch (Exception $e) {
        $logs[] = ["type" => "error", "msg" => "EXCEPTION ENCOUNTERED: " . $e->getMessage()];
    }
}

// Fetch current database counts for UI metrics
$counts = [
    'students' => $db->query("SELECT COUNT(*) FROM students")->fetch_row()[0] ?? 0,
    'active' => $db->query("SELECT COUNT(*) FROM sit_in_sessions WHERE status = 'active'")->fetch_row()[0] ?? 0,
    'history' => $db->query("SELECT COUNT(*) FROM sit_in_records")->fetch_row()[0] ?? 0,
    'reservations' => $db->query("SELECT COUNT(*) FROM reservations")->fetch_row()[0] ?? 0,
    'labs' => $db->query("SELECT COUNT(*) FROM labs")->fetch_row()[0] ?? 0,
    'pcs' => $db->query("SELECT COUNT(*) FROM pcs")->fetch_row()[0] ?? 0,
    'slots' => $db->query("SELECT COUNT(*) FROM time_slots")->fetch_row()[0] ?? 0
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Seeder Console - CCS Sit-in Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0b0f19;
            --bg-secondary: #131b2e;
            --bg-tertiary: #1e293b;
            --border-color: rgba(255, 255, 255, 0.08);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --accent-blue: #3b82f6;
            --accent-blue-glow: rgba(59, 130, 246, 0.15);
            --accent-green: #10b981;
            --accent-green-glow: rgba(16, 185, 129, 0.15);
            --accent-red: #ef4444;
            --accent-red-glow: rgba(239, 68, 68, 0.15);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        header {
            background-color: rgba(19, 27, 46, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border-color);
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 1rem 0;
        }

        .header-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo-box {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-icon {
            width: 2.25rem;
            height: 2.25rem;
            background: linear-gradient(135deg, var(--accent-blue), #6366f1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1.15rem;
            color: #ffffff;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
        }

        .logo-text h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: -0.02em;
        }

        .logo-text p {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        .badge {
            background-color: var(--accent-blue-glow);
            border: 1px solid rgba(59, 130, 246, 0.3);
            color: #60a5fa;
            font-size: 0.7rem;
            font-weight: 700;
            padding: 0.25rem 0.6rem;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        main {
            flex: 1;
            max-width: 1200px;
            width: 100%;
            margin: 0 auto;
            padding: 2.5rem 1.5rem;
        }

        .hero-section {
            margin-bottom: 2.5rem;
            background: linear-gradient(180deg, var(--bg-secondary) 0%, rgba(19, 27, 46, 0.4) 100%);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 2rem;
            position: relative;
            overflow: hidden;
        }

        .hero-section::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -20%;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 60%);
            pointer-events: none;
        }

        .hero-section h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.8rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            letter-spacing: -0.02em;
        }

        .hero-section p {
            color: var(--text-secondary);
            font-size: 0.95rem;
            max-width: 800px;
            line-height: 1.6;
        }

        .grid-layout {
            display: grid;
            grid-template-cols: 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        @media (min-width: 900px) {
            .grid-layout {
                grid-template-cols: 1.1fr 0.9fr;
            }
        }

        .card {
            background-color: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.75rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
        }

        .card h3 {
            font-family: 'Outfit', sans-serif;
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .card-blue h3 { color: #60a5fa; }
        .card-green h3 { color: #34d399; }

        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: auto;
        }

        .btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.25rem;
            border-radius: 12px;
            text-decoration: none;
            color: var(--text-primary);
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.2s ease;
            border: 1px solid transparent;
            cursor: pointer;
        }

        .btn-fresh {
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
            box-shadow: 0 4px 15px rgba(79, 70, 229, 0.35);
        }

        .btn-fresh:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.45);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .btn-clear {
            background-color: rgba(239, 68, 68, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #fca5a5;
        }

        .btn-clear:hover {
            background-color: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
        }

        .btn-description {
            display: block;
            font-size: 0.78rem;
            font-weight: 400;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 0.25rem;
            line-height: 1.4;
        }

        .btn-clear .btn-description {
            color: #f87171;
            opacity: 0.85;
        }

        .btn-action-icon {
            font-size: 1.5rem;
            opacity: 0.9;
        }

        .stats-grid {
            display: grid;
            grid-template-cols: repeat(2, 1fr);
            gap: 1rem;
        }

        .stat-card {
            background-color: rgba(15, 23, 42, 0.4);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1rem;
            text-align: left;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .stat-label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.25rem;
        }

        .stat-value {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 800;
            color: var(--text-primary);
        }

        .stat-unit {
            font-size: 0.75rem;
            color: var(--text-secondary);
            font-weight: 400;
            margin-left: 0.1rem;
        }

        .console-log-section {
            background-color: #060913;
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 1.5rem;
            font-family: 'Consolas', 'Courier New', Courier, monospace;
            font-size: 0.82rem;
            box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.8);
            margin-top: 2rem;
        }

        .console-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.75rem;
            margin-bottom: 1rem;
        }

        .console-title {
            color: var(--text-secondary);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .console-dot {
            width: 8px;
            height: 8px;
            background-color: var(--accent-red);
            border-radius: 50%;
            animation: pulse 1.5s infinite;
        }

        .console-scroll-box {
            max-height: 250px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding-right: 0.5rem;
        }

        .log-line {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
            line-height: 1.5;
        }

        .log-bullet {
            font-weight: bold;
        }

        .log-bullet.info { color: var(--accent-blue); }
        .log-bullet.success { color: var(--accent-green); }
        .log-bullet.error { color: var(--accent-red); }

        .log-text.info { color: #e2e8f0; }
        .log-text.success { color: #a7f3d0; }
        .log-text.error { color: #fca5a5; font-weight: 500; }

        .empty-logs-placeholder {
            color: var(--text-secondary);
            text-align: center;
            padding: 2rem 0;
            font-style: italic;
        }

        .banner {
            border-radius: 12px;
            padding: 1rem 1.25rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.9rem;
            font-weight: 500;
        }

        .banner.success-banner {
            background-color: var(--accent-green-glow);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #a7f3d0;
        }

        .banner.error-banner {
            background-color: var(--accent-red-glow);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
        }

        footer {
            border-top: 1px solid var(--border-color);
            background-color: rgba(19, 27, 46, 0.4);
            padding: 1.5rem;
            text-align: center;
            color: var(--text-secondary);
            font-size: 0.8rem;
        }

        footer a {
            color: var(--accent-blue);
            text-decoration: none;
        }

        footer a:hover {
            text-decoration: underline;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: var(--bg-primary);
        }
        ::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
    </style>
</head>
<body>

    <header>
        <div class="header-container">
            <div class="logo-box">
                <div class="logo-icon">C</div>
                <div class="logo-text">
                    <h1>CCS Sit-In System</h1>
                    <p>Database Seeding Engine</p>
                </div>
            </div>
            <span class="badge">Development Utility</span>
        </div>
    </header>

    <main>
        <div class="hero-section">
            <h2>Command Center Database Seeder</h2>
            <p>
                Use this advanced utility to seed standard configuration structures and realistic mock transactions. This populates charts, active student rosters, past registers, and reservation queues instantly, ensuring a rich visual experience during system evaluations.
            </p>
        </div>

        <?php if ($action && empty($logs)): ?>
            <div class="banner success-banner">
                <span>✓ Seeder action completed successfully. Check details in the console below.</span>
            </div>
        <?php endif; ?>

        <div class="grid-layout">
            <!-- Left Side: Interactive Seed Controls -->
            <div class="card card-blue">
                <h3>⚡ Interactive Seeder Actions</h3>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.5;">
                    Choose an action below to populate or reset your local SQL instance. This seeder creates 21 students with IDs starting with 2376xxxx and password '123123'. All data represents walk-in logs containing Admin Feedback and NO reservations.
                </p>

                <div class="btn-group">
                    <a href="?action=fresh" class="btn btn-fresh" onclick="return confirm('WARNING: This will delete ALL existing students, active sessions, histories, announcements, laboratories, PCs, and software configs, and perform a total pristine rebuild. Are you sure?');">
                        <div>
                            <strong>Fresh Re-Seed (Full Reset)</strong>
                            <span class="btn-description">Truncates all tables, recreates standard database schemas, registers 21 students (IDs: 2376xxxx), seeds 63 completed walk-in logs with Admin Feedback, 5 active walk-ins, and 0 reservations.</span>
                        </div>
                        <div class="btn-action-icon">🔄</div>
                    </a>

                    <a href="?action=clear" class="btn btn-clear" onclick="return confirm('WARNING: This deletes only dynamic transaction data (sit-in history, active sessions, reservations, and alerts), while keeping student accounts and lab/software setup intact. Proceed?');">
                        <div>
                            <strong>Clear Dynamic Transactions</strong>
                            <span class="btn-description">Safely purges only dynamic session records and reservations. Ideal for resetting student metrics and queue lists.</span>
                        </div>
                        <div class="btn-action-icon">🗑️</div>
                    </a>
                </div>
            </div>

            <!-- Right Side: Database State and Stats -->
            <div class="card card-green">
                <h3>📊 Database Catalog Statistics</h3>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1.5rem; line-height: 1.5;">
                    Live snapshot of the <strong><?php echo DB_NAME; ?></strong> database instance. Re-execute seeder actions above to watch these counts change.
                </p>

                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">Students</span>
                        <div class="stat-value"><?php echo $counts['students']; ?> <span class="stat-unit">profiles</span></div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Active Sit-Ins</span>
                        <div class="stat-value" style="color: var(--accent-green);"><?php echo $counts['active']; ?> <span class="stat-unit">live</span></div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Completed Sessions</span>
                        <div class="stat-value"><?php echo $counts['history']; ?> <span class="stat-unit">walk-in</span></div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Reservations</span>
                        <div class="stat-value" style="color: <?php echo $counts['reservations'] > 0 ? 'var(--accent-blue)' : 'var(--text-secondary)'; ?>"><?php echo $counts['reservations']; ?> <span class="stat-unit">records</span></div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Labs Configured</span>
                        <div class="stat-value"><?php echo $counts['labs']; ?> <span class="stat-unit">rooms</span></div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Workstation PCs</span>
                        <div class="stat-value"><?php echo $counts['pcs']; ?> <span class="stat-unit">units</span></div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Time Slots</span>
                        <div class="stat-value"><?php echo $counts['slots']; ?> <span class="stat-unit">slots</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full Width Console Log Output -->
        <div class="console-log-section">
            <div class="console-header">
                <div class="console-title">
                    <span class="console-dot"></span>
                    <span>Seeder Transaction Log Stream</span>
                </div>
                <span style="color: var(--text-secondary); font-size: 0.75rem;">ANSI-Console Active</span>
            </div>
            <div class="console-scroll-box">
                <?php if (empty($logs)): ?>
                    <div class="empty-logs-placeholder">
                        Console idle. Choose a seeder action above to execute transaction scripts.
                    </div>
                <?php else: ?>
                    <?php foreach ($logs as $log): ?>
                        <div class="log-line">
                            <span class="log-bullet <?php echo $log['type']; ?>">
                                <?php 
                                    if ($log['type'] === 'success') echo '[ SUCCESS ]';
                                    else if ($log['type'] === 'error') echo '[ ERROR ]';
                                    else echo '[ INFO ]';
                                ?>
                            </span>
                            <span class="log-text <?php echo $log['type']; ?>"><?php echo $log['msg']; ?></span>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </main>

    <footer>
        <div class="footer-container">
            <p>CCS Sit-in Portal &copy; 2026. Made with ❤️ for SysArchSATORRE application suite. Go back to <a href="../">App Landing Page</a>.</p>
        </div>
    </footer>

</body>
</html>
