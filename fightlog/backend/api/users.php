<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../db/storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(read_data('users'));
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($input['id'])) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'id required']); exit; }
    $ok = update_item('users', $input['id'], $input);
    echo json_encode(['success'=>$ok]);
    exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);

?>
