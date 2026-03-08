-- Datenbank erstellen
CREATE DATABASE IF NOT EXISTS fightlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fightlog;

-- Grade-Tabelle (Gürtelgrade / Stufen)
CREATE TABLE IF NOT EXISTS grade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    color VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benutzer-Tabelle
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'schueler',
        'trainer',
        'admin'
    ) NOT NULL DEFAULT 'schueler',
    name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    school VARCHAR(100),
    grade_id INT NULL,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grade (id)
);

-- Benutzerrechte-Tabelle
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(150) NOT NULL
);

-- Rollen-Berechtigungen Mapping-Tabelle
CREATE TABLE IF NOT EXISTS role_permissions (
    role ENUM(
        'schueler',
        'trainer',
        'admin'
    ) NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role, permission_id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
);


-- Prüfungen-Tabelle
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    grade_id INT NULL,
    category VARCHAR(50) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    comments TEXT,
    status ENUM('passed', 'failed', 'pending') DEFAULT 'passed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (grade_id) REFERENCES grade (id)
);

-- Urkunden-Tabelle
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    exam_id INT NULL,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    grade_id INT NULL,
    instructor VARCHAR(100),
    category VARCHAR(50),
    is_manual TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (exam_id) REFERENCES exams (id),
    FOREIGN KEY (grade_id) REFERENCES grade (id)
);

-- System-Einstellungen-Tabelle
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kurse-Tabelle
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    duration VARCHAR(50) NOT NULL,
    max_participants INT NOT NULL,
    current_participants INT DEFAULT 0,
    price VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Kursbuchungen-Tabelle
CREATE TABLE IF NOT EXISTS course_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM(
        'confirmed',
        'pending',
        'cancelled'
    ) DEFAULT 'pending',
    FOREIGN KEY (course_id) REFERENCES courses (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Sessions-Tabelle für Login-Management
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Passkey Challenges
CREATE TABLE IF NOT EXISTS passkey_challenges (
    user_id INT NOT NULL,
    challenge VARCHAR(255) NOT NULL,
    type ENUM('register', 'authenticate') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, type),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_challenges_expires (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Login-Versuche für Rate-Limiting
CREATE TABLE IF NOT EXISTS login_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    identifier_hash VARCHAR(64) NOT NULL,
    success TINYINT(1) NOT NULL DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_ip (ip_address),
    INDEX idx_login_attempts_identifier (identifier_hash),
    INDEX idx_login_attempts_time (attempted_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Gruppen-Tabelle
CREATE TABLE IF NOT EXISTS student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Zuordnung Gruppe <-> Benutzer
CREATE TABLE IF NOT EXISTS group_members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES student_groups (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Ziele-Tabelle
CREATE TABLE IF NOT EXISTS goal_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    definition TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unterziele der Templates
CREATE TABLE IF NOT EXISTS goal_template_subtasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    definition VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES goal_templates (id)
);

-- Zugewiesene Ziele pro User
CREATE TABLE IF NOT EXISTS user_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT NOT NULL,
    target_date DATE NULL,
    status ENUM(
        'in_progress',
        'completed',
        'cancelled'
    ) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (template_id) REFERENCES goal_templates (id)
);

-- Fortschritt bei Unterzielen
CREATE TABLE IF NOT EXISTS user_goal_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_goal_id INT NOT NULL,
    subtask_id INT NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_goal_id) REFERENCES user_goals (id),
    FOREIGN KEY (subtask_id) REFERENCES goal_template_subtasks (id),
    UNIQUE KEY unique_progress (user_goal_id, subtask_id)
);

-- Audit-Log-Tabelle für Sicherheitsprotokollierung
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id INT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);



-- Indizes für Gruppen
CREATE INDEX idx_groups_created_by ON student_groups (created_by);

CREATE INDEX idx_group_members_user ON group_members (user_id);

-- Indizes für bessere Performance
CREATE INDEX idx_certificates_user_id ON certificates (user_id);

CREATE INDEX idx_certificates_date ON certificates (date);

CREATE INDEX idx_certificates_grade ON certificates (grade_id);

CREATE INDEX idx_exams_user_id ON exams (user_id);

CREATE INDEX idx_exams_date ON exams (date);

CREATE INDEX idx_exams_grade ON exams (grade_id);

CREATE INDEX idx_users_grade ON users (grade_id);

CREATE INDEX idx_sessions_token ON sessions (token);

CREATE INDEX idx_sessions_expires ON sessions (expires_at);

CREATE INDEX idx_users_first_name ON users (first_name);

CREATE INDEX idx_users_last_name ON users (last_name);

-- Indizes für Ziele-System
CREATE INDEX idx_goal_templates_category ON goal_templates (category);

CREATE INDEX idx_goal_subtasks_template ON goal_template_subtasks (template_id);

CREATE INDEX idx_user_goals_user ON user_goals (user_id);

CREATE INDEX idx_user_goals_template ON user_goals (template_id);

CREATE INDEX idx_user_goals_status ON user_goals (status);

CREATE INDEX idx_user_goals_target_date ON user_goals (target_date);

CREATE INDEX idx_user_goal_progress_goal ON user_goal_progress (user_goal_id);

CREATE INDEX idx_user_goal_progress_subtask ON user_goal_progress (subtask_id);



-- Basisrechte
INSERT INTO
    permissions (`key`, label)
VALUES
    -- Benutzer-Berechtigungen
    (
        'manage_users',
        'Benutzer verwalten'
    ),
    (
        'view_all_users',
        'Alle Benutzer einsehen'
    ),
    -- Daten-Berechtigungen
    (
        'view_own_data',
        'Eigene Daten einsehen'
    ),
    (
        'view_all_data',
        'Alle Daten einsehen'
    ),
    (
        'edit_own_data',
        'Eigene Daten bearbeiten'
    ),
    (
        'edit_all_data',
        'Alle Daten bearbeiten'
    ),
    -- Urkunden-Berechtigungen
    (
        'view_own_certificates',
        'Eigene Urkunden einsehen'
    ),
    (
        'view_all_certificates',
        'Alle Urkunden einsehen'
    ),
    (
        'create_certificates',
        'Urkunden erstellen'
    ),
    (
        'edit_own_certificates',
        'Eigene Urkunden bearbeiten'
    ),
    (
        'edit_all_certificates',
        'Alle Urkunden bearbeiten'
    ),
    (
        'delete_certificates',
        'Urkunden löschen'
    ),
    (
        'approve_certificates',
        'Urkunden freigeben'
    ),
    -- Prüfungen-Berechtigungen
    (
        'view_own_exams',
        'Eigene Prüfungen einsehen'
    ),
    (
        'view_all_exams',
        'Alle Prüfungen einsehen'
    ),
    (
        'create_exams',
        'Prüfungen erstellen'
    ),
    (
        'edit_own_exams',
        'Eigene Prüfungen bearbeiten'
    ),
    (
        'edit_all_exams',
        'Alle Prüfungen bearbeiten'
    ),
    (
        'delete_exams',
        'Prüfungen löschen'
    ),
    -- Ziele-Berechtigungen
    (
        'view_own_goals',
        'Eigene Ziele einsehen'
    ),
    (
        'view_all_goals',
        'Alle Ziele einsehen'
    ),
    (
        'create_goals',
        'Ziele erstellen'
    ),
    (
        'edit_own_goals',
        'Eigene Ziele bearbeiten'
    ),
    (
        'edit_all_goals',
        'Alle Ziele bearbeiten'
    ),
    (
        'delete_goals',
        'Ziele löschen'
    ),
    -- Kurs-Berechtigungen
    (
        'view_courses',
        'Kurse einsehen'
    ),
    (
        'create_courses',
        'Kurse erstellen'
    ),
    (
        'edit_courses',
        'Kurse bearbeiten'
    ),
    (
        'delete_courses',
        'Kurse löschen'
    ),
    (
        'book_courses',
        'Kurse buchen'
    ),
    (
        'view_course_participants',
        'Kursteilnehmer einsehen'
    ),
    -- Gruppen-Berechtigungen
    (
        'manage_groups',
        'Schülergruppen verwalten'
    );


-- Schüler-Berechtigungen
INSERT INTO
    role_permissions (role, permission_id)
SELECT 'schueler', id
FROM permissions
WHERE
    `key` IN (
        'view_own_data',
        'edit_own_data',
        'view_own_certificates',
        'view_own_exams',
        'view_own_goals',
        'create_goals',
        'edit_own_goals',
        'delete_goals',
        'view_courses',
        'book_courses'
    );

-- Trainer-Berechtigungen
INSERT INTO
    role_permissions (role, permission_id)
SELECT 'trainer', id
FROM permissions
WHERE
    `key` IN (
        'view_own_data',
        'edit_own_data',
        'view_all_data',
        'view_own_certificates',
        'view_all_certificates',
        'create_certificates',
        'edit_own_certificates',
        'edit_all_certificates',
        'view_own_exams',
        'view_all_exams',
        'create_exams',
        'edit_own_exams',
        'edit_all_exams',
        'view_own_goals',
        'create_goals',
        'edit_own_goals',
        'view_courses',
        'create_courses',
        'edit_courses',
        'delete_courses',
        'book_courses',
        'view_course_participants',
        'manage_groups'
    );

-- Admin-Berechtigungen
INSERT INTO
    role_permissions (role, permission_id)
SELECT 'admin', id
FROM permissions;

-- Standard-Einstellungen für Urkunden
INSERT INTO
    app_settings (setting_key, setting_value)
VALUES ('password_min_length', '8'),
    (
        'certificate_title',
        'Urkunde'
    ),
    (
        'certificate_congratulation_text',
        'Herzlichen Glückwunsch!\n\nMit dieser Urkunde bestätigen wir, dass du die Prüfung erfolgreich bestanden hast.\n\nWir sind stolz auf deine Leistung und deinen Einsatz. Weiter so!'
    ),
    (
        'certificate_school_name',
        'Kampfsport Akademie'
    ),
    (
        'certificate_footer_text',
        'Diese Urkunde wurde automatisch erstellt.'
    );