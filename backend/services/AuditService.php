<?php
// backend/services/AuditService.php
// Non-blocking Audit-Logging Service

class AuditService
{
    /**
     * Protokolliert eine Aktion (non-blocking)
     * @param mysqli $mysqli Datenbankverbindung
     * @param string $action Aktion (z.B. 'login_success', 'login_failed', 'password_changed')
     * @param int|null $userId Benutzer-ID (null wenn nicht authentifiziert)
     * @param string|null $entityType Typ der betroffenen Entität (z.B. 'user', 'passkey')
     * @param int|null $entityId ID der betroffenen Entität
     * @param array|null $details Zusätzliche Details (wird als JSON gespeichert)
     */
    public static function log(mysqli $mysqli, string $action, ?int $userId = null, ?string $entityType = null, ?int $entityId = null, ?array $details = null): void
    {
        // Non-blocking: Fehler werden ignoriert
        try {
            // Prüfe ob Tabelle existiert
            $tableCheck = @$mysqli->query("SHOW TABLES LIKE 'audit_logs'");
            if (!$tableCheck || $tableCheck->num_rows === 0) {
                return; // Tabelle existiert nicht, Logging überspringen
            }
            
            $ipAddress = self::getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $detailsJson = $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null;
            
            // Keine Klartext-Passwörter loggen
            if ($details && isset($details['password'])) {
                unset($details['password']);
                $detailsJson = json_encode($details, JSON_UNESCAPED_UNICODE);
            }
            if ($details && isset($details['newPassword'])) {
                unset($details['newPassword']);
                $detailsJson = json_encode($details, JSON_UNESCAPED_UNICODE);
            }
            if ($details && isset($details['currentPassword'])) {
                unset($details['currentPassword']);
                $detailsJson = json_encode($details, JSON_UNESCAPED_UNICODE);
            }
            
            $stmt = $mysqli->prepare(
                "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            
            if ($stmt) {
                $stmt->bind_param('ississs', 
                    $userId, 
                    $action, 
                    $entityType, 
                    $entityId, 
                    $detailsJson, 
                    $ipAddress, 
                    $userAgent
                );
                @$stmt->execute(); // @ unterdrückt Fehler
                $stmt->close();
            }
        } catch (Throwable $e) {
            // Logging-Fehler dürfen niemals die Funktionalität blockieren
            error_log('Audit logging failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Ermittelt die Client-IP-Adresse
     */
    private static function getClientIp(): string
    {
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
}
