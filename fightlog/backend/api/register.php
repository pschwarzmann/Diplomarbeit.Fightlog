<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
require_once __DIR__ . '/../db/storage.php';

if (!isset($input['username']) || !isset($input['password']) || !isset($input['email'])) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error' => 'username, password and email required']);
    exit;
}

$users = read_data('users');
foreach ($users as $u) {
    if ($u['username'] === $input['username']) {
        echo json_encode(['success'=>false,'error'=>'Username already exists']);
        exit;
    }
}

$new = [
    'id' => time(),
    'username' => $input['username'],
    'email' => $input['email'],
    'password' => $input['password'], // NOTE: plain text for demo only
    'role' => $input['role'] ?? 'schueler',
    'createdAt' => date('c')
];

append_data('users', $new);
echo json_encode(['success'=>true,'user'=>$new]);

?>
