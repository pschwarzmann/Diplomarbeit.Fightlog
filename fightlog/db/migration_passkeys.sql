-- Migration: Passkey/WebAuthn Tabellen hinzufügen
-- Führe dieses Skript nur aus, wenn die Tabellen noch nicht existieren
-- Prüfe zuerst: SHOW TABLES LIKE 'passkeys';

-- Passkeys/WebAuthn Credentials Tabelle
CREATE TABLE IF NOT EXISTS passkeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INT UNSIGNED DEFAULT 0,
    transports VARCHAR(100) NULL,
    friendly_name VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_passkeys_user_id (user_id),
    INDEX idx_passkeys_credential_id (credential_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Passkey Challenges (temporär für WebAuthn)
CREATE TABLE IF NOT EXISTS passkey_challenges (
    user_id INT NOT NULL,
    challenge VARCHAR(255) NOT NULL,
    type ENUM('register', 'authenticate') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, type),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_challenges_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
