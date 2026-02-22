<?php
// backend/config/database.php
// Zentrale Stellen für alle Datenbank-Einstellungen
// Lädt Werte aus Umgebungsvariablen (.env) mit Fallback-Defaults

require_once __DIR__ . '/../core/env.php';
Env::load();

return [
    'host' => Env::get('DB_HOST', '127.0.0.1'),
    'user' => Env::get('DB_USER', 'root'),
    'pass' => Env::get('DB_PASS', ''),
    'name' => Env::get('DB_NAME', 'fightlog'),
    'charset' => Env::get('DB_CHARSET', 'utf8mb4'),
];


