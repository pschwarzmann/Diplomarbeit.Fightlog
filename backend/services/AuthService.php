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
            return null;
        }

        // Token hashen für Vergleich (in DB wird nur der Hash gespeichert)
        $tokenHash = hash('sha256', $token);

        $stmt = $connection->prepare(
            "SELECT user_id FROM sessions WHERE token=? AND expires_at>NOW()"
        );
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param('s', $tokenHash);
        if (!$stmt->execute()) {
            return null;
        }

        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            return (int)$row['user_id'];
        }

        return null;
    }
}


