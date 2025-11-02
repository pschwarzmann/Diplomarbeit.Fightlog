<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../db/storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $certs = read_data('certificates');
    echo json_encode($certs);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($input['id'])) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'id required']); exit; }
    $ok = update_item('certificates', $input['id'], $input);
    echo json_encode(['success'=>$ok]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Accept id via query or JSON
    $id = $_GET['id'] ?? ($input['id'] ?? null);
    if (!$id) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'id required']); exit; }
    $ok = delete_item('certificates', $id);
    echo json_encode(['success'=>$ok]);
    exit;
}

http_response_code(405);
echo json_encode(['error'=>'Method not allowed']);

?>
