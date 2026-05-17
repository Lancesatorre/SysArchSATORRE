<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config.php';
require_once '../database.php';

try {
    // Get date from query parameter, default to today
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
    
    $db = connect_db();
    initialize_schema($db);
    
    $sql = "SELECT 
            l.id,
            l.lab_name,
            l.location,
            l.capacity,
            l.status,
            COUNT(p.id) as total_pcs,
            SUM(CASE WHEN p.status = 'available' THEN 1 ELSE 0 END) as available_pcs
            FROM labs l
            LEFT JOIN pcs p ON l.id = p.lab_id
            GROUP BY l.id, l.lab_name, l.location, l.capacity, l.status
            ORDER BY l.lab_name ASC";
    
    $result = $db->query($sql);
    
    if (!$result) {
        throw new Exception($db->error);
    }
    
    $labs = [];
    while ($row = $result->fetch_assoc()) {
        $labs[] = [
            'id' => intval($row['id']),
            'lab_name' => $row['lab_name'],
            'location' => $row['location'],
            'total_pcs' => intval($row['total_pcs']),
            'available_pcs' => intval($row['available_pcs']),
            'status' => $row['status']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $labs
    ]);
    
    $db->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
