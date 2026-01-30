<?php
// backend/core/bootstrap.php
declare(strict_types=1);

use Fightlog\Core\Database;

// Fehler-Reporting: Warnings/Notices nicht anzeigen, aber loggen (verhindert JSON-Zerstörung)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Output-Buffering aktivieren um sicherzustellen, dass nur JSON ausgegeben wird
if (ob_get_level() === 0) {
    ob_start();
}

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/request.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../services/PermissionService.php';

// JSON-Header setzen (muss vor jedem Output sein)
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID, X-User-Role');
}

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

/**
 * Prüft ob der aktuelle Benutzer eine Berechtigung hat
 */
function has_permission(mysqli $mysqli, string $permissionKey): bool
{
    $userId = auth_user_id($mysqli);
    if (!$userId) return false;
    return PermissionService::hasPermission($mysqli, $userId, $permissionKey);
}

/**
 * Erfordert eine Berechtigung, gibt 403 zurück wenn nicht vorhanden
 */
function require_permission(mysqli $mysqli, string $permissionKey): void
{
    $userId = auth_user_id($mysqli);
    PermissionService::requirePermission($mysqli, $userId, $permissionKey);
}

/**
 * Prüft ob der Benutzer eigene oder alle Daten bearbeiten darf
 */
function can_edit(mysqli $mysqli, int $ownerId, string $ownPermission, string $allPermission): bool
{
    $userId = auth_user_id($mysqli);
    if (!$userId) return false;
    return PermissionService::canEditResource($mysqli, $userId, $ownerId, $ownPermission, $allPermission);
}

/**
 * Prüft ob der Benutzer eigene oder alle Daten sehen darf
 */
function can_view(mysqli $mysqli, int $ownerId, string $ownPermission, string $allPermission): bool
{
    $userId = auth_user_id($mysqli);
    if (!$userId) return false;
    return PermissionService::canViewResource($mysqli, $userId, $ownerId, $ownPermission, $allPermission);
}

