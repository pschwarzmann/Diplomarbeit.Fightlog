<?php
// backend/api/passkeys.php
// WebAuthn/Passkey Management API
// Alle Responses sind JSON (kein HTML, keine Redirects)
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$currentUserId = auth_user_id($mysqli);

if (!$currentUserId) {
    json_error('Nicht authentifiziert', 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$body = read_json_body();

if ($method === 'GET') {
    // Liste aller Passkeys des aktuellen Users
    // Prüfe ob passkeys-Tabelle existiert
    $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkeys'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        json_out(['success' => true, 'passkeys' => []]);
    }
    
    $stmt = $mysqli->prepare("SELECT id, credential_id, friendly_name, transports, created_at, last_used_at, sign_count FROM passkeys WHERE user_id = ? ORDER BY created_at DESC");
    if (!$stmt) {
        json_error('Datenbankfehler', 500);
    }
    
    $stmt->bind_param('i', $currentUserId);
    if (!$stmt->execute()) {
        json_error('Datenbankfehler', 500);
    }
    
    $result = $stmt->get_result();
    $passkeys = [];
    while ($row = $result->fetch_assoc()) {
        $passkeys[] = [
            'id' => (int)$row['id'],
            'credentialId' => $row['credential_id'],
            'friendlyName' => $row['friendly_name'] ?: 'Passkey',
            'transports' => $row['transports'] ? explode(',', $row['transports']) : [],
            'createdAt' => $row['created_at'],
            'lastUsedAt' => $row['last_used_at'],
            'signCount' => (int)$row['sign_count']
        ];
    }
    
    json_out(['success' => true, 'passkeys' => $passkeys]);
}

if ($method === 'POST') {
    $action = $body['action'] ?? '';
    
    if ($action === 'register') {
        // Challenge für Registration generieren
        // Prüfe ob passkey_challenges-Tabelle existiert
        $challengesTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkey_challenges'");
        if (!$challengesTableCheck || $challengesTableCheck->num_rows === 0) {
            json_error('Passkey-System nicht verfügbar', 503);
        }
        
        $challenge = bin2hex(random_bytes(32));
        
        // Challenge in DB speichern
        $challengeStmt = $mysqli->prepare("INSERT INTO passkey_challenges (user_id, challenge, type, expires_at) VALUES (?, ?, 'register', DATE_ADD(NOW(), INTERVAL 5 MINUTE)) ON DUPLICATE KEY UPDATE challenge = VALUES(challenge), expires_at = VALUES(expires_at)");
        if (!$challengeStmt) {
            json_error('Datenbankfehler', 500);
        }
        $challengeStmt->bind_param('is', $currentUserId, $challenge);
        if (!$challengeStmt->execute()) {
            json_error('Challenge konnte nicht gespeichert werden', 500);
        }
        
        // User-Daten für WebAuthn
        $userStmt = $mysqli->prepare("SELECT id, username, email FROM users WHERE id = ?");
        if (!$userStmt) {
            json_error('Datenbankfehler', 500);
        }
        $userStmt->bind_param('i', $currentUserId);
        if (!$userStmt->execute()) {
            json_error('Benutzer konnte nicht geladen werden', 500);
        }
        $userResult = $userStmt->get_result();
        $user = $userResult->fetch_assoc();
        
        if (!$user) {
            json_error('Benutzer nicht gefunden', 404);
        }
        
        // RP-ID bestimmen (muss zur Domain passen)
        $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost';
        // Entferne Port falls vorhanden
        $host = preg_replace('/:\d+$/', '', $host);
        
        json_out([
            'success' => true,
            'challenge' => base64_encode(hex2bin($challenge)),
            'rp' => [
                'name' => 'FightLog',
                'id' => $host
            ],
            'user' => [
                'id' => base64_encode(pack('N', $user['id'])),
                'name' => $user['username'],
                'displayName' => $user['email']
            ],
            'pubKeyCredParams' => [
                ['alg' => -7, 'type' => 'public-key'], // ES256
                ['alg' => -257, 'type' => 'public-key'] // RS256
            ],
            'authenticatorSelection' => [
                'authenticatorAttachment' => 'platform',
                'userVerification' => 'preferred'
            ],
            'timeout' => 60000,
            'attestation' => 'direct'
        ]);
    }
    
    if ($action === 'verify') {
        // Registration verifizieren und speichern
        require_fields($body, ['credential', 'challenge', 'friendlyName']);
        
        // Prüfe ob Tabellen existieren
        $passkeysTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkeys'");
        $challengesTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkey_challenges'");
        if (!$passkeysTableCheck || $passkeysTableCheck->num_rows === 0 || !$challengesTableCheck || $challengesTableCheck->num_rows === 0) {
            json_error('Passkey-System nicht verfügbar', 503);
        }
        
        // Challenge validieren
        $challengeBin = base64_decode($body['challenge']);
        $challengeHex = bin2hex($challengeBin);
        
        $challengeStmt = $mysqli->prepare("SELECT user_id FROM passkey_challenges WHERE user_id = ? AND challenge = ? AND type = 'register' AND expires_at > NOW()");
        if (!$challengeStmt) {
            json_error('Datenbankfehler', 500);
        }
        $challengeStmt->bind_param('is', $currentUserId, $challengeHex);
        if (!$challengeStmt->execute()) {
            json_error('Datenbankfehler', 500);
        }
        $challengeResult = $challengeStmt->get_result()->fetch_assoc();
        
        if (!$challengeResult) {
            json_error('Ungültige oder abgelaufene Challenge', 400);
        }
        
        // Credential-Daten extrahieren
        $credential = $body['credential'];
        $credentialId = $credential['id'] ?? '';
        
        if (empty($credentialId)) {
            json_error('Ungültige Credential-ID', 400);
        }
        
        $publicKey = json_encode([
            'attestationObject' => $credential['response']['attestationObject'] ?? [],
            'clientDataJSON' => $credential['response']['clientDataJSON'] ?? []
        ]);
        $transports = isset($credential['transports']) && is_array($credential['transports']) ? implode(',', $credential['transports']) : null;
        $friendlyName = $body['friendlyName'] ?? 'Passkey';
        
        // Passkey speichern
        $insertStmt = $mysqli->prepare("INSERT INTO passkeys (user_id, credential_id, public_key, transports, friendly_name) VALUES (?, ?, ?, ?, ?)");
        if (!$insertStmt) {
            json_error('Datenbankfehler', 500);
        }
        $insertStmt->bind_param('issss', $currentUserId, $credentialId, $publicKey, $transports, $friendlyName);
        
        if (!$insertStmt->execute()) {
            if ($mysqli->errno === 1062) { // Duplicate entry
                json_error('Dieser Passkey ist bereits registriert', 400);
            }
            json_error('Passkey konnte nicht gespeichert werden', 500);
        }
        
        // Challenge löschen
        $deleteStmt = $mysqli->prepare("DELETE FROM passkey_challenges WHERE user_id = ? AND challenge = ?");
        if ($deleteStmt) {
            $deleteStmt->bind_param('is', $currentUserId, $challengeHex);
            $deleteStmt->execute();
        }
        
        json_out(['success' => true, 'message' => 'Passkey erfolgreich registriert']);
    }
    
    if ($action === 'authenticate') {
        // Challenge für Authentication generieren
        $passkeysTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkeys'");
        $challengesTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkey_challenges'");
        if (!$passkeysTableCheck || $passkeysTableCheck->num_rows === 0 || !$challengesTableCheck || $challengesTableCheck->num_rows === 0) {
            json_error('Passkey-System nicht verfügbar', 503);
        }
        
        $credentialId = $body['credentialId'] ?? null;
        
        if ($credentialId) {
            $stmt = $mysqli->prepare("SELECT credential_id, public_key, transports FROM passkeys WHERE user_id = ? AND credential_id = ?");
            if (!$stmt) {
                json_error('Datenbankfehler', 500);
            }
            $stmt->bind_param('is', $currentUserId, $credentialId);
        } else {
            $stmt = $mysqli->prepare("SELECT credential_id, public_key, transports FROM passkeys WHERE user_id = ?");
            if (!$stmt) {
                json_error('Datenbankfehler', 500);
            }
            $stmt->bind_param('i', $currentUserId);
        }
        
        if (!$stmt->execute()) {
            json_error('Datenbankfehler', 500);
        }
        
        $result = $stmt->get_result();
        $allowCredentials = [];
        while ($row = $result->fetch_assoc()) {
            $credentialIdBytes = base64_decode($row['credential_id']);
            $allowCredentials[] = [
                'id' => $credentialIdBytes,
                'type' => 'public-key',
                'transports' => $row['transports'] ? explode(',', $row['transports']) : ['internal', 'usb', 'nfc', 'ble']
            ];
        }
        
        if (empty($allowCredentials)) {
            json_error('Keine Passkeys gefunden', 404);
        }
        
        $challenge = bin2hex(random_bytes(32));
        
        // Challenge speichern
        $challengeStmt = $mysqli->prepare("INSERT INTO passkey_challenges (user_id, challenge, type, expires_at) VALUES (?, ?, 'authenticate', DATE_ADD(NOW(), INTERVAL 5 MINUTE)) ON DUPLICATE KEY UPDATE challenge = VALUES(challenge), expires_at = VALUES(expires_at)");
        if (!$challengeStmt) {
            json_error('Datenbankfehler', 500);
        }
        $challengeStmt->bind_param('is', $currentUserId, $challenge);
        if (!$challengeStmt->execute()) {
            json_error('Challenge konnte nicht gespeichert werden', 500);
        }
        
        json_out([
            'success' => true,
            'challenge' => base64_encode(hex2bin($challenge)),
            'allowCredentials' => $allowCredentials,
            'timeout' => 60000,
            'userVerification' => 'preferred'
        ]);
    }
    
    if ($action === 'verifyAuth') {
        // Authentication verifizieren
        require_fields($body, ['credential', 'challenge']);
        
        $passkeysTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkeys'");
        $challengesTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkey_challenges'");
        if (!$passkeysTableCheck || $passkeysTableCheck->num_rows === 0 || !$challengesTableCheck || $challengesTableCheck->num_rows === 0) {
            json_error('Passkey-System nicht verfügbar', 503);
        }
        
        $challengeBin = base64_decode($body['challenge']);
        $challengeHex = bin2hex($challengeBin);
        
        // Challenge validieren
        $challengeStmt = $mysqli->prepare("SELECT user_id FROM passkey_challenges WHERE user_id = ? AND challenge = ? AND type = 'authenticate' AND expires_at > NOW()");
        if (!$challengeStmt) {
            json_error('Datenbankfehler', 500);
        }
        $challengeStmt->bind_param('is', $currentUserId, $challengeHex);
        if (!$challengeStmt->execute()) {
            json_error('Datenbankfehler', 500);
        }
        $challengeResult = $challengeStmt->get_result()->fetch_assoc();
        
        if (!$challengeResult) {
            json_error('Ungültige oder abgelaufene Challenge', 400);
        }
        
        $credential = $body['credential'];
        $credentialId = $credential['id'] ?? '';
        
        // Passkey finden und sign_count aktualisieren
        $updateStmt = $mysqli->prepare("UPDATE passkeys SET sign_count = sign_count + 1, last_used_at = NOW() WHERE user_id = ? AND credential_id = ?");
        if ($updateStmt) {
            $updateStmt->bind_param('is', $currentUserId, $credentialId);
            $updateStmt->execute();
        }
        
        // Challenge löschen
        $deleteStmt = $mysqli->prepare("DELETE FROM passkey_challenges WHERE user_id = ? AND challenge = ?");
        if ($deleteStmt) {
            $deleteStmt->bind_param('is', $currentUserId, $challengeHex);
            $deleteStmt->execute();
        }
        
        json_out(['success' => true, 'message' => 'Passkey-Authentifizierung erfolgreich']);
    }
    
    json_error('Unbekannte Aktion', 400);
}

if ($method === 'DELETE') {
    // Passkey löschen
    require_fields($body, ['id']);
    
    $passkeysTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkeys'");
    if (!$passkeysTableCheck || $passkeysTableCheck->num_rows === 0) {
        json_error('Passkey-System nicht verfügbar', 503);
    }
    
    $passkeyId = (int)$body['id'];
    
    $stmt = $mysqli->prepare("DELETE FROM passkeys WHERE id = ? AND user_id = ?");
    if (!$stmt) {
        json_error('Datenbankfehler', 500);
    }
    $stmt->bind_param('ii', $passkeyId, $currentUserId);
    
    if (!$stmt->execute()) {
        json_error('Passkey konnte nicht gelöscht werden', 500);
    }
    
    if ($stmt->affected_rows === 0) {
        json_error('Passkey nicht gefunden oder keine Berechtigung', 404);
    }
    
    json_out(['success' => true, 'message' => 'Passkey erfolgreich gelöscht']);
}

json_error('Unbekannte Methode', 405);
?>
