-- ===== FIGHTLOG - DATENBANKSTRUKTUR =====
-- Backend-Entwickler: Diese SQL-Datei enthält alle benötigten Tabellen

-- Datenbank erstellen
CREATE DATABASE IF NOT EXISTS fightlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fightlog;

-- Grade-Tabelle (Gürtelgrade / Stufen)
CREATE TABLE grade (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INT DEFAULT 0,
    color VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard-Grade einfügen
INSERT INTO grade (name, sort_order, color) VALUES 
    ('Weißgurt', 1, '#FFFFFF'),
    ('Gelbgurt', 2, '#FFEB3B'),
    ('Orangegurt', 3, '#FF9800'),
    ('Grüngurt', 4, '#4CAF50'),
    ('Blaugurt', 5, '#2196F3'),
    ('Braungurt', 6, '#795548'),
    ('Schwarzgurt 1. Dan', 7, '#000000'),
    ('Schwarzgurt 2. Dan', 8, '#000000'),
    ('Schwarzgurt 3. Dan', 9, '#000000'),
    ('Schwarzgurt 4. Dan', 10, '#000000'),
    ('Schwarzgurt 5. Dan - Meister', 11, '#000000');

-- Benutzer-Tabelle
CREATE TABLE users (
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
    verified_trainer TINYINT(1) DEFAULT 0,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grade_id) REFERENCES grade (id)
);

-- Benutzerrechte-Tabelle
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `key` VARCHAR(100) UNIQUE NOT NULL,
    label VARCHAR(150) NOT NULL
);

-- Zuordnung Benutzer <-> Rechte
CREATE TABLE user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

-- Prüfungen-Tabelle (muss VOR certificates kommen wegen FK)
CREATE TABLE exams (
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

-- Urkunden-Tabelle (werden automatisch bei bestandenen Prüfungen erstellt)
CREATE TABLE certificates (
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
CREATE TABLE app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Standard-Einstellungen für Urkunden
INSERT INTO app_settings (setting_key, setting_value) VALUES
    ('certificate_title', 'Urkunde'),
    ('certificate_congratulation_text', 'Herzlichen Glückwunsch!\n\nMit dieser Urkunde bestätigen wir, dass du die Prüfung erfolgreich bestanden hast.\n\nWir sind stolz auf deine Leistung und deinen Einsatz. Weiter so!'),
    ('certificate_school_name', 'Kampfsport Akademie'),
    ('certificate_footer_text', 'Diese Urkunde wurde automatisch erstellt.');

-- Trainingsverlauf-Tabelle
CREATE TABLE training_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    duration INT NOT NULL, -- in Minuten
    type VARCHAR(100) NOT NULL,
    instructor VARCHAR(100),
    focus TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Kurse-Tabelle
CREATE TABLE courses (
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
CREATE TABLE course_bookings (
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
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Gruppen-Tabelle (für Schülergruppen)
CREATE TABLE student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);

-- Zuordnung Gruppe <-> Benutzer
CREATE TABLE group_members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES student_groups (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Ziele-Tabelle
CREATE TABLE goal_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    definition TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unterziele der Templates
CREATE TABLE goal_template_subtasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    definition VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES goal_templates (id)
);

-- Zugewiesene Ziele pro User
CREATE TABLE user_goals (
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
CREATE TABLE user_goal_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_goal_id INT NOT NULL,
    subtask_id INT NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_goal_id) REFERENCES user_goals (id),
    FOREIGN KEY (subtask_id) REFERENCES goal_template_subtasks (id),
    UNIQUE KEY unique_progress (user_goal_id, subtask_id)
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

CREATE INDEX idx_training_user_id ON training_history (user_id);

CREATE INDEX idx_training_date ON training_history (date);

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

-- Beispiel-Daten (optional)
-- WICHTIG: Die Passwort-Hashes werden nach dem INSERT mit UPDATE-Statements gesetzt
-- Standard-Passwörter: admin123, trainer123, schueler123, test123 (für alle anderen)
INSERT INTO
    users (
        username,
        email,
        password_hash,
        role,
        name,
        first_name,
        last_name,
        phone,
        school,
        grade_id,
        verified_trainer
    )
VALUES (
        'admin',
        'admin@fightlog.com',
        '$2y$10$dummyhash',
        'admin',
        'Admin Trainer',
        'Admin',
        'Trainer',
        '+49 30 12345678',
        'Kampfsport Akademie Berlin',
        11,
        1
    ),
    (
        'trainer',
        'trainer@fightlog.com',
        '$2y$10$dummyhash',
        'trainer',
        'Tom Trainer',
        'Tom',
        'Trainer',
        '+49 30 87654321',
        'Kampfsport Akademie Berlin',
        8,
        1
    ),
    (
        'schueler',
        'schueler@fightlog.com',
        '$2y$10$dummyhash',
        'schueler',
        'Sam Schüler',
        'Sam',
        'Schüler',
        '+49 151 11111111',
        'Kampfsport Akademie Berlin',
        2,
        0
    ),
    (
        'paul',
        'paul.schwarzmann@fightlog.com',
        '$2y$10$dummyhash',
        'schueler',
        'Paul Schwarzmann',
        'Paul',
        'Schwarzmann',
        '+49 151 22222222',
        'Kampfsport Akademie Berlin',
        1,
        0
    ),
    (
        'paula',
        'paula.meier@fightlog.com',
        '$2y$10$dummyhash',
        'schueler',
        'Paula Meier',
        'Paula',
        'Meier',
        '+49 151 33333333',
        'Kampfsport Akademie Berlin',
        2,
        0
    ),
    (
        'patrick',
        'patrick.mueller@fightlog.com',
        '$2y$10$dummyhash',
        'schueler',
        'Patrick Müller',
        'Patrick',
        'Müller',
        '+49 151 44444444',
        'Kampfsport Akademie Berlin',
        3,
        0
    ),
    (
        'peter',
        'peter.schmidt@fightlog.com',
        '$2y$10$dummyhash',
        'schueler',
        'Peter Schmidt',
        'Peter',
        'Schmidt',
        '+49 151 55555555',
        'Kampfsport Akademie Berlin',
        4,
        0
    ),
    (
        'sophia',
        'sophia.schneider@fightlog.com',
        '$2y$10$dummyhash',
        'schueler',
        'Sophia Schneider',
        'Sophia',
        'Schneider',
        '+49 151 66666666',
        'Kampfsport Akademie Berlin',
        5,
        0
    );

-- Passwort-Hashes setzen (echte BCRYPT-Hashes)
-- Passwörter: admin123, trainer123, schueler123, test123 (für alle anderen)
-- HINWEIS: Diese Hashes müssen mit password_hash() generiert werden
-- Führe nach dem Import das Skript db/generate-passwords.php aus oder setze die Hashes manuell
-- Beispiel-Update (ersetze die Hashes mit echten Werten):
-- UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'admin';
-- UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'trainer';
-- UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'schueler';

-- Basisrechte (erweitert)
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
    -- Training-Berechtigungen
    (
        'view_own_training',
        'Eigenen Trainingsverlauf einsehen'
    ),
    (
        'view_all_training',
        'Alle Trainingsverläufe einsehen'
    ),
    (
        'edit_training_history',
        'Trainingsverlauf bearbeiten'
    ),
    -- Gruppen-Berechtigungen
    (
        'manage_groups',
        'Schülergruppen verwalten'
    );

-- Rollen-Berechtigungen Mapping-Tabelle (für automatische Zuweisung)
CREATE TABLE role_permissions (
    role ENUM(
        'schueler',
        'trainer',
        'admin'
    ) NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role, permission_id),
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
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
        'book_courses',
        'view_own_training'
    );

-- Trainer-Berechtigungen (alles von Schüler + mehr)
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
        'book_courses',
        'view_course_participants',
        'view_own_training',
        'view_all_training',
        'edit_training_history',
        'manage_groups'
    );

-- Admin-Berechtigungen (alle)
INSERT INTO
    role_permissions (role, permission_id)
SELECT 'admin', id
FROM permissions;

-- Rechte-Zuordnung für bestehende Benutzer
-- Admin: alle Rechte
INSERT INTO
    user_permissions (user_id, permission_id)
SELECT 1 as user_id, id
FROM permissions;

-- Trainer: Trainer-Rechte
INSERT INTO
    user_permissions (user_id, permission_id)
SELECT 2 as user_id, permission_id
FROM role_permissions
WHERE
    role = 'trainer';

-- Schüler: Schüler-Rechte (User 3-8)
INSERT INTO
    user_permissions (user_id, permission_id)
SELECT u.id, rp.permission_id
FROM users u
    CROSS JOIN role_permissions rp
WHERE
    u.role = 'schueler'
    AND rp.role = 'schueler';

INSERT INTO
    courses (
        title,
        instructor,
        date,
        duration,
        max_participants,
        price,
        description
    )
VALUES (
        'Selbstverteidigung für Frauen',
        'Anna Weber',
        '2026-04-15',
        '4 Stunden',
        12,
        '45€',
        'Spezieller Kurs für effektive Selbstverteidigung'
    ),
    (
        'Kampfrichter Ausbildung',
        'Hans Schmidt',
        '2026-05-10',
        '8 Stunden',
        8,
        '120€',
        'Offizielle Ausbildung zum Kampfrichter'
    ),
    (
        'Kinder Kampfsport (6-12 Jahre)',
        'Lisa Meyer',
        '2026-04-20',
        '2 Stunden',
        15,
        '25€',
        'Spielerisches Kampfsporttraining für Kinder'
    );

INSERT INTO
    course_bookings (course_id, user_id, status)
VALUES (1, 3, 'confirmed'),
    (1, 4, 'confirmed'),
    (2, 3, 'confirmed'),
    (3, 5, 'pending'),
    (3, 6, 'confirmed');

INSERT INTO
    exams (
        user_id,
        date,
        grade_id,
        category,
        instructor,
        comments,
        status
    )
VALUES (
        3,
        '2026-03-15',
        2,
        'Technik',
        'Tom Trainer',
        'Gute Leistung gezeigt',
        'passed'
    ),
    (
        3,
        '2026-04-19',
        4,
        'Kampf',
        'Tom Trainer',
        'is aight',
        'passed'
    ),
    (
        3,
        '2026-05-01',
        7,
        'Theorie',
        'Tom Trainer',
        'joa',
        'passed'
    ),
    (
        4,
        '2026-03-20',
        1,
        'Kata',
        'Tom Trainer',
        'Noch etwas unsicher',
        'passed'
    );

INSERT INTO
    student_groups (
        name,
        description,
        created_by,
        created_at
    )
VALUES (
        'Anfängergruppe',
        'Gruppe für neue Schüler',
        2,
        NOW()
    ),
    (
        'Fortgeschrittene',
        'Gruppe für fortgeschrittene Schüler',
        2,
        NOW()
    );

INSERT INTO
    group_members (group_id, user_id, added_at)
VALUES (1, 3, NOW()),
    (1, 4, NOW()),
    (2, 5, NOW()),
    (2, 6, NOW());

-- P1+2 Schlagkraft (Pratzen)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P1+2 Schlagkraft',
        'Pratzentraining für Schlagkraft',
        'Pratzen'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (@template_id, 'Get Ready', 1);

-- P3 Arme (Greifen)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P3 Arme',
        'Greiftechnik für Arme',
        'Greifen'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (@template_id, 'nach oben', 1),
    (
        @template_id,
        'zur Schulter',
        2
    );

-- P3 Hals (Greifen)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P3 Hals',
        'Greiftechnik für Hals',
        'Greifen'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (@template_id, 'eine Hand', 1),
    (@template_id, 'beide Arme', 2);

-- P3 Shirt (Greifen)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P3 Shirt',
        'Greiftechnik am Shirt',
        'Greifen'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (@template_id, 'Brust', 1),
    (@template_id, 'Arme', 2);

-- P4 Pos Außen (Combat)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P4 Pos Außen',
        'Combat Position Außen',
        'Combat'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (
        @template_id,
        'Keil Handfläche',
        1
    );

-- P4 Pos Innen (Combat)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P4 Pos Innen',
        'Combat Position Innen',
        'Combat'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (@template_id, 'Faak Gam', 1);

-- P4 Pos Front (Combat)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P4 Pos Front',
        'Combat Position Front',
        'Combat'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (@template_id, 'Djat Sao', 1);

-- P4 Mix (Combat)
INSERT INTO
    goal_templates (title, definition, category)
VALUES (
        'P4 Mix',
        'Combat Mix-Techniken',
        'Combat'
    );

SET @template_id = LAST_INSERT_ID();

INSERT INTO
    goal_template_subtasks (
        template_id,
        definition,
        sort_order
    )
VALUES (
        @template_id,
        'Faak - Fook',
        1
    );

-- Username: admin, Passwort: admin123
UPDATE users
SET
    password_hash = '$2y$10$YBTbGKJSYKbuLfBEC3IKu.saaDmKxuq1OykfQjThndpBy/F7YIhm6'
WHERE
    username = 'admin';

-- Username: trainer, Passwort: trainer123
UPDATE users
SET
    password_hash = '$2y$10$GPsvhV8dEUjVp6C1XUgulekpqUpBNAiL/aViWA6m/Ueus617Va3ie'
WHERE
    username = 'trainer';

-- Username: schueler, Passwort: schueler123
UPDATE users
SET
    password_hash = '$2y$10$N5Ne90COspYhrS42Ixr3c./lwss4NVr1g1lrPq7CDiq6OBf4kJy7.'
WHERE
    username = 'schueler';

-- Username: paul, Passwort: test123
UPDATE users
SET
    password_hash = '$2y$10$6mWgFhT7Sq3AWsa5i/QyBOOXp6tjAz4mykacXeyOWTbW3KFp9hUsK'
WHERE
    username = 'paul';

-- Username: paula, Passwort: test123
UPDATE users
SET
    password_hash = '$2y$10$IKT2ffVeS28b9Kfe7kyh..vbIt4qWQk.6Z3.FA1jWNGYqQZeSd7xq'
WHERE
    username = 'paula';

-- Username: patrick, Passwort: test123
UPDATE users
SET
    password_hash = '$2y$10$GJD4jZOlvjCb2SMOtZCx.urNSs/xHjR9DVc1RVJgebVcgz8U23jza'
WHERE
    username = 'patrick';

-- Username: peter, Passwort: test123
UPDATE users
SET
    password_hash = '$2y$10$3gvtWmPTM1n1qCFT91xg3OZL8LxR1/bVxi8o8wgbB/xcw5BYxHj8i'
WHERE
    username = 'peter';

-- Username: sophia, Passwort: test123
UPDATE users
SET
    password_hash = '$2y$10$0g3b0D4rdU/grYlz7TEAxe6KlivZ7G7xyVuHQFlHoZSwJ9kOtK04O'
WHERE
    username = 'sophia';



-- Urkunden (certificates) - automatisch erstellte + manuelle
-- Automatische Urkunden für bestandene Prüfungen
INSERT INTO certificates (user_id, exam_id, title, date, grade_id, instructor, category, is_manual) VALUES
    (3, 1, 'Gürtelprüfung Gelbgurt', '2026-03-15', 2, 'Tom Trainer', 'Technik', 0),
    (3, 2, 'Gürtelprüfung Grüngurt', '2026-04-19', 4, 'Tom Trainer', 'Kampf', 0),
    (3, 3, 'Gürtelprüfung Schwarzgurt 1. Dan', '2026-05-01', 7, 'Tom Trainer', 'Theorie', 0),
    (4, 4, 'Gürtelprüfung Weißgurt', '2026-03-20', 1, 'Tom Trainer', 'Kata', 0);

-- Manuelle Urkunden
INSERT INTO certificates (user_id, exam_id, title, date, grade_id, instructor, category, is_manual) VALUES
    (3, NULL, 'Beste Leistung des Monats', '2026-02-01', NULL, 'Admin Trainer', NULL, 1),
    (5, NULL, 'Turnierteilnahme Stadtmeisterschaft', '2026-01-28', NULL, 'Tom Trainer', NULL, 1),
    (7, NULL, 'Trainer-Assistenz Zertifikat', '2026-01-20', NULL, 'Admin Trainer', NULL, 1);

-- Zugewiesene Ziele (user_goals)
INSERT INTO user_goals (user_id, template_id, target_date, status, created_at, completed_at) VALUES
    (3, 1, '2026-03-01', 'completed', '2026-01-01 10:00:00', '2026-02-15 14:30:00'),
    (3, 2, '2026-04-01', 'in_progress', '2026-01-15 09:00:00', NULL),
    (3, 5, '2026-05-01', 'in_progress', '2026-01-20 11:00:00', NULL),
    (4, 1, '2026-04-01', 'in_progress', '2026-01-10 10:00:00', NULL),
    (4, 3, '2026-05-01', 'in_progress', '2026-01-15 10:00:00', NULL),
    (5, 4, '2026-03-15', 'completed', '2026-01-05 09:00:00', '2026-03-10 16:00:00'),
    (5, 6, '2026-04-15', 'in_progress', '2026-01-20 10:00:00', NULL),
    (6, 1, '2026-04-01', 'in_progress', '2026-01-12 10:00:00', NULL),
    (6, 2, '2026-05-01', 'cancelled', '2026-01-12 10:00:00', NULL),
    (7, 7, '2026-03-01', 'completed', '2026-01-01 09:00:00', '2026-02-28 15:00:00'),
    (7, 8, '2026-04-01', 'in_progress', '2026-02-01 10:00:00', NULL),
    (8, 1, '2026-05-01', 'in_progress', '2026-01-25 10:00:00', NULL);


INSERT INTO user_goal_progress (user_goal_id, subtask_id, completed, completed_at) VALUES
    (1, 1, 1, '2026-02-15 14:30:00'),
    (2, 2, 1, '2026-01-25 15:00:00'),
    (2, 3, 0, NULL),
    (3, 8, 0, NULL),
    (4, 1, 0, NULL),
    (5, 4, 1, '2026-01-28 14:00:00'),
    (5, 5, 0, NULL),
    (6, 9, 1, '2026-03-10 16:00:00'),
    (7, 11, 0, NULL),
    (8, 1, 0, NULL),
    (10, 10, 1, '2026-02-28 15:00:00'),
    (12, 1, 0, NULL);