<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../db/storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(read_data('courses'));
    exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);

?>
