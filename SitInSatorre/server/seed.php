<?php
/**
 * CCS Sit-In System - Customized Seeding Suite
 * Loads the scanned database snapshot and restores it perfectly on demand.
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

// Load the snapshot seed data
if (file_exists(__DIR__ . '/db_seed_data.php')) {
    require_once __DIR__ . '/db_seed_data.php';
} else {
    $seeded_labs = [];
    $seeded_pcs = [];
    $seeded_time_slots = [];
    $seeded_students = [];
    $seeded_reservations = [];
    $seeded_sit_in_sessions = [];
    $seeded_sit_in_records = [];
    $seeded_testimonials = [];
    $seeded_announcements = [];
    $seeded_software = [];
    $seeded_software_labs = [];
    $seeded_student_notifications = [];
    $seeded_notification_reads = [];
}

$action = $_GET['action'] ?? ($argv[1] ?? null);
$logs = [];

function seed_table_data(mysqli $db, string $table, array $records, array &$logs): void {
    if (empty($records)) {
        $logs[] = ["type" => "info", "msg" => "No snapshot records found to seed for table: <strong>$table</strong>"];
        return;
    }
    
    $logs[] = ["type" => "info", "msg" => "Seeding " . count($records) . " records into table: <strong>$table</strong>..."];
    
    // Get columns from the first record
    $columns = array_keys($records[0]);
    $col_list = implode(", ", array_map(function($c) { return "`$c`"; }, $columns));
    $placeholders = implode(", ", array_fill(0, count($columns), "?"));
    
    $query = "INSERT INTO `$table` ($col_list) VALUES ($placeholders)";
    $stmt = $db->prepare($query);
    if (!$stmt) {
        $logs[] = ["type" => "error", "msg" => "Failed to prepare query for $table: " . $db->error];
        return;
    }
    
    $success_count = 0;
    foreach ($records as $record) {
        $types = "";
        $values = [];
        foreach ($columns as $col) {
            $val = $record[$col];
            if (is_null($val)) {
                $types .= "s"; // Bind null as string
                $values[] = null;
            } elseif (is_int($val)) {
                $types .= "i";
                $values[] = $val;
            } elseif (is_double($val)) {
                $types .= "d";
                $values[] = $val;
            } else {
                $types .= "s";
                $values[] = strval($val);
            }
        }
        
        $stmt->bind_param($types, ...$values);
        if ($stmt->execute()) {
            $success_count++;
        } else {
            $logs[] = ["type" => "error", "msg" => "Error seeding record in $table: " . $stmt->error];
        }
    }
    
    $logs[] = ["type" => "success", "msg" => "Successfully seeded $success_count / " . count($records) . " snapshot records in <strong>$table</strong>."];
}

if ($action) {
    try {
        if ($action === 'fresh') {
            $logs[] = ["type" => "info", "msg" => "Starting Fresh Snapshot Re-Seed operation..."];
            
            // Disable foreign keys to safely truncate cascades
            $db->query("SET FOREIGN_KEY_CHECKS = 0");
            $logs[] = ["type" => "info", "msg" => "Disabled database foreign key constraints safely."];

            // List of tables to purge in correct order
            $tables = [
                'notification_reads',
                'student_notifications',
                'software_labs',
                'software',
                'testimonials',
                'sit_in_records',
                'sit_in_sessions',
                'reservations',
                'announcements',
                'students',
                'time_slots',
                'pcs',
                'labs'
            ];
            foreach ($tables as $table) {
                // Check if table exists before truncating
                $exists = $db->query("SHOW TABLES LIKE '$table'");
                if ($exists && $exists->num_rows > 0) {
                    if ($db->query("TRUNCATE TABLE `$table`")) {
                        $logs[] = ["type" => "success", "msg" => "Truncated table: <strong>$table</strong>"];
                    } else {
                        $logs[] = ["type" => "error", "msg" => "Failed to truncate table $table: " . $db->error];
                    }
                }
            }

            // Seed snapshot data for each table
            seed_table_data($db, 'labs', $seeded_labs, $logs);
            seed_table_data($db, 'pcs', $seeded_pcs, $logs);
            seed_table_data($db, 'time_slots', $seeded_time_slots, $logs);
            seed_table_data($db, 'students', $seeded_students, $logs);
            seed_table_data($db, 'announcements', $seeded_announcements, $logs);
            seed_table_data($db, 'reservations', $seeded_reservations, $logs);
            seed_table_data($db, 'sit_in_sessions', $seeded_sit_in_sessions, $logs);
            seed_table_data($db, 'sit_in_records', $seeded_sit_in_records, $logs);
            seed_table_data($db, 'testimonials', $seeded_testimonials, $logs);
            seed_table_data($db, 'software', $seeded_software, $logs);
            seed_table_data($db, 'software_labs', $seeded_software_labs, $logs);
            seed_table_data($db, 'student_notifications', $seeded_student_notifications, $logs);
            seed_table_data($db, 'notification_reads', $seeded_notification_reads, $logs);

            // Re-enable constraints
            $db->query("SET FOREIGN_KEY_CHECKS = 1");
            $logs[] = ["type" => "info", "msg" => "Re-enabled database foreign key constraints."];

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
            margin-top: 0.5rem;
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
            max-height: 350px;
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

        @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.6; }
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
                    Choose an action below to populate or reset your local SQL instance. This seeder automatically applies the exact scanned snapshot data containing your customized tables, active student accounts, test records, software libraries, and pending testimonials.
                </p>

                <div class="btn-group">
                    <a href="?action=fresh" class="btn btn-fresh" onclick="return confirm('WARNING: This will delete ALL existing students, active sessions, histories, announcements, laboratories, PCs, and software configs, and perform a total snapshot restore. Are you sure?');">
                        <div>
                            <strong>Fresh Re-Seed (Full Reset)</strong>
                            <span class="btn-description">Truncates all tables and seeds the exact, complete, scanned database snapshot including laboratories, workstation PCs, student profiles, announcements, reservations, dynamic sit-in sessions, walk-in histories, and testimonials.</span>
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
