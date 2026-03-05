<?php
// Passkey-Login (WebAuthn) – separater Endpoint nur für Anmeldung
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Nur POST erlaubt', 405);
}

$body = read_json_body();
if (!is_array($body)) {
    json_error('Ungültiger Request-Body', 400);
}

$action = $body['action'] ?? '';

/**
 * Hilfsfunktion: Benutzer anhand Identifier (Username oder E‑Mail) finden
 * Gibt assoziatives Array wie in login.php zurück oder null.
 */
function find_user_by_identifier(mysqli $mysqli, string $identifier): ?array
{
    $identifier = trim($identifier);
    if ($identifier == '') {
        return null;
    }

    $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL) !== false;

    if ($isEmail) {
        $stmt = $mysqli->prepare("SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.phone, u.school, u.grade_id, g.name as belt_level FROM users u LEFT JOIN grade g ON u.grade_id = g.id WHERE LOWER(u.email) = LOWER(?) LIMIT 1");
    } else {
        $stmt = $mysqli->prepare("SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.phone, u.school, u.grade_id, g.name as belt_level FROM users u LEFT JOIN grade g ON u.grade_id = g.id WHERE LOWER(u.username) = LOWER(?) LIMIT 1");
    }

    if (!$stmt) {
        json_error('Datenbankfehler beim Login', 500);
    }

    $stmt->bind_param('s', $identifier);
    if (!$stmt->execute()) {
        json_error('Datenbankfehler beim Login', 500);
    }

    $res = $stmt->get_result();
    $user = $res->fetch_assoc() ?: null;
    $res->free();
    $stmt->close();

    return $user ?: null;
}

/**
 * Hilfsfunktion: Session-Token für User erstellen (übernimmt Logik aus login.php)
 * Gibt Raw-Token oder null zurück.
 */
function create_session_token_for_user(mysqli $mysqli, int $userId): ?string
{
    $sessionsCheck = @$mysqli->query("SHOW TABLES LIKE 'sessions'");
    if (!$sessionsCheck || $sessionsCheck->num_rows === 0) {
        if ($sessionsCheck instanceof mysqli_result) {
            $sessionsCheck->free();
        }
        error_log('[FightLog] Sessions-Tabelle nicht gefunden');
        return null;
    }

    $sessionsCheck->free();

    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

    // Alte Sessions des Users löschen
    $deleteStmt = $mysqli->prepare("DELETE FROM sessions WHERE user_id = ?");
    if ($deleteStmt) {
        $deleteStmt->bind_param('i', $userId);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    // Neue Session speichern (nur Hash, nicht Klartext-Token)
    $sessionStmt = $mysqli->prepare("INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)");
    if (!$sessionStmt) {
        error_log('[FightLog] Session INSERT prepare fehlgeschlagen: ' . $mysqli->error);
        return null;
    }

    $sessionStmt->bind_param('iss', $userId, $tokenHash, $expiresAt);
    $insertOk = $sessionStmt->execute();

    if (!$insertOk || $sessionStmt->affected_rows !== 1) {
        error_log('[FightLog] Session INSERT fehlgeschlagen: ' . ($sessionStmt->error ?: 'affected_rows=' . $sessionStmt->affected_rows));
        $sessionStmt->close();
        return null;
    }

    $sessionStmt->close();
    return $rawToken;
}

if ($action === 'login_begin') {
    require_fields($body, ['identifier']);

    $identifier = trim((string)$body['identifier']);
    if ($identifier === '') {
        json_error('Login-Daten ungültig', 401);
    }

    // Rate-Limiting analog zu login.php
    if (!Security::checkLoginRateLimit($identifier, $mysqli)) {
        $remaining = Security::getRemainingLockoutTime($identifier, $mysqli);
        $minutes = ceil($remaining / 60);
        json_out([
            'success' => false,
            'error' => "Zu viele Login-Versuche. Bitte warte {$minutes} Minute(n).",
            'lockout_seconds' => $remaining
        ], 429);
    }

    $user = find_user_by_identifier($mysqli, $identifier);
    if (!$user) {
        Security::logLoginAttempt($identifier, false, $mysqli);
        json_error('Login-Daten ungültig', 401);
    }

    // Tabellen prüfen
    $passkeysTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkeys'");
    $challengesTableCheck = @$mysqli->query("SHOW TABLES LIKE 'passkey_challenges'");
    if (
        !$passkeysTableCheck || $passkeysTableCheck->num_rows === 0 ||
        !$challengesTableCheck || $challengesTableCheck->num_rows === 0
    ) {
        if ($passkeysTableCheck instanceof mysqli_result) {
            $passkeysTableCheck->free();
        }
        if ($challengesTableCheck instanceof mysqli_result) {
            $challengesTableCheck->free();
        }
        json_error('Passkey-System nicht verfügbar', 503);
    }
    $passkeysTableCheck->free();
    $challengesTableCheck->free();

    $userId = (int)$user['id'];

    // Passkeys des Users laden
    $stmt = $mysqli->prepare("SELECT credential_id, transports FROM passkeys WHERE user_id = ?");
    if (!$stmt) {
        json_error('Datenbankfehler', 500);
    }
    $stmt->bind_param('i', $userId);
    if (!$stmt->execute()) {
        json_error('Datenbankfehler', 500);
    }

    $res = $stmt->get_result();
    $allowCredentials = [];
    while ($row = $res->fetch_assoc()) {
        $allowCredentials[] = [
            'id' => $row['credential_id'], // base64-codierte Credential-ID
            'type' => 'public-key',
            'transports' => $row['transports'] ? explode(',', $row['transports']) : ['internal', 'usb', 'nfc', 'ble']
        ];
    }
    $res->free();
    $stmt->close();

    if (empty($allowCredentials)) {
        Security::logLoginAttempt($identifier, false, $mysqli);
        json_error('Keine Passkeys für diesen Benutzer gefunden', 404);
    }

    // Challenge generieren und speichern
    $challengeHex = bin2hex(random_bytes(32));

    // Wichtig: type muss mit dem ENUM der Tabelle übereinstimmen ('register', 'authenticate')
    // Wir verwenden hier 'authenticate', da es sich um eine Authentifizierungs-Challenge handelt.
    $challengeStmt = $mysqli->prepare("INSERT INTO passkey_challenges (user_id, challenge, type, expires_at) VALUES (?, ?, 'authenticate', DATE_ADD(NOW(), INTERVAL 5 MINUTE)) ON DUPLICATE KEY UPDATE challenge = VALUES(challenge), expires_at = VALUES(expires_at)");
    if (!$challengeStmt) {
        json_error('Challenge konnte nicht gespeichert werden', 500);
    }
    $challengeStmt->bind_param('is', $userId, $challengeHex);
    if (!$challengeStmt->execute()) {
        $challengeStmt->close();
        json_error('Challenge konnte nicht gespeichert werden', 500);
    }
    $challengeStmt->close();

    // Relying Party ID bestimmen (wie in passkeys.php)
    $host = $_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? '';
    if ($host === '') {
        $host = Env::get('APP_DOMAIN', 'localhost');
    }
    $host = preg_replace('/:\d+$/', '', $host);

    json_out([
        'success' => true,
        'options' => [
            // Base64-kodierte Challenge; wird im Frontend in Bytes konvertiert
            'challenge' => base64_encode(hex2bin($challengeHex)),
            'rpId' => $host,
            'allowCredentials' => $allowCredentials,
            'timeout' => 60000,
            'userVerification' => 'preferred'
        ]
    ]);
}

if ($action === 'login_finish') {
    require_fields($body, ['credential', 'challenge']);

    $credential = $body['credential'];
    $credentialId = (string)($credential['id'] ?? '');
    if ($credentialId === '') {
        json_error('Ungültige Credential-ID', 400);
    }

    $challengeBin = base64_decode((string)$body['challenge'], true);
    if ($challengeBin === false) {
        json_error('Ungültige Challenge', 400);
    }
    $challengeHex = bin2hex($challengeBin);

    // Challenge-Eintrag suchen (Typ muss mit oben verwendeter ENUM-Variante übereinstimmen)
    $challengeStmt = $mysqli->prepare("SELECT user_id FROM passkey_challenges WHERE challenge = ? AND type = 'authenticate' AND expires_at > NOW()");
    if (!$challengeStmt) {
        json_error('Datenbankfehler', 500);
    }
    $challengeStmt->bind_param('s', $challengeHex);
    if (!$challengeStmt->execute()) {
        $challengeStmt->close();
        json_error('Datenbankfehler', 500);
    }
    $result = $challengeStmt->get_result();
    $row = $result->fetch_assoc();
    $result->free();
    $challengeStmt->close();

    if (!$row) {
        json_error('Ungültige oder abgelaufene Challenge', 400);
    }

    $userId = (int)$row['user_id'];

    // Passkey für diesen Benutzer und Credential-ID verifizieren
    $passkeyStmt = $mysqli->prepare("SELECT id FROM passkeys WHERE user_id = ? AND credential_id = ?");
    if (!$passkeyStmt) {
        json_error('Datenbankfehler', 500);
    }
    $passkeyStmt->bind_param('is', $userId, $credentialId);
    if (!$passkeyStmt->execute()) {
        $passkeyStmt->close();
        json_error('Datenbankfehler', 500);
    }
    $passkeyRes = $passkeyStmt->get_result();
    $passkey = $passkeyRes->fetch_assoc();
    $passkeyRes->free();
    $passkeyStmt->close();

    if (!$passkey) {
        json_error('Ungültiger Passkey', 401);
    }

    // sign_count / last_used_at aktualisieren (analog zu passkeys.php verifyAuth)
    $updateStmt = $mysqli->prepare("UPDATE passkeys SET sign_count = sign_count + 1, last_used_at = NOW() WHERE user_id = ? AND credential_id = ?");
    if ($updateStmt) {
        $updateStmt->bind_param('is', $userId, $credentialId);
        $updateStmt->execute();
        $updateStmt->close();
    }

    // Verwendete Challenge entfernen
    $deleteStmt = $mysqli->prepare("DELETE FROM passkey_challenges WHERE challenge = ? AND type = 'authenticate'");
    if ($deleteStmt) {
        $deleteStmt->bind_param('s', $challengeHex);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    // Benutzer laden (wie in login.php, aber nach ID)
    $userStmt = $mysqli->prepare("SELECT u.id, u.username, u.email, u.role, u.first_name, u.last_name, u.phone, u.school, u.grade_id, g.name as belt_level FROM users u LEFT JOIN grade g ON u.grade_id = g.id WHERE u.id = ? LIMIT 1");
    if (!$userStmt) {
        json_error('Datenbankfehler beim Login', 500);
    }
    $userStmt->bind_param('i', $userId);
    if (!$userStmt->execute()) {
        $userStmt->close();
        json_error('Datenbankfehler beim Login', 500);
    }
    $userRes = $userStmt->get_result();
    $user = $userRes->fetch_assoc();
    $userRes->free();
    $userStmt->close();

    if (!$user) {
        json_error('Benutzer nicht gefunden', 404);
    }

    // Session-Token erstellen
    $token = create_session_token_for_user($mysqli, $userId);

    // Berechtigungen laden
    try {
        $permissions = PermissionService::getUserPermissions($mysqli, $userId);
    } catch (Exception $e) {
        $permissions = [];
    }

    // Login-Versuch (erfolgreich) protokollieren
    $identifierForLog = $body['identifier'] ?? $user['username'] ?? null;
    if (is_string($identifierForLog) && $identifierForLog !== '') {
        Security::logLoginAttempt($identifierForLog, true, $mysqli);
    }
    AuditService::log($mysqli, 'login_success_passkey', $userId, null, null, [
        'auth_method' => 'passkey'
    ]);

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
}

json_error('Unbekannte Aktion', 400);
?>

