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

// Validierung
if (!isset($input['title']) || !isset($input['type']) || !isset($input['date'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Required fields missing']);
    exit;
}

// TODO: Backend-Entwickler - Hier echte Upload-Logik implementieren
// - Datei-Upload verarbeiten
// - In Datenbank speichern
// - Datei im uploads/ Ordner speichern

$response = [
    'success' => true,
    'certificate' => [
        'id' => time(),
        'title' => $input['title'],
        'type' => $input['type'],
        'date' => $input['date'],
        'level' => $input['level'] ?? '',
        'instructor' => $input['instructor'] ?? '',
        'fileUrl' => 'certificate_' . time() . '.pdf',
        'preview' => '📄',
        'status' => 'pending'
    ]
];

echo json_encode($response);
?> 