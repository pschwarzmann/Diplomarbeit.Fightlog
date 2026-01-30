<?php
// backend/api/test-login-all-users.php
// Temporäres Test-Skript: Prüft Login für alle User (NUR FÜR ENTWICKLUNG!)
// WICHTIG: Nach dem Debug löschen!
// 
// Verwendung: POST mit {"testPassword": "test123"} um zu prüfen welche User sich mit diesem Passwort einloggen können

ob_start();
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

$body = read_json_body();
$testPassword = $body['testPassword'] ?? null;

if (!$testPassword) {
    json_out(['error' => 'testPassword muss angegeben werden'], 400);
}

$result = [
    'test_password_length' => strlen($testPassword),
    'users_tested' => []
];

// Lade alle User
$usersResult = $mysqli->query("SELECT id, username, email, role, password_hash FROM users ORDER BY id LIMIT 50");

if ($usersResult) {
    while ($user = $usersResult->fetch_assoc()) {
        $hash = $user['password_hash'];
        
        // Prüfe Hash-Format
        $hashValid = !empty($hash) && is_string($hash) && strlen($hash) >= 10;
        $isBcrypt = $hashValid && (strpos($hash, '$2y$') === 0 || strpos($hash, '$2a$') === 0 || strpos($hash, '$2b$') === 0);
        
        // Test password_verify
        $verifyResult = false;
        if ($hashValid) {
            $verifyResult = password_verify($testPassword, $hash);
        }
        
        // Prüfe ob Rehash nötig wäre
        $needsRehash = false;
        if ($hashValid && $verifyResult) {
            $needsRehash = password_needs_rehash($hash, PASSWORD_BCRYPT);
        }
        
        $result['users_tested'][] = [
            'user_id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'hash_exists' => $hashValid,
            'hash_is_bcrypt' => $isBcrypt,
            'password_verify_result' => $verifyResult,
            'needs_rehash' => $needsRehash,
            'hash_prefix' => substr($hash ?? '', 0, 7)
        ];
    }
}

ob_clean();
json_out($result);
?>
