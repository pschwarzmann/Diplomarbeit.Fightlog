<?php
// backend/services/AuthService.php

require_once __DIR__ . '/../utils/request.php';

class AuthService
{
    public static function getAuthenticatedUserId(mysqli $connection): ?int
    {
        // Token aus Header holen
        $token = bearer_token();
        
        // Fallback: Token aus Query-Parameter (für Apache-Setups die Header filtern)
        if (!$token && !empty($_GET['token'])) {
            $token = $_GET['token'];
        }
        
        if (!$token) {
            error_log('[FightLog Auth] Kein Token empfangen (weder Header noch Query-Param)');
            return null;
        }

        // Token hashen für Vergleich (in DB wird nur der Hash gespeichert)
        $tokenHash = hash('sha256', $token);

        $stmt = $connection->prepare(
            "SELECT user_id, expires_at FROM sessions WHERE token=? LIMIT 1"
        );
        if (!$stmt) {
            error_log('[FightLog Auth] Prepare fehlgeschlagen: ' . $connection->error);
            return null;
        }

        $stmt->bind_param('s', $tokenHash);
        if (!$stmt->execute()) {
            error_log('[FightLog Auth] Execute fehlgeschlagen: ' . $stmt->error);
            $stmt->close();
            return null;
        }

        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $result->free();
        $stmt->close();
        
        if (!$row) {
            error_log('[FightLog Auth] Kein Session-Eintrag gefunden für Token-Hash: ' . substr($tokenHash, 0, 12) . '...');
            return null;
        }
        
        // Prüfe ob Session abgelaufen ist
        if (strtotime($row['expires_at']) <= time()) {
            error_log('[FightLog Auth] Session abgelaufen: expires_at=' . $row['expires_at'] . ' now=' . date('Y-m-d H:i:s'));
            return null;
        }
        
        return (int)$row['user_id'];
    }
}


