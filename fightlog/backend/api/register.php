<?php
// backend/api/register.php
require_once __DIR__ . '/../db/config.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success'=>false, 'error'=>'Nur POST erlaubt'], 405);
}
$body = read_json_body();
require_fields($body, ['username','email','password','firstName','lastName','phone']);

// Standardrolle: schueler
$role = 'schueler';
$name = trim($body['firstName'].' '.$body['lastName']);
$school = isset($body['school']) ? $body['school'] : 'Kampfsport Akademie Berlin';
$belt = isset($body['beltLevel']) ? $body['beltLevel'] : 'Weißgurt';

// In Produktion: $hash = password_hash($body['password'], PASSWORD_BCRYPT);
$hash = '$2y$10$dummyhash';

$stmt = $mysqli->prepare("INSERT INTO users (username, email, password_hash, role, name, first_name, last_name, school, belt_level, verified_trainer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
$stmt->bind_param('sssssssss', $body['username'], $body['email'], $hash, $role, $name, $body['firstName'], $body['lastName'], $school, $belt);

if (!$stmt->execute()) {
    json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
}
json_out(['success'=>true, 'id'=>$stmt->insert_id]);
?>
