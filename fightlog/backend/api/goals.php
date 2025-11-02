<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../db/storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(read_data('goals'));
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $item = array_merge(['id'=>time(),'status'=>'in_progress'], $input);
    $res = append_data('goals', $item);
    if (is_array($res)) {
        echo json_encode(['success'=>$res['ok'], 'used_db'=>$res['used_db'], 'error'=>$res['error'], 'goal'=>$res['item']]);
    } else {
        echo json_encode(['success'=>false, 'error'=>'append_data returned unexpected result']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($input['id'])) { http_response_code(400); echo json_encode(['success'=>false,'error'=>'id required']); exit; }
    $ok = update_item('goals', $input['id'], $input);
    echo json_encode(['success'=>$ok]);
    exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);

?>
