<?php
// Logout-API
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success' => false, 'error' => 'Nur POST erlaubt'], 405);
}

$userId = auth_user_id($mysqli);

if ($userId) {
    // Token aus Header extrahieren
    $token = bearer_token();
    
    if ($token) {
        // Spezifische Session löschen (Token gehasht vergleichen)
        $tokenHash = hash('sha256', $token);
        $stmt = $mysqli->prepare("DELETE FROM sessions WHERE token = ?");
        if ($stmt) {
            $stmt->bind_param('s', $tokenHash);
            $stmt->execute();
        }
    } else {
        // Fallback: Alle Sessions des Users löschen
        $stmt = $mysqli->prepare("DELETE FROM sessions WHERE user_id = ?");
        if ($stmt) {
            $stmt->bind_param('i', $userId);
            $stmt->execute();
        }
    }
}

json_out(['success' => true, 'message' => 'Erfolgreich abgemeldet']);
?>
