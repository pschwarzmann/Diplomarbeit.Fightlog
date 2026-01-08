<?php
// backend/api/users.php
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$currentUserId = auth_user_id($mysqli);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Berechtigungsprüfung: view_all_users für alle Benutzer
    if (!has_permission($mysqli, 'view_all_users') && !has_permission($mysqli, 'manage_users')) {
        json_error('Keine Berechtigung', 403);
    }
    
    $res = $mysqli->query("SELECT id, username, email, role, name, first_name as firstName, last_name as lastName, phone, school, belt_level as beltLevel, verified_trainer as verifiedTrainer FROM users ORDER BY id ASC");
    $list = [];
    while ($row = $res->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['verifiedTrainer'] = (bool)$row['verifiedTrainer'];
        // Berechtigungen des Benutzers laden
        $row['permissions'] = PermissionService::getUserPermissions($mysqli, (int)$row['id']);
        $row['passkeys'] = [];
        $list[] = $row;
    }
    json_out($list);
}

if ($method === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : 'update';

    if ($action === 'update') {
        require_permission($mysqli, 'manage_users');
        require_fields($body, ['id','role']);
        
        // Alte Rolle abrufen um zu prüfen ob sich die Rolle ändert
        $checkStmt = $mysqli->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
        $checkStmt->bind_param('i', $body['id']);
        $checkStmt->execute();
        $oldUser = $checkStmt->get_result()->fetch_assoc();
        $oldRole = $oldUser ? $oldUser['role'] : null;
        
        $verified = isset($body['verifiedTrainer']) ? (int)!!$body['verifiedTrainer'] : 0;
        $name = isset($body['name']) ? $body['name'] : '';
        $first = isset($body['firstName']) ? $body['firstName'] : null;
        $last  = isset($body['lastName']) ? $body['lastName'] : null;
        $email = isset($body['email']) ? $body['email'] : null;
        $phone = isset($body['phone']) ? $body['phone'] : null;
        $role  = $body['role'];
        
        $stmt = $mysqli->prepare("UPDATE users SET role=?, verified_trainer=?, name=?, first_name=?, last_name=?, email=?, phone=? WHERE id=?");
        $stmt->bind_param('sisssssi', $role, $verified, $name, $first, $last, $email, $phone, $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Update fehlgeschlagen: '.$stmt->error], 500);
        }
        
        // Wenn sich die Rolle geändert hat, Berechtigungen neu zuweisen
        if ($oldRole !== $role) {
            PermissionService::assignRolePermissions($mysqli, (int)$body['id'], $role);
        }
        
        json_out(['success'=>true]);
    }

    if ($action === 'verify') {
        require_permission($mysqli, 'manage_users');
        require_fields($body, ['id']);
        
        $stmt = $mysqli->prepare("UPDATE users SET role='trainer', verified_trainer=1 WHERE id=?");
        $stmt->bind_param('i', $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Verify fehlgeschlagen: '.$stmt->error], 500);
        }
        
        // Trainer-Berechtigungen zuweisen
        PermissionService::assignRolePermissions($mysqli, (int)$body['id'], 'trainer');
        
        json_out(['success'=>true]);
    }

    if ($action === 'delete') {
        require_permission($mysqli, 'manage_users');
        require_fields($body, ['id']);
        
        // Verhindern dass man sich selbst löscht
        if ((int)$body['id'] === $currentUserId) {
            json_out(['success'=>false, 'error'=>'Du kannst dich nicht selbst löschen'], 400);
        }
        
        $stmt = $mysqli->prepare("DELETE FROM users WHERE id=?");
        $stmt->bind_param('i', $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Delete fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true]);
    }

    if ($action === 'changePassword') {
        require_permission($mysqli, 'manage_users');
        require_fields($body, ['id', 'newPassword']);
        
        // Prüfe, ob Benutzer existiert
        $checkStmt = $mysqli->prepare("SELECT id FROM users WHERE id = ? LIMIT 1");
        $checkStmt->bind_param('i', $body['id']);
        $checkStmt->execute();
        $userExists = $checkStmt->get_result()->fetch_assoc();
        if (!$userExists) {
            json_out(['success'=>false, 'error'=>'Benutzer nicht gefunden'], 404);
        }
        
        // Passwort sicher hashen
        $hash = password_hash($body['newPassword'], PASSWORD_BCRYPT);
        
        // Passwort in Datenbank aktualisieren
        $stmt = $mysqli->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->bind_param('si', $hash, $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Passwort-Update fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true, 'message'=>'Passwort erfolgreich geändert']);
    }

    json_out(['success'=>false, 'error'=>'Unbekannte Aktion'], 400);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST erlaubt'], 405);
?>
