<?php
// Session-Management API
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Session-Status abrufen (verbleibende Zeit)
    // Token aus Header ODER Query-Parameter (Fallback für Apache)
    $token = bearer_token();
    if (!$token && !empty($_GET['token'])) {
        $token = $_GET['token'];
    }
    if (!$token) {
        json_out(['success' => false, 'error' => 'Kein Token'], 401);
    }
    
    $tokenHash = hash('sha256', $token);
    $stmt = $mysqli->prepare("SELECT expires_at FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1");
    if (!$stmt) {
        json_out(['success' => false, 'error' => 'Datenbankfehler'], 500);
    }
    
    $stmt->bind_param('s', $tokenHash);
    $stmt->execute();
    $result = $stmt->get_result();
    $session = $result->fetch_assoc();
    
    if (!$session) {
        json_out(['success' => false, 'error' => 'Session abgelaufen', 'expired' => true], 401);
    }
    
    $expiresAt = strtotime($session['expires_at']);
    $now = time();
    $remainingSeconds = max(0, $expiresAt - $now);
    
    json_out([
        'success' => true,
        'expires_at' => $session['expires_at'],
        'remaining_seconds' => $remainingSeconds,
        'expired' => $remainingSeconds <= 0
    ]);
}

if ($method === 'POST') {
    // Session verlängern
    $body = read_json_body();
    $action = $body['action'] ?? '';
    
    if ($action === 'extend') {
        $token = bearer_token();
        if (!$token) {
            json_out(['success' => false, 'error' => 'Kein Token'], 401);
        }
        
        $tokenHash = hash('sha256', $token);
        // Prüfe ob Session existiert und noch gültig ist
        $checkStmt = $mysqli->prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW() LIMIT 1");
        if (!$checkStmt) {
            json_out(['success' => false, 'error' => 'Datenbankfehler'], 500);
        }
        
        $checkStmt->bind_param('s', $tokenHash);
        $checkStmt->execute();
        $session = $checkStmt->get_result()->fetch_assoc();
        
        if (!$session) {
            json_out(['success' => false, 'error' => 'Session abgelaufen', 'expired' => true], 401);
        }
        
        // Verlängere Session um weitere 30 Tage
        $newExpiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        $updateStmt = $mysqli->prepare("UPDATE sessions SET expires_at = ? WHERE token = ?");
        if (!$updateStmt) {
            json_out(['success' => false, 'error' => 'Datenbankfehler'], 500);
        }
        
        $updateStmt->bind_param('ss', $newExpiresAt, $tokenHash);
        if (!$updateStmt->execute()) {
            json_out(['success' => false, 'error' => 'Session konnte nicht verlängert werden'], 500);
        }
        
        json_out([
            'success' => true,
            'expires_at' => $newExpiresAt,
            'remaining_seconds' => 30 * 24 * 60 * 60
        ]);
    }
    
    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

json_out(['success' => false, 'error' => 'Nur GET/POST erlaubt'], 405);
?>
