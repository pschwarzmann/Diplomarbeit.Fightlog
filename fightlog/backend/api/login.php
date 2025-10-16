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

// TODO: Backend-Entwickler - Hier echte Authentifizierung implementieren
// Beispiel für Dummy-Response:
$response = [
    'success' => true,
    'user' => [
        'id' => 1,
        'username' => $input['username'],
        'email' => $input['username'] . '@example.com',
        'role' => 'trainer', // oder 'schueler'
        'name' => 'Max Müller',
        'school' => 'Kampfsport Akademie Berlin',
        'beltLevel' => 'Schwarzgurt 3. Dan'
    ],
    'token' => 'dummy-token-' . time()
];

echo json_encode($response);
?> 