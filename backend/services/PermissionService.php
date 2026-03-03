<?php
// backend/services/PermissionService.php
// Zentraler Service für Berechtigungsprüfungen
// Berechtigungen werden ausschließlich über die Rolle (schueler/trainer/admin) vergeben.
// Die Tabelle role_permissions definiert welche Rechte jede Rolle hat.

class PermissionService
{
    /**
     * Prüft ob ein Benutzer eine bestimmte Berechtigung hat (basierend auf seiner Rolle)
     */
    public static function hasPermission(mysqli $mysqli, int $userId, string $permissionKey): bool
    {
        $stmt = $mysqli->prepare("
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.role = rp.role
            WHERE u.id = ? AND p.`key` = ?
            LIMIT 1
        ");
        if (!$stmt) return false;
        
        $stmt->bind_param('is', $userId, $permissionKey);
        $stmt->execute();
        $result = $stmt->get_result();
        $found = $result->num_rows > 0;
        $result->free();
        $stmt->close();
        return $found;
    }

    /**
     * Prüft ob ein Benutzer mindestens eine der angegebenen Berechtigungen hat
     */
    public static function hasAnyPermission(mysqli $mysqli, int $userId, array $permissionKeys): bool
    {
        if (empty($permissionKeys)) return false;
        
        // Effiziente Prüfung mit einem einzigen Query statt N+1
        $placeholders = implode(',', array_fill(0, count($permissionKeys), '?'));
        $stmt = $mysqli->prepare("
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.role = rp.role
            WHERE u.id = ? AND p.`key` IN ($placeholders)
            LIMIT 1
        ");
        if (!$stmt) return false;
        
        $types = 'i' . str_repeat('s', count($permissionKeys));
        $params = array_merge([$userId], $permissionKeys);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $found = $result->num_rows > 0;
        $result->free();
        $stmt->close();
        return $found;
    }

    /**
     * Prüft ob ein Benutzer alle angegebenen Berechtigungen hat
     */
    public static function hasAllPermissions(mysqli $mysqli, int $userId, array $permissionKeys): bool
    {
        if (empty($permissionKeys)) return true;
        
        $placeholders = implode(',', array_fill(0, count($permissionKeys), '?'));
        $stmt = $mysqli->prepare("
            SELECT COUNT(DISTINCT p.`key`) as cnt FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.role = rp.role
            WHERE u.id = ? AND p.`key` IN ($placeholders)
        ");
        if (!$stmt) return false;
        
        $types = 'i' . str_repeat('s', count($permissionKeys));
        $params = array_merge([$userId], $permissionKeys);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $result->free();
        $stmt->close();
        return ((int)($row['cnt'] ?? 0)) === count($permissionKeys);
    }

    /**
     * Holt alle Berechtigungen eines Benutzers (basierend auf seiner Rolle)
     */
    public static function getUserPermissions(mysqli $mysqli, int $userId): array
    {
        $stmt = $mysqli->prepare("
            SELECT p.`key` FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN users u ON u.role = rp.role
            WHERE u.id = ?
            ORDER BY p.`key`
        ");
        if (!$stmt) return [];
        
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $permissions = [];
        while ($row = $result->fetch_assoc()) {
            $permissions[] = $row['key'];
        }
        $result->free();
        $stmt->close();
        return $permissions;
    }

    /**
     * Prüft Berechtigung und gibt Fehler zurück wenn nicht vorhanden
     */
    public static function requirePermission(mysqli $mysqli, ?int $userId, string $permissionKey): void
    {
        if (!$userId) {
            json_error('Nicht authentifiziert', 401);
        }
        
        if (!self::hasPermission($mysqli, $userId, $permissionKey)) {
            json_error('Keine Berechtigung: ' . $permissionKey, 403);
        }
    }

    /**
     * Prüft ob Benutzer eigene Daten bearbeiten darf ODER fremde Daten bearbeiten darf
     */
    public static function canEditResource(mysqli $mysqli, int $viewerId, int $ownerId, string $ownPermission, string $allPermission): bool
    {
        if ($viewerId === $ownerId) {
            return self::hasPermission($mysqli, $viewerId, $ownPermission);
        }
        return self::hasPermission($mysqli, $viewerId, $allPermission);
    }

    /**
     * Prüft ob Benutzer eigene Daten sehen darf ODER alle Daten sehen darf
     */
    public static function canViewResource(mysqli $mysqli, int $viewerId, int $ownerId, string $ownPermission, string $allPermission): bool
    {
        if ($viewerId === $ownerId) {
            return self::hasPermission($mysqli, $viewerId, $ownPermission);
        }
        return self::hasPermission($mysqli, $viewerId, $allPermission);
    }
}
