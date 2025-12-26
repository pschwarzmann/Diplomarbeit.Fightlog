<?php
// backend/core/bootstrap.php
declare(strict_types=1);

use Fightlog\Core\Database;

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/request.php';
require_once __DIR__ . '/../services/AuthService.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID, X-User-Role');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db(): mysqli
{
    static $connection = null;

    if ($connection instanceof mysqli) {
        return $connection;
    }

    $connection = Database::getConnection();
    return $connection;
}

function auth_user_id(mysqli $mysqli): ?int
{
    // Zuerst echte Session prüfen
    $sessionUserId = AuthService::getAuthenticatedUserId($mysqli);
    if ($sessionUserId) {
        return $sessionUserId;
    }
    
    // Fallback: X-User-ID Header (für Demo/Entwicklung)
    $headerUserId = $_SERVER['HTTP_X_USER_ID'] ?? null;
    if ($headerUserId && is_numeric($headerUserId)) {
        return (int)$headerUserId;
    }
    
    return null;
}

function auth_user_role(mysqli $mysqli): ?string
{
    // Zuerst aus Header (für Demo)
    $headerRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
    if ($headerRole) {
        return $headerRole;
    }
    
    // Sonst aus DB
    $userId = auth_user_id($mysqli);
    if (!$userId) return null;
    
    $stmt = $mysqli->prepare("SELECT role FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        return $row['role'];
    }
    return null;
}

