<?php
// Temporäres Skript zum Erstellen der login_attempts Tabelle
$mysqli = new mysqli('127.0.0.1', 'root', '', 'fightlog');
if ($mysqli->connect_error) { 
    die('DB Error: ' . $mysqli->connect_error); 
}

$sql = "CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    identifier_hash VARCHAR(64) NOT NULL,
    success TINYINT(1) NOT NULL DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_ip (ip_address),
    INDEX idx_login_attempts_identifier (identifier_hash),
    INDEX idx_login_attempts_time (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

if ($mysqli->query($sql)) { 
    echo "Table 'login_attempts' created successfully\n"; 
} else { 
    echo "Error: " . $mysqli->error . "\n"; 
}

$mysqli->close();
