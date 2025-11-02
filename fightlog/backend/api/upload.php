<?php
// ===== FIGHTLOG - UPLOAD API ENDPUNKT =====
// Backend-Entwickler: Hier echte Upload-Logik implementieren

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Nur POST-Requests erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// JSON-Daten lesen
$input = json_decode(file_get_contents('php://input'), true);
require_once __DIR__ . '/../db/storage.php';

if (!isset($input['title']) || !isset($input['type']) || !isset($input['date'])) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error' => 'Required fields missing']);
    exit;
}

$cert = [
    'id' => time(),
    'user_id' => $input['userId'] ?? null,
    'title' => $input['title'],
    'type' => $input['type'],
    'date' => $input['date'],
    'level' => $input['level'] ?? '',
    'instructor' => $input['instructor'] ?? '',
    'fileUrl' => $input['fileUrl'] ?? ('certificate_' . time() . '.pdf'),
    'preview' => $input['preview'] ?? '📄',
    'status' => 'pending'
];

append_data('certificates', $cert);

echo json_encode(['success'=>true,'certificate'=>$cert]);
?> 