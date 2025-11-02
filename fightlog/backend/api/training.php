<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../db/storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(read_data('training'));
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $item = array_merge(['id'=>time()], $input);
    append_data('training', $item);
    echo json_encode(['success'=>true,'training'=>$item]);
    exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);

?>
