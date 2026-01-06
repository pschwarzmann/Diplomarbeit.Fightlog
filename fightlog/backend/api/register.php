<?php
// backend/api/register.php
// Benutzer-Registrierung (nur für Admin verfügbar)
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success'=>false, 'error'=>'Nur POST erlaubt'], 405);
}
$body = read_json_body();
require_fields($body, ['username','email','password','firstName','lastName']);

// Prüfe, ob der aufrufende Benutzer Admin ist
$currentUserId = auth_user_id($mysqli);
if (!$currentUserId) {
    json_out(['success'=>false, 'error'=>'Nicht authentifiziert'], 401);
}

$currentUserRole = auth_user_role($mysqli);
if ($currentUserRole !== 'admin') {
    json_out(['success'=>false, 'error'=>'Nur Administratoren können Benutzer erstellen'], 403);
}

// Prüfe, ob Username bereits existiert
$checkStmt = $mysqli->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
$checkStmt->bind_param('ss', $body['username'], $body['email']);
$checkStmt->execute();
$existing = $checkStmt->get_result()->fetch_assoc();
if ($existing) {
    json_out(['success'=>false, 'error'=>'Benutzername oder E-Mail bereits vorhanden'], 400);
}

// Rolle aus Request (Standard: schueler)
$role = isset($body['role']) && in_array($body['role'], ['schueler', 'trainer', 'admin']) 
    ? $body['role'] 
    : 'schueler';

$name = trim($body['firstName'].' '.$body['lastName']);
$school = isset($body['school']) ? $body['school'] : 'Kampfsport Akademie Berlin';
$belt = isset($body['beltLevel']) ? $body['beltLevel'] : 'Weißgurt';

// Passwort sicher hashen
$hash = password_hash($body['password'], PASSWORD_BCRYPT);

$stmt = $mysqli->prepare("INSERT INTO users (username, email, password_hash, role, name, first_name, last_name, school, belt_level, verified_trainer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
$stmt->bind_param('sssssssss', $body['username'], $body['email'], $hash, $role, $name, $body['firstName'], $body['lastName'], $school, $belt);

if (!$stmt->execute()) {
    json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
}
json_out(['success'=>true, 'id'=>$stmt->insert_id]);
?>
