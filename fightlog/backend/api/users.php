<?php
// users-API
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$currentUserId = auth_user_id($mysqli);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    // Eigenes Profil abrufen
    if ($action === 'profile') {
        $stmt = $mysqli->prepare("SELECT u.id, u.username, u.email, u.role, u.name, u.first_name as firstName, u.last_name as lastName, u.phone, u.school, u.grade_id, g.name as beltLevel FROM users u LEFT JOIN grade g ON u.grade_id = g.id WHERE u.id = ?");
        $stmt->bind_param('i', $currentUserId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        if (!$user) {
            json_out(['success'=>false, 'error'=>'Benutzer nicht gefunden'], 404);
        }
        $user['id'] = (int)$user['id'];
        json_out(['success'=>true, 'user'=>$user]);
    }
    
    // Alle Benutzer abrufen
    if (!has_permission($mysqli, 'view_all_users') && !has_permission($mysqli, 'manage_users')) {
        json_error('Keine Berechtigung', 403);
    }
    
    $res = $mysqli->query("SELECT u.id, u.username, u.email, u.role, u.name, u.first_name as firstName, u.last_name as lastName, u.phone, u.school, u.grade_id, g.name as beltLevel, u.verified_trainer as verifiedTrainer FROM users u LEFT JOIN grade g ON u.grade_id = g.id ORDER BY u.id ASC");
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

// POST - Benutzer aktualisieren, verifizieren oder löschen
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
        $school = isset($body['school']) ? $body['school'] : null;
        $beltLevel = isset($body['beltLevel']) ? $body['beltLevel'] : null;
        $role  = $body['role'];
        
        // E-Mail Validierung
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_out(['success'=>false, 'error'=>'Ungültige E-Mail-Adresse'], 400);
        }
        
        // Grade-ID aus dem Namen ermitteln
        $gradeId = null;
        if ($beltLevel) {
            $gradeStmt = $mysqli->prepare("SELECT id FROM grade WHERE name = ? LIMIT 1");
            $gradeStmt->bind_param('s', $beltLevel);
            $gradeStmt->execute();
            $gradeRes = $gradeStmt->get_result()->fetch_assoc();
            if ($gradeRes) {
                $gradeId = (int)$gradeRes['id'];
            }
        }
        
        $stmt = $mysqli->prepare("UPDATE users SET role=?, verified_trainer=?, name=?, first_name=?, last_name=?, email=?, phone=?, school=?, grade_id=? WHERE id=?");
        $stmt->bind_param('sissssssii', $role, $verified, $name, $first, $last, $email, $phone, $school, $gradeId, $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Update fehlgeschlagen: '.$stmt->error], 500);
        }
        
        // Wenn sich die Rolle geändert hat, Berechtigungen neu zuweisen
        if ($oldRole !== $role) {
            PermissionService::assignRolePermissions($mysqli, (int)$body['id'], $role);
        }
        
        json_out(['success'=>true]);
    }

    // Trainer verifizieren
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

    // Benutzer löschen
    if ($action === 'delete') {
        require_permission($mysqli, 'manage_users');
        require_fields($body, ['id']);
        
        $deleteUserId = (int)$body['id'];
        
        // Verhindern dass man sich selbst löscht
        if ($deleteUserId === $currentUserId) {
            json_out(['success'=>false, 'error'=>'Du kannst dich nicht selbst löschen'], 400);
        }
        
        // Transaktion starten
        $mysqli->begin_transaction();
        
        try {
            // Alle abhängigen Daten löschen (FK-Constraints)
            
            // 1. Ziel-Fortschritt löschen
            $mysqli->query("DELETE ugp FROM user_goal_progress ugp 
                           INNER JOIN user_goals ug ON ugp.user_goal_id = ug.id 
                           WHERE ug.user_id = $deleteUserId");
            
            // 2. Zugewiesene Ziele löschen
            $stmt = $mysqli->prepare("DELETE FROM user_goals WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 3. Kursbuchungen löschen
            $stmt = $mysqli->prepare("DELETE FROM course_bookings WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 4. Gruppenmitgliedschaften löschen
            $stmt = $mysqli->prepare("DELETE FROM group_members WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 5. Urkunden löschen
            $stmt = $mysqli->prepare("DELETE FROM certificates WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 6. Prüfungen löschen
            $stmt = $mysqli->prepare("DELETE FROM exams WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 7. Sessions löschen
            $stmt = $mysqli->prepare("DELETE FROM sessions WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 8. Berechtigungen löschen
            $stmt = $mysqli->prepare("DELETE FROM user_permissions WHERE user_id = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // 9. Passkeys löschen (falls Tabelle existiert)
            @$mysqli->query("DELETE FROM passkeys WHERE user_id = $deleteUserId");
            @$mysqli->query("DELETE FROM passkey_challenges WHERE user_id = $deleteUserId");
            
            // 10. Gruppen des Users löschen (created_by)
            // Erst Mitglieder aus diesen Gruppen entfernen
            $mysqli->query("DELETE gm FROM group_members gm 
                           INNER JOIN student_groups sg ON gm.group_id = sg.id 
                           WHERE sg.created_by = $deleteUserId");
            $stmt = $mysqli->prepare("DELETE FROM student_groups WHERE created_by = ?");
            $stmt->bind_param('i', $deleteUserId);
            $stmt->execute();
            
            // Jetzt den Benutzer löschen
            $stmt = $mysqli->prepare("DELETE FROM users WHERE id = ?");
            $stmt->bind_param('i', $deleteUserId);
            if (!$stmt->execute()) {
                throw new Exception('Delete fehlgeschlagen: ' . $stmt->error);
            }
            
            $mysqli->commit();
            json_out(['success'=>true]);
            
        } catch (Exception $e) {
            $mysqli->rollback();
            json_out(['success'=>false, 'error'=>$e->getMessage()], 500);
        }
    }

    // Passwort ändern
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
        if (empty($body['newPassword']) || $body['newPassword'] === '') {
            json_out(['success'=>false, 'error'=>'Passwort darf nicht leer sein'], 400);
        }
        
        // Prüfe dass Passwort nicht bereits ein Hash ist
        if (preg_match('/^\$2[ayb]\$/', $body['newPassword'])) {
            json_out(['success'=>false, 'error'=>'Ungültiges Passwort-Format'], 400);
        }
        
        $hash = password_hash($body['newPassword'], PASSWORD_BCRYPT);
        
        if (!$hash || strlen($hash) === 0) {
            json_out(['success'=>false, 'error'=>'Passwort-Hash konnte nicht generiert werden'], 500);
        }
        
        // Passwort in Datenbank aktualisieren
        $stmt = $mysqli->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $stmt->bind_param('si', $hash, $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Passwort-Update fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true, 'message'=>'Passwort erfolgreich geändert']);
    }

    if ($action === 'changeOwnPassword') {
        // Jeder eingeloggte Benutzer kann sein eigenes Passwort ändern
        require_fields($body, ['currentPassword', 'newPassword']);
        
        // Aktuellen Benutzer und sein Passwort abrufen
        $stmt = $mysqli->prepare("SELECT password_hash FROM users WHERE id = ? LIMIT 1");
        $stmt->bind_param('i', $currentUserId);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        if (!$user) {
            json_out(['success'=>false, 'error'=>'Benutzer nicht gefunden'], 404);
        }
        
        // Aktuelles Passwort prüfen
        if (!password_verify($body['currentPassword'], $user['password_hash'])) {
            json_out(['success'=>false, 'error'=>'Aktuelles Passwort ist falsch'], 401);
        }
        
        // Neues Passwort hashen und speichern
        if (empty($body['newPassword']) || $body['newPassword'] === '') {
            json_out(['success'=>false, 'error'=>'Passwort darf nicht leer sein'], 400);
        }
        
        // Prüfe dass Passwort nicht bereits ein Hash ist
        if (preg_match('/^\$2[ayb]\$/', $body['newPassword'])) {
            json_out(['success'=>false, 'error'=>'Ungültiges Passwort-Format'], 400);
        }
        
        $hash = password_hash($body['newPassword'], PASSWORD_BCRYPT);
        
        if (!$hash || strlen($hash) === 0) {
            json_out(['success'=>false, 'error'=>'Passwort-Hash konnte nicht generiert werden'], 500);
        }
        
        // NUR password_hash Feld updaten, sonst nichts
        $updateStmt = $mysqli->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->bind_param('si', $hash, $currentUserId);
        if (!$updateStmt->execute()) {
            json_out(['success'=>false, 'error'=>'Passwort-Update fehlgeschlagen'], 500);
        }
        json_out(['success'=>true, 'message'=>'Passwort erfolgreich geändert']);
    }

    json_out(['success'=>false, 'error'=>'Unbekannte Aktion'], 400);
}

// PUT für Profil-Updates
if ($method === 'PUT') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : '';
    
    if ($action === 'updateProfile') {
        // Jeder eingeloggte Benutzer kann sein eigenes Profil aktualisieren
        $firstName = isset($body['firstName']) ? trim($body['firstName']) : '';
        $lastName = isset($body['lastName']) ? trim($body['lastName']) : '';
        $email = isset($body['email']) ? trim($body['email']) : '';
        $phone = isset($body['phone']) ? trim($body['phone']) : '';
        $school = isset($body['school']) ? trim($body['school']) : '';
        $beltLevel = isset($body['beltLevel']) ? trim($body['beltLevel']) : '';
        
        // Name zusammensetzen
        $name = trim($firstName . ' ' . $lastName);
        
        // E-Mail-Validierung
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_out(['success'=>false, 'error'=>'Ungültige E-Mail-Adresse'], 400);
        }
        
        // Grade-ID aus dem Namen ermitteln
        $gradeId = null;
        if ($beltLevel) {
            $gradeStmt = $mysqli->prepare("SELECT id FROM grade WHERE name = ? LIMIT 1");
            $gradeStmt->bind_param('s', $beltLevel);
            $gradeStmt->execute();
            $gradeRes = $gradeStmt->get_result()->fetch_assoc();
            if ($gradeRes) {
                $gradeId = (int)$gradeRes['id'];
            }
        }
        
        $stmt = $mysqli->prepare("UPDATE users SET first_name=?, last_name=?, name=?, email=?, phone=?, school=?, grade_id=? WHERE id=?");
        $stmt->bind_param('ssssssis', $firstName, $lastName, $name, $email, $phone, $school, $gradeId, $currentUserId);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Profil-Update fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true, 'message'=>'Profil erfolgreich aktualisiert']);
    }
    
    json_out(['success'=>false, 'error'=>'Unbekannte Aktion'], 400);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST/PUT erlaubt'], 405);
?>