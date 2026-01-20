<?php
// backend/api/logout.php
// Session aus Datenbank löschen
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success' => false, 'error' => 'Nur POST erlaubt'], 405);
}

$userId = auth_user_id($mysqli);

if ($userId) {
    // Alle Sessions des Users löschen
    $stmt = $mysqli->prepare("DELETE FROM sessions WHERE user_id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
}

json_out(['success' => true, 'message' => 'Erfolgreich abgemeldet']);
?>
