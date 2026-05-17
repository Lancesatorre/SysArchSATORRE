<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/modules/auth_module.php';
require_once __DIR__ . '/modules/student_module.php';
require_once __DIR__ . '/modules/admin/students.php';
require_once __DIR__ . '/modules/admin/sessions.php';
require_once __DIR__ . '/modules/admin/announcements.php';
require_once __DIR__ . '/modules/admin/reservations.php';
require_once __DIR__ . '/modules/admin/software.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origins = get_allowed_origins();

if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header('Access-Control-Allow-Origin: http://localhost:5173');
}
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$action = $_GET['action'] ?? '';
$request_method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = [];
}

$routes = [
    'register' => 'handle_register',
    'login' => 'handle_login',
    'updateProfile' => 'handle_update_profile',
    'studentProfileStats' => 'handle_student_profile_stats',
    'studentSitInSummary' => 'handle_student_sit_in_summary',
    'studentReservations' => 'handle_student_reservations',
    'studentCurrentSession' => 'handle_student_current_session',
    'studentHistory' => 'handle_student_history',
    'studentSubmitFeedback' => 'handle_student_submit_feedback',
    'adminListStudents' => 'handle_admin_list_students',
    'adminSearchStudent' => 'handle_admin_search_student',
    'adminUpdateStudent' => 'handle_admin_update_student',
    'adminDeleteStudent' => 'handle_admin_delete_student',
    'adminStartSession' => 'handle_admin_start_session',
    'adminCurrentSessions' => 'handle_admin_current_sessions',
    'adminEndSession' => 'handle_admin_end_session',
    'adminSitInRecords' => 'handle_admin_sit_in_records',
    'adminArchivedRecordsCount' => 'handle_admin_archived_records_count',
    'adminCreateAnnouncement' => 'handle_admin_create_announcement',
    'adminAnnouncementRecords' => 'handle_admin_announcement_records',
    'adminUpdateAnnouncement' => 'handle_admin_update_announcement',
    'adminDeleteAnnouncement' => 'handle_admin_delete_announcement',
    'fetchNotifications' => 'handle_fetch_notifications',
    'markNotificationRead' => 'handle_mark_notification_read',
    'markAllNotificationsRead' => 'handle_mark_all_notifications_read',
    'getPersonalNotifications' => 'handle_get_personal_alerts',
    'markPersonalAlertRead' => 'handle_mark_personal_alert_read',
    'getLabAvailability' => 'handle_get_lab_availability',
    'getPCAvailability' => 'handle_get_pc_availability',
    'createReservation' => 'handle_create_reservation',
    'deleteReservation' => 'handle_delete_reservation',
    'adminGetReservations' => 'handle_admin_get_reservations',
    'adminApproveReservation' => 'handle_admin_approve_reservation',
    'adminDeclineReservation' => 'handle_admin_decline_reservation',
    'getTimeSlots' => 'handle_admin_get_time_slots',
    'adminGetLabPCs' => 'handle_admin_get_lab_pcs',
    'adminUpdatePCStatus' => 'handle_admin_update_pc_status',
    'adminCreateTimeSlot' => 'handle_admin_create_time_slot',
    'adminDeleteTimeSlot' => 'handle_admin_delete_time_slot',
    'clearTimeSlots' => 'handle_admin_clear_all_time_slots',
    'adminUpdateLabStatus' => 'handle_admin_update_lab_status',
    'bulkUpdatePCStatus' => 'handle_admin_bulk_update_pc_status',
    'adminGetAuditHistory' => 'handle_get_audit_history',
    'adminStartReservationSession' => 'handle_start_session',
    'adminMarkReservationAbsent' => 'handle_mark_absent',
    'adminEndReservationSession' => 'handle_end_session',
    'markAllPersonalAlertsRead' => 'handle_mark_all_personal_alerts_read',
    'adminGetSoftware' => 'handle_admin_get_software',
    'adminAddSoftware' => 'handle_admin_add_software',
    'adminEditSoftware' => 'handle_admin_edit_software',
    'adminDeleteSoftware' => 'handle_admin_delete_software',
    'adminBulkAddSoftware' => 'handle_admin_bulk_add_software',
    'studentTopLabs' => 'handle_student_top_labs',
];

if ($request_method !== 'POST') {
    json_response(400, ['success' => false, 'message' => 'Invalid action or method']);
}

if (!isset($routes[$action])) {
    json_response(400, ['success' => false, 'message' => 'Invalid action or method']);
}

$db = connect_db();
initialize_schema($db);

try {
    $handler = $routes[$action];
    $handler($db, $input);
    json_response(400, ['success' => false, 'message' => 'Invalid action or method']);
} catch (Throwable $e) {
    debug_log('Unhandled error: ' . $e->getMessage());
    json_response(500, ['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
} finally {
    $db->close();
}

?>
