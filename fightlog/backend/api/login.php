<?php
// backend/api/login.php
// Datenbankbasierter Login mit Passwort-Verifizierung
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success'=>false, 'error'=>'Nur POST erlaubt'], 405);
}
$body = read_json_body();
require_fields($body, ['username','password']);

// Datenbankabfrage: Benutzer anhand Username finden
$stmt = $mysqli->prepare("SELECT id, username, email, role, password_hash, first_name, last_name, phone, school, belt_level FROM users WHERE username = ? LIMIT 1");
$stmt->bind_param('s', $body['username']);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();

if (!$user) {
    json_out(['success'=>false, 'error'=>'Unbekannter Benutzer'], 401);
}

// Passwort-Verifizierung mit password_verify
if (!password_verify($body['password'], $user['password_hash'])) {
    json_out(['success'=>false, 'error'=>'Falsches Passwort'], 401);
}

// Berechtigungen des Users laden
$permissions = PermissionService::getUserPermissions($mysqli, (int)$user['id']);

// Login erfolgreich - Benutzerdaten zurückgeben
json_out(['success'=>true,'user'=>[
    'id'=>(int)$user['id'],
    'username'=>$user['username'],
    'email'=>$user['email'],
    'role'=>$user['role'],
    'firstName'=>$user['first_name'],
    'lastName'=>$user['last_name'],
    'phone'=>$user['phone'],
    'school'=>$user['school'],
    'beltLevel'=>$user['belt_level'],
    'permissions'=>$permissions
]]);
?>
