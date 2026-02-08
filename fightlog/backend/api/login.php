<?php
// Login-API
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success'=>false, 'error'=>'Nur POST erlaubt'], 405);
}

$body = read_json_body();

if (!is_array($body)) {
    json_out(['success'=>false, 'error'=>'Ungültiger Request-Body'], 400);
}

$identifier = trim($body['identifier'] ?? $body['username'] ?? '');
$password = $body['password'] ?? '';

// Prüfe ob Identifier und Passwort vorhanden sind
if (empty($identifier)) {
    json_out(['success'=>false, 'error'=>'Login-Daten ungültig'], 401);
}

// Rate-Limiting prüfen
if (!Security::checkLoginRateLimit($identifier, $mysqli)) {
    $remaining = Security::getRemainingLockoutTime($identifier, $mysqli);
    $minutes = ceil($remaining / 60);
    json_out([
        'success' => false, 
        'error' => "Zu viele Login-Versuche. Bitte warte {$minutes} Minute(n).",
        'lockout_seconds' => $remaining
    ], 429);
}

// Passwort darf nicht leer sein, aber auch nicht getrimmt werden
if ($password === '' || $password === null) {
    Security::logLoginAttempt($identifier, false, $mysqli);
    json_out(['success'=>false, 'error'=>'Login-Daten ungültig'], 401);
}

// Bestimme ob Identifier eine Email ist
$isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;

// Datenbankabfrage: Benutzer anhand Username ODER Email finden (case-insensitive)
if ($isEmail) {
    // Suche nach Email (case-insensitive)
    $stmt = $mysqli->prepare("SELECT u.id, u.username, u.email, u.role, u.password_hash, u.first_name, u.last_name, u.phone, u.school, u.grade_id, g.name as belt_level FROM users u LEFT JOIN grade g ON u.grade_id = g.id WHERE LOWER(u.email) = LOWER(?) LIMIT 1");
    if (!$stmt) {
        json_out(['success'=>false, 'error'=>'Datenbankfehler beim Login'], 500);
    }
    $stmt->bind_param('s', $identifier);
} else {
    // Suche nach Username (case-insensitive)
    $stmt = $mysqli->prepare("SELECT u.id, u.username, u.email, u.role, u.password_hash, u.first_name, u.last_name, u.phone, u.school, u.grade_id, g.name as belt_level FROM users u LEFT JOIN grade g ON u.grade_id = g.id WHERE LOWER(u.username) = LOWER(?) LIMIT 1");
    if (!$stmt) {
        json_out(['success'=>false, 'error'=>'Datenbankfehler beim Login'], 500);
    }
    $stmt->bind_param('s', $identifier);
}

if (!$stmt->execute()) {
    json_out(['success'=>false, 'error'=>'Datenbankfehler beim Login'], 500);
}

$res = $stmt->get_result();
$user = $res->fetch_assoc();

if (!$user) {
    // Login-Versuch protokollieren
    Security::logLoginAttempt($identifier, false, $mysqli);
    // Allgemeine Fehlermeldung
    json_out(['success'=>false, 'error'=>'Login-Daten ungültig'], 401);
}

// Prüfe ob password_hash Feld existiert und nicht leer ist
if (empty($user['password_hash']) || !is_string($user['password_hash']) || strlen($user['password_hash']) < 10) {
    // Login-Versuch protokollieren
    Security::logLoginAttempt($identifier, false, $mysqli);
    // Hash-Feld ist leer oder ungültig
    json_out(['success'=>false, 'error'=>'Login-Daten ungültig'], 401);
}

// Passwort-Verifizierung mit password_verify
$passwordVerified = password_verify($password, $user['password_hash']);

if (!$passwordVerified) {
    // Login-Versuch protokollieren
    Security::logLoginAttempt($identifier, false, $mysqli);
    // Allgemeine Fehlermeldung
    json_out(['success'=>false, 'error'=>'Login-Daten ungültig'], 401);
}

// Login-Versuch protokollieren (erfolgreich)
Security::logLoginAttempt($identifier, true, $mysqli);

// Hash-Upgrade
if ($passwordVerified && password_needs_rehash($user['password_hash'], PASSWORD_BCRYPT)) {
    // Zusätzliche Sicherheit: Prüfe dass Passwort wirklich nicht leer ist
    if ($password !== '' && $password !== null && strlen($password) > 0) {
        $newHash = password_hash($password, PASSWORD_BCRYPT);
        
        // Prüfe ob Hash erfolgreich generiert wurde
        if ($newHash && strlen($newHash) > 0 && strpos($newHash, '$2y$') === 0) {
            // Verifiziere dass der neue Hash mit dem Passwort funktioniert
            if (password_verify($password, $newHash)) {
                // NUR password_hash Feld updaten
                $updateStmt = $mysqli->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
                if ($updateStmt) {
                    $updateStmt->bind_param('si', $newHash, $user['id']);
                    $updateStmt->execute();
                    // Fehler beim Update ignorieren
                }
            }
        }
    }
}

// Session-Token erstellen
$token = null;
$sessionsCheck = @$mysqli->query("SHOW TABLES LIKE 'sessions'");
if ($sessionsCheck && $sessionsCheck->num_rows > 0) {
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    // Alte Sessions des Users löschen
    $deleteStmt = $mysqli->prepare("DELETE FROM sessions WHERE user_id = ?");
    if ($deleteStmt) {
        $deleteStmt->bind_param('i', $user['id']);
        $deleteStmt->execute();
    }
    
    // Neue Session speichern
    $sessionStmt = $mysqli->prepare("INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())");
    if ($sessionStmt) {
        $sessionStmt->bind_param('iss', $user['id'], $token, $expiresAt);
        $sessionStmt->execute();
        // Fehler beim Session-Speichern ignorieren
    }
}

// Berechtigungen des Users laden
try {
    $permissions = PermissionService::getUserPermissions($mysqli, (int)$user['id']);
} catch (Exception $e) {
    $permissions = [];
}

// Login erfolgreich - Benutzerdaten zurückgeben
$response = [
    'success' => true,
    'user' => [
        'id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role' => $user['role'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'phone' => $user['phone'],
        'school' => $user['school'],
        'beltLevel' => $user['belt_level'],
        'permissions' => $permissions
    ]
];

if ($token) {
    $response['token'] = $token;
}

json_out($response);
?>
