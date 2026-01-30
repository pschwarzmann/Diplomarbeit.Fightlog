<?php
// backend/api/diagnose-passwords.php
// Temporäres Diagnose-Skript für Passwort-Probleme (NUR FÜR ENTWICKLUNG!)
// WICHTIG: Nach dem Debug löschen!

ob_start();
require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();

$result = [
    'timestamp' => date('Y-m-d H:i:s'),
    'users_checked' => []
];

// Lade alle User (ohne Passwörter zu loggen)
$usersResult = $mysqli->query("SELECT id, username, email, role, password_hash FROM users ORDER BY id LIMIT 20");

if ($usersResult) {
    while ($user = $usersResult->fetch_assoc()) {
        $hash = $user['password_hash'];
        
        $diagnosis = [
            'user_id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'hash_exists' => !empty($hash),
            'hash_length' => strlen($hash ?? ''),
            'hash_prefix' => substr($hash ?? '', 0, 7),
            'is_bcrypt' => strpos($hash ?? '', '$2y$') === 0 || strpos($hash ?? '', '$2a$') === 0 || strpos($hash ?? '', '$2b$') === 0,
            'is_valid_format' => preg_match('/^\$2[ayb]\$[0-9]{2}\$/', $hash ?? '') === 1,
            'needs_rehash' => $hash ? password_needs_rehash($hash, PASSWORD_BCRYPT) : null
        ];
        
        $result['users_checked'][] = $diagnosis;
    }
}

ob_clean();
json_out($result);
?>
