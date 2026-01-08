<?php
// backend/services/PermissionService.php
// Zentraler Service für Berechtigungsprüfungen

class PermissionService
{
    /**
     * Prüft ob ein Benutzer eine bestimmte Berechtigung hat
     */
    public static function hasPermission(mysqli $mysqli, int $userId, string $permissionKey): bool
    {
        $stmt = $mysqli->prepare("
            SELECT 1 FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = ? AND p.`key` = ?
            LIMIT 1
        ");
        if (!$stmt) return false;
        
        $stmt->bind_param('is', $userId, $permissionKey);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->num_rows > 0;
    }

    /**
     * Prüft ob ein Benutzer mindestens eine der angegebenen Berechtigungen hat
     */
    public static function hasAnyPermission(mysqli $mysqli, int $userId, array $permissionKeys): bool
    {
        foreach ($permissionKeys as $key) {
            if (self::hasPermission($mysqli, $userId, $key)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Prüft ob ein Benutzer alle angegebenen Berechtigungen hat
     */
    public static function hasAllPermissions(mysqli $mysqli, int $userId, array $permissionKeys): bool
    {
        foreach ($permissionKeys as $key) {
            if (!self::hasPermission($mysqli, $userId, $key)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Holt alle Berechtigungen eines Benutzers
     */
    public static function getUserPermissions(mysqli $mysqli, int $userId): array
    {
        $stmt = $mysqli->prepare("
            SELECT p.`key`, p.label FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = ?
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
        return $permissions;
    }

    /**
     * Weist einem Benutzer die Berechtigungen seiner Rolle zu
     */
    public static function assignRolePermissions(mysqli $mysqli, int $userId, string $role): bool
    {
        // Erst alle bestehenden Berechtigungen löschen
        $deleteStmt = $mysqli->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        if (!$deleteStmt) return false;
        $deleteStmt->bind_param('i', $userId);
        $deleteStmt->execute();

        // Neue Berechtigungen basierend auf Rolle zuweisen
        $insertStmt = $mysqli->prepare("
            INSERT INTO user_permissions (user_id, permission_id)
            SELECT ?, permission_id FROM role_permissions WHERE role = ?
        ");
        if (!$insertStmt) return false;
        
        $insertStmt->bind_param('is', $userId, $role);
        return $insertStmt->execute();
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
        // Eigene Daten?
        if ($viewerId === $ownerId) {
            return self::hasPermission($mysqli, $viewerId, $ownPermission);
        }
        // Fremde Daten?
        return self::hasPermission($mysqli, $viewerId, $allPermission);
    }

    /**
     * Prüft ob Benutzer eigene Daten sehen darf ODER alle Daten sehen darf
     */
    public static function canViewResource(mysqli $mysqli, int $viewerId, int $ownerId, string $ownPermission, string $allPermission): bool
    {
        // Eigene Daten?
        if ($viewerId === $ownerId) {
            return self::hasPermission($mysqli, $viewerId, $ownPermission);
        }
        // Fremde Daten?
        return self::hasPermission($mysqli, $viewerId, $allPermission);
    }
}
