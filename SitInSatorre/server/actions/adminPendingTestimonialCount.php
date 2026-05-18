<?php
/**
 * adminPendingTestimonialCount.php
 * Returns the count of pending testimonials for the admin navbar badge.
 */
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../helpers.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$db = connect_db();

try {
    $result = $db->query("SELECT COUNT(*) as count FROM testimonials WHERE status = 'pending'");
    $row = $result ? $result->fetch_assoc() : null;

    echo json_encode([
        'success' => true,
        'pending_count' => intval($row['count'] ?? 0)
    ]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'pending_count' => 0]);
}
