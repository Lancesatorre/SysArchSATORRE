<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

define('ADMIN_ID', 'A-0000');
define('ADMIN_PASSWORD', 'admin123!');
define('ADMIN_FIRST_NAME', 'Admin');
define('ADMIN_LAST_NAME', 'User');
define('ADMIN_EMAIL', 'admin@sit-in.local');
define('ADMIN_ROLE', 'admin');

// Get the origin from the request
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// CORS headers (needed for both Apache and PHP built-in server)
$allowed_origins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];

if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 3600');
header("Content-Type: application/json; charset=UTF-8");

function debug_log($message) {
    error_log("[" . date('Y-m-d H:i:s') . "] " . $message);
}

debug_log("Request received - Action: " . ($_GET['action'] ?? 'none') . " Method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    debug_log("Preflight request handled");
    http_response_code(200);
    exit(0);
}

// Include database configuration
require_once 'dbConfig.php';

$action = $_GET['action'] ?? '';
$request_method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Response array
$response = ['success' => false, 'message' => ''];

try {
    // Include all action handlers
    require_once 'actions/register.php';
    require_once 'actions/login.php';
    require_once 'actions/studentProfileStats.php';
    require_once 'actions/adminListStudents.php';
    require_once 'actions/adminSearchStudent.php';
    require_once 'actions/adminUpdateStudent.php';
    require_once 'actions/adminDeleteStudent.php';
    require_once 'actions/adminStartSession.php';
    require_once 'actions/adminCurrentSessions.php';
    require_once 'actions/adminEndSession.php';
    require_once 'actions/adminSitInRecords.php';
    require_once 'actions/updateProfile.php';

    // DEFAULT RESPONSE (reached only when no action handler exited)
    http_response_code(400);
    $response['message'] = 'Invalid action or method';
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    $response['message'] = 'Error: ' . $e->getMessage();
    echo json_encode($response);
} finally {
    $db->close();
}
?>
