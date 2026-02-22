<?php
// Generiert Passwort-Hashes für die Test-Benutzer
$passwords = [
    'admin' => 'admin123',
    'trainer' => 'trainer123',
    'schueler' => 'schueler123',
    'paul' => 'test123',
    'paula' => 'test123',
    'patrick' => 'test123',
    'peter' => 'test123',
    'sophia' => 'test123'
];

echo "-- Passwort-Hashes für Test-Benutzer\n";
echo "-- Generiert am: " . date('Y-m-d H:i:s') . "\n\n";

foreach ($passwords as $username => $password) {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    echo "-- Username: $username, Passwort: $password\n";
    echo "UPDATE users SET password_hash = '$hash' WHERE username = '$username';\n\n";
}

