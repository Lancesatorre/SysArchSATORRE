<?php
/**
 * adminPendingReservationCount.php
 * Returns the count of pending reservations for the admin navbar badge.
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = connect_db();
initialize_schema($db);

try {
    $current_date = date('Y-m-d');
    $current_time = date('H:i:s');

    // Auto-decline pending reservations that are 15 minutes past start time
    $db->query("UPDATE reservations 
                SET status = 'declined', decline_reason = 'Auto-declined: Exceeded 15 minutes past start time without approval'
                WHERE status = 'pending' 
                AND (
                    reservation_date < '$current_date' 
                    OR (
                        reservation_date = '$current_date' 
                        AND TIME_TO_SEC(TIMEDIFF('$current_time', time_from)) > 900
                    )
                )");

    $result = $db->query("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'");
    $row = $result ? $result->fetch_assoc() : null;

    echo json_encode([
        'success' => true,
        'pending_count' => intval($row['count'] ?? 0)
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'pending_count' => 0]);
}
