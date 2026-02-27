<?php
// backend/core/bootstrap.php
declare(strict_types=1);

use Fightlog\Core\Database;

// Fehler-Reporting: Warnings/Notices nicht anzeigen, aber loggen (verhindert JSON-Zerstörung)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Fehlerbehandlung registrieren
set_error_handler(function($severity, $message, $file, $line) {
    if (error_reporting() === 0) return false;
    
    // Prüfe ob es ein API-Call ist
    $isApiCall = (
        isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
    ) || (
        isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    );
    
    if ($isApiCall) {
        // Für API-Calls: JSON-Fehler
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'error' => 'Ein Fehler ist aufgetreten',
            'code' => 500
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Für Browser: Loggen aber nicht anzeigen (verhindert JSON-Zerstörung)
    // Security: Keine sensitiven Pfade/Dateinamen in Logs
    $safeFile = basename($file);
    error_log("PHP Error: {$message} in {$safeFile} on line {$line}");
    return false;
});

set_exception_handler(function($exception) {
    // Security: Log Exception-Details nur server-seitig (ohne Stack Trace)
    if ($exception instanceof Exception) {
        error_log('Exception: ' . get_class($exception) . ' - ' . $exception->getMessage());
    }
    
    // Prüfe ob es ein API-Call ist
    $isApiCall = (
        isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
    ) || (
        isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    );
    
    if ($isApiCall) {
        // Für API-Calls: JSON-Fehler
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code(500);
        }
        echo json_encode([
            'success' => false,
            'error' => 'Ein Fehler ist aufgetreten',
            'code' => 500
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        // Für Browser: HTML-Fehlerseite
        require_once __DIR__ . '/../errors/handle_error.php';
        handle_error(500, 'Ein Fehler ist aufgetreten');
    }
});

// Output-Buffering aktivieren um sicherzustellen, dass nur JSON ausgegeben wird
if (ob_get_level() === 0) {
    ob_start();
}

require_once __DIR__ . '/env.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/request.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../services/PermissionService.php';
require_once __DIR__ . '/../services/AuditService.php';
require_once __DIR__ . '/../services/MailService.php';

// Umgebungsvariablen laden
Env::load();

// JSON-Header nur für API-Calls setzen
$isApiCall = (
    isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
) || (
    isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
) || (
    isset($_SERVER['HTTP_CONTENT_TYPE']) && strpos($_SERVER['HTTP_CONTENT_TYPE'], 'application/json') !== false
) || (
    strpos($_SERVER['REQUEST_URI'] ?? '', '/api/') !== false
);

if (!headers_sent()) {
    if ($isApiCall) {
        header('Content-Type: application/json; charset=utf-8');
    }
    Security::setCorsHeaders();
    Security::setSecurityHeaders();
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
    // Authentifizierung NUR über echte Session (Bearer Token)
    $sessionUserId = AuthService::getAuthenticatedUserId($mysqli);
    if ($sessionUserId) {
        return $sessionUserId;
    }
    
    return null;
}

function auth_user_role(mysqli $mysqli): ?string
{
    // Rolle aus DB anhand authentifiziertem User
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

/**
 * Validiert ein Passwort gegen die Mindestlänge aus der Datenbank
 * @param mysqli $mysqli Datenbankverbindung
 * @param string $password Das zu validierende Passwort
 * @return array ['valid' => bool, 'error' => string|null]
 */
function validate_password_length(mysqli $mysqli, string $password): array
{
    // Hole password_min_length aus der Datenbank
    $stmt = $mysqli->prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'password_min_length' LIMIT 1");
    $minLength = 8; // Fallback-Wert
    
    if ($stmt && $stmt->execute()) {
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            $minLength = (int)$row['setting_value'];
        }
    }
    
    // Validierung
    if (empty($password) || $password === '') {
        return ['valid' => false, 'error' => 'Passwort darf nicht leer sein'];
    }
    
    if (strlen($password) < $minLength) {
        return ['valid' => false, 'error' => "Passwort muss mindestens {$minLength} Zeichen lang sein"];
    }
    
    return ['valid' => true, 'error' => null];
}

