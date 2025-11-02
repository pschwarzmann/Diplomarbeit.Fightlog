<?php
// ===== FIGHTLOG - LOGIN API ENDPUNKT =====
// Backend-Entwickler: Hier echte Login-Logik implementieren

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

// Validierung
if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

// Simple file-based authentication for demo
require_once __DIR__ . '/../db/storage.php';

if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Username and password required']);
    exit;
}

$users = read_data('users');
$found = null;
foreach ($users as $u) {
    if ($u['username'] === $input['username'] && isset($u['password']) && $u['password'] === $input['password']) {
        $found = $u; break;
    }
}

// fallback: create demo user if not found
if (!$found) {
    // check demo logins
    $demos = [
        ['username'=>'admin','password'=>'admin123','role'=>'admin','name'=>'Admin Trainer'],
        ['username'=>'trainer','password'=>'trainer123','role'=>'trainer','name'=>'Tom Trainer'],
        ['username'=>'schueler','password'=>'schueler123','role'=>'schueler','name'=>'Sam Schüler']
    ];
    foreach ($demos as $d) {
        if ($d['username'] === $input['username'] && $d['password'] === $input['password']) {
            $found = $d; break;
        }
    }
}

if ($found) {
    $user = [
        'id' => $found['id'] ?? rand(100,9999),
        'username' => $input['username'],
        'email' => ($found['email'] ?? ($input['username'] . '@example.com')),
        'role' => $found['role'] ?? 'schueler',
        'name' => $found['name'] ?? $input['username']
    ];

    echo json_encode(['success'=>true,'user'=>$user,'token'=>'token-' . time()]);
} else {
    echo json_encode(['success'=>false,'error'=>'Ungültige Anmeldedaten']);
}
?> 