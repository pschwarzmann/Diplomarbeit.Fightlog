<?php
// Password Reset API
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body = read_json_body();
    $action = $body['action'] ?? '';
    
    if ($action === 'request') {
        // Passwort-Reset anfordern
        require_fields($body, ['email']);
        $email = trim($body['email']);
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_out(['success' => false, 'error' => 'Ungültige E-Mail-Adresse'], 400);
        }
        
        // Prüfe ob Benutzer existiert
        $stmt = $mysqli->prepare("SELECT id, username FROM users WHERE email = ? LIMIT 1");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        
        // Immer Erfolg zurückgeben (Security: keine Information über existierende E-Mails)
        if ($user) {
            // Token generieren (hashed)
            $token = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $token);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
            
            // Prüfe ob password_reset_tokens Tabelle existiert
            $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'password_reset_tokens'");
            if ($tableCheck && $tableCheck->num_rows > 0) {
                // Alte Tokens löschen
                $deleteStmt = $mysqli->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
                $deleteStmt->bind_param('i', $user['id']);
                $deleteStmt->execute();
                
                // Neuen Token speichern (hashed)
                $insertStmt = $mysqli->prepare("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)");
                $insertStmt->bind_param('iss', $user['id'], $tokenHash, $expiresAt);
                $insertStmt->execute();
                
                // E-Mail senden (non-blocking)
                try {
                    MailService::sendPasswordReset($email, $user['username'], $token);
                } catch (Throwable $e) {
                    error_log('Password reset email failed: ' . $e->getMessage());
                }
            }
        }
        
        // Immer Erfolg zurückgeben (Security)
        json_out(['success' => true, 'message' => 'Falls die E-Mail-Adresse registriert ist, erhalten Sie eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts.']);
    }
    
    if ($action === 'reset') {
        // Passwort zurücksetzen mit Token
        require_fields($body, ['token', 'newPassword']);
        $token = $body['token'];
        $newPassword = $body['newPassword'];
        
        $tokenHash = hash('sha256', $token);
        
        // Prüfe ob password_reset_tokens Tabelle existiert
        $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'password_reset_tokens'");
        if (!$tableCheck || $tableCheck->num_rows === 0) {
            json_out(['success' => false, 'error' => 'Passwort-Reset-System nicht verfügbar'], 503);
        }
        
        // Token prüfen
        $stmt = $mysqli->prepare("SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > NOW() AND used = 0 LIMIT 1");
        $stmt->bind_param('s', $tokenHash);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if (!$result) {
            json_out(['success' => false, 'error' => 'Ungültiger oder abgelaufener Token'], 400);
        }
        
        $userId = (int)$result['user_id'];
        
        // Passwort-Validierung
        $passwordValidation = validate_password_length($mysqli, $newPassword);
        if (!$passwordValidation['valid']) {
            json_out(['success' => false, 'error' => $passwordValidation['error']], 400);
        }
        
        // Passwort hashen
        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        if (!$hash) {
            json_out(['success' => false, 'error' => 'Passwort-Hash konnte nicht generiert werden'], 500);
        }
        
        // Passwort aktualisieren
        $updateStmt = $mysqli->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->bind_param('si', $hash, $userId);
        if (!$updateStmt->execute()) {
            json_out(['success' => false, 'error' => 'Passwort konnte nicht aktualisiert werden'], 500);
        }
        
        // Token als verwendet markieren
        $markStmt = $mysqli->prepare("UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?");
        $markStmt->bind_param('s', $tokenHash);
        $markStmt->execute();
        
        AuditService::log($mysqli, 'password_reset', $userId, 'user', $userId);
        
        json_out(['success' => true, 'message' => 'Passwort erfolgreich zurückgesetzt']);
    }
    
    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

json_out(['success' => false, 'error' => 'Nur POST erlaubt'], 405);
?>
