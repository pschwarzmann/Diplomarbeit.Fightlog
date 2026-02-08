<?php
// Register-API
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

// Berechtigungsprüfung
require_permission($mysqli, 'manage_users');

// Prüfe, ob Username bereits existiert
$checkStmt = $mysqli->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
$checkStmt->bind_param('ss', $body['username'], $body['email']);
$checkStmt->execute();
$existing = $checkStmt->get_result()->fetch_assoc();
if ($existing) {
    json_out(['success'=>false, 'error'=>'Benutzername oder E-Mail bereits vorhanden'], 400);
}

// Rolle aus Request
$role = isset($body['role']) && in_array($body['role'], ['schueler', 'trainer', 'admin']) 
    ? $body['role'] 
    : 'schueler';

$name = trim($body['firstName'].' '.$body['lastName']);
$school = isset($body['school']) && $body['school'] !== '' ? $body['school'] : null;
$beltLevelName = isset($body['beltLevel']) && $body['beltLevel'] !== '' ? $body['beltLevel'] : null;
$phone = isset($body['phone']) && $body['phone'] !== '' ? $body['phone'] : null;
$verifiedTrainer = isset($body['verifiedTrainer']) ? (int)!!$body['verifiedTrainer'] : 0;

// E-Mail Validierung
if (!filter_var($body['email'], FILTER_VALIDATE_EMAIL)) {
    json_out(['success'=>false, 'error'=>'Ungültige E-Mail-Adresse'], 400);
}

// Passwort sicher hashen
if (empty($body['password']) || $body['password'] === '') {
    json_out(['success'=>false, 'error'=>'Passwort darf nicht leer sein'], 400);
}

// Prüfe dass Passwort nicht bereits ein Hash ist
if (preg_match('/^\$2[ayb]\$/', $body['password'])) {
    json_out(['success'=>false, 'error'=>'Ungültiges Passwort-Format'], 400);
}

$hash = password_hash($body['password'], PASSWORD_BCRYPT);

// Verifiziere dass Hash erfolgreich generiert wurde
if (!$hash || strlen($hash) === 0) {
    json_out(['success'=>false, 'error'=>'Passwort-Hash konnte nicht generiert werden'], 500);
}

// Grade-ID aus dem Namen ermitteln
$gradeId = null;
if ($beltLevelName) {
    $gradeStmt = $mysqli->prepare("SELECT id FROM grade WHERE name = ? LIMIT 1");
    $gradeStmt->bind_param('s', $beltLevelName);
    $gradeStmt->execute();
    $gradeRes = $gradeStmt->get_result()->fetch_assoc();
    if ($gradeRes) {
        $gradeId = (int)$gradeRes['id'];
    }
}

$stmt = $mysqli->prepare("INSERT INTO users (username, email, password_hash, role, name, first_name, last_name, phone, school, grade_id, verified_trainer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param('sssssssssis', $body['username'], $body['email'], $hash, $role, $name, $body['firstName'], $body['lastName'], $phone, $school, $gradeId, $verifiedTrainer);

if (!$stmt->execute()) {
    json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
}

$newUserId = $stmt->insert_id;

// Automatisch Berechtigungen der Rolle zuweisen
PermissionService::assignRolePermissions($mysqli, $newUserId, $role);

json_out(['success'=>true, 'id'=>$newUserId]);
?>
