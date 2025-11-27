<?php
// backend/api/users.php
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $res = $mysqli->query("SELECT id, username, email, role, name, first_name as firstName, last_name as lastName, school, belt_level as beltLevel, verified_trainer as verifiedTrainer FROM users ORDER BY id ASC");
    $list = [];
    while ($row = $res->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['verifiedTrainer'] = (bool)$row['verifiedTrainer'];
        $row['permissions'] = []; // optional: Rechte extra nachladen
        $row['phone'] = null; // Spalte nicht vorhanden – für UI-Kompatibilität
        $row['passkeys'] = [];
        $list[] = $row;
    }
    json_out($list);
}

if ($method === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : 'update';

    if ($action === 'update') {
        require_fields($body, ['id','role']);
        $verified = isset($body['verifiedTrainer']) ? (int)!!$body['verifiedTrainer'] : 0;
        $name = isset($body['name']) ? $body['name'] : '';
        $first = isset($body['firstName']) ? $body['firstName'] : null;
        $last  = isset($body['lastName']) ? $body['lastName'] : null;
        $email = isset($body['email']) ? $body['email'] : null;
        $role  = $body['role'];
        $stmt = $mysqli->prepare("UPDATE users SET role=?, verified_trainer=?, name=?, first_name=?, last_name=?, email=? WHERE id=?");
        $stmt->bind_param('sissssi', $role, $verified, $name, $first, $last, $email, $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Update fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true]);
    }

    if ($action === 'verify') {
        require_fields($body, ['id']);
        $stmt = $mysqli->prepare("UPDATE users SET role='trainer', verified_trainer=1 WHERE id=?");
        $stmt->bind_param('i', $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Verify fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true]);
    }

    if ($action === 'delete') {
        require_fields($body, ['id']);
        $stmt = $mysqli->prepare("DELETE FROM users WHERE id=?");
        $stmt->bind_param('i', $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Delete fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true]);
    }

    json_out(['success'=>false, 'error'=>'Unbekannte Aktion'], 400);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST erlaubt'], 405);
?>
