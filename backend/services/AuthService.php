<?php
// backend/services/AuthService.php

require_once __DIR__ . '/../utils/request.php';

class AuthService
{
    public static function getAuthenticatedUserId(mysqli $connection): ?int
    {
        $token = bearer_token();
        if (!$token) {
            return null;
        }

        $stmt = $connection->prepare(
            "SELECT user_id FROM sessions WHERE token=? AND expires_at>NOW()"
        );
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param('s', $token);
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


