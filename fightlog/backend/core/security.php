<?php
// backend/core/security.php
// Sicherheitsfunktionen: CORS, CSRF, Rate Limiting

require_once __DIR__ . '/env.php';

class Security
{
    /**
     * Setzt sichere CORS-Header basierend auf erlaubten Origins
     */
    public static function setCorsHeaders(): void
    {
        $allowedOrigins = Env::getAllowedOrigins();
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        // Wenn keine Origins konfiguriert oder Entwicklungsmodus: erlaube alles
        if (empty($allowedOrigins) && !Env::isProduction()) {
            header('Access-Control-Allow-Origin: *');
        } elseif (in_array($origin, $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
        } elseif (!empty($allowedOrigins)) {
            // Setze ersten erlaubten Origin als Default
            header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
        }
        
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
        header('Access-Control-Max-Age: 86400'); // 24 Stunden Cache für Preflight
    }

    /**
     * Rate Limiting für Login-Versuche
     * Verwendet Datei-basiertes Tracking (für kleine Anwendungen ausreichend)
     */
    public static function checkLoginRateLimit(string $identifier, mysqli $mysqli): bool
    {
        $maxAttempts = (int)Env::get('LOGIN_MAX_ATTEMPTS', 5);
        $lockoutMinutes = (int)Env::get('LOGIN_LOCKOUT_MINUTES', 15);
        
        // Prüfe ob login_attempts Tabelle existiert
        $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'login_attempts'");
        if (!$tableCheck || $tableCheck->num_rows === 0) {
            // Tabelle existiert nicht, Rate Limiting überspringen
            return true;
        }

        $ip = self::getClientIp();
        $identifierHash = hash('sha256', strtolower($identifier));
        $cutoffTime = date('Y-m-d H:i:s', strtotime("-{$lockoutMinutes} minutes"));

        // Zähle fehlgeschlagene Versuche
        $stmt = $mysqli->prepare(
            "SELECT COUNT(*) as attempts FROM login_attempts 
             WHERE (ip_address = ? OR identifier_hash = ?) 
             AND attempted_at > ? AND success = 0"
        );
        $stmt->bind_param('sss', $ip, $identifierHash, $cutoffTime);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        return ($result['attempts'] ?? 0) < $maxAttempts;
    }

    /**
     * Protokolliert einen Login-Versuch
     */
    public static function logLoginAttempt(string $identifier, bool $success, mysqli $mysqli): void
    {
        // Prüfe ob login_attempts Tabelle existiert
        $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'login_attempts'");
        if (!$tableCheck || $tableCheck->num_rows === 0) {
            return;
        }

        $ip = self::getClientIp();
        $identifierHash = hash('sha256', strtolower($identifier));
        $successInt = $success ? 1 : 0;

        $stmt = $mysqli->prepare(
            "INSERT INTO login_attempts (ip_address, identifier_hash, success, attempted_at) 
             VALUES (?, ?, ?, NOW())"
        );
        $stmt->bind_param('ssi', $ip, $identifierHash, $successInt);
        $stmt->execute();

        // Alte Einträge aufräumen (älter als 24 Stunden)
        $mysqli->query("DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    }

    /**
     * Generiert ein CSRF-Token
     */
    public static function generateCsrfToken(): string
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    /**
     * Validiert ein CSRF-Token
     */
    public static function validateCsrfToken(?string $token): bool
    {
        // In Entwicklung CSRF optional
        if (!Env::isProduction()) {
            return true;
        }

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($token) || empty($_SESSION['csrf_token'])) {
            return false;
        }

        return hash_equals($_SESSION['csrf_token'], $token);
    }

    /**
     * Prüft CSRF für state-changing Requests (POST, PUT, DELETE)
     */
    public static function requireCsrf(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        // CSRF nur für state-changing Methoden prüfen
        if (!in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            return;
        }

        // In Entwicklung CSRF optional
        if (!Env::isProduction()) {
            return;
        }

        // Token aus Header oder Body
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        
        if (!$token) {
            $body = json_decode(file_get_contents('php://input'), true);
            $token = $body['_csrf'] ?? null;
        }

        if (!self::validateCsrfToken($token)) {
            json_error('CSRF-Token ungültig oder fehlt', 403);
        }
    }

    /**
     * Ermittelt die Client-IP-Adresse
     */
    private static function getClientIp(): string
    {
        // Prüfe auf Proxy-Header (vorsichtig, können gefälscht werden)
        $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP'];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ips = explode(',', $_SERVER[$header]);
                $ip = trim($ips[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    /**
     * Gibt verbleibende Sekunden bis zum Ende der Sperre zurück
     */
    public static function getRemainingLockoutTime(string $identifier, mysqli $mysqli): int
    {
        $lockoutMinutes = (int)Env::get('LOGIN_LOCKOUT_MINUTES', 15);
        
        // Prüfe ob login_attempts Tabelle existiert
        $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'login_attempts'");
        if (!$tableCheck || $tableCheck->num_rows === 0) {
            return 0;
        }

        $ip = self::getClientIp();
        $identifierHash = hash('sha256', strtolower($identifier));

        $stmt = $mysqli->prepare(
            "SELECT MAX(attempted_at) as last_attempt FROM login_attempts 
             WHERE (ip_address = ? OR identifier_hash = ?) AND success = 0"
        );
        $stmt->bind_param('ss', $ip, $identifierHash);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        if (empty($result['last_attempt'])) {
            return 0;
        }

        $lastAttempt = strtotime($result['last_attempt']);
        $lockoutEnd = $lastAttempt + ($lockoutMinutes * 60);
        $remaining = $lockoutEnd - time();

        return max(0, $remaining);
    }
}
