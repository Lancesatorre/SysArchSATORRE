<?php
header('Content-Type: application/json');
require_once '../config.php';

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
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../database.php';

try {
    $sql = "SELECT id, lab_name, location 
            FROM labs 
            WHERE status = 'active'
            ORDER BY lab_name ASC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $labs = [];
    while ($row = $result->fetch_assoc()) {
        $labs[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $labs
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
