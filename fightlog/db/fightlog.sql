-- ===== FIGHTLOG - DATENBANKSTRUKTUR =====
-- Backend-Entwickler: Diese SQL-Datei enthält alle benötigten Tabellen

-- Datenbank erstellen
CREATE DATABASE IF NOT EXISTS fightlog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fightlog;

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
    belt_level VARCHAR(50),
    verified_trainer TINYINT(1) DEFAULT 0,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

-- Urkunden-Tabelle
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type ENUM(
        'belt_exam',
        'tournament',
        'workshop',
        'special_course'
    ) NOT NULL,
    date DATE NOT NULL,
    level VARCHAR(50),
    instructor VARCHAR(100),
    file_url VARCHAR(255),
    preview VARCHAR(10),
    status ENUM(
        'pending',
        'approved',
        'rejected'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Prüfungen-Tabelle
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    level VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    comments TEXT,
    status ENUM('passed', 'failed', 'pending') DEFAULT 'passed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Sonderkurse-Tabelle
CREATE TABLE special_courses (
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
    FOREIGN KEY (course_id) REFERENCES special_courses (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Ziele-Tabelle
CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    target_date DATE NOT NULL,
    progress INT DEFAULT 0 CHECK (
        progress >= 0
        AND progress <= 100
    ),
    category VARCHAR(50) NOT NULL,
    status ENUM(
        'in_progress',
        'completed',
        'cancelled'
    ) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Sessions-Tabelle für Login-Management
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Gruppen-Tabelle (für Schülergruppen)
CREATE TABLE student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
);

-- Zuordnung Gruppe <-> Benutzer
CREATE TABLE group_members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES student_groups (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Indizes für Gruppen
CREATE INDEX idx_groups_created_by ON student_groups (created_by);

CREATE INDEX idx_group_members_user ON group_members (user_id);

-- Indizes für bessere Performance
CREATE INDEX idx_certificates_user_id ON certificates (user_id);

CREATE INDEX idx_certificates_date ON certificates (date);

CREATE INDEX idx_exams_user_id ON exams (user_id);

CREATE INDEX idx_exams_date ON exams (date);

CREATE INDEX idx_training_user_id ON training_history (user_id);

CREATE INDEX idx_training_date ON training_history (date);

CREATE INDEX idx_goals_user_id ON goals (user_id);

CREATE INDEX idx_sessions_token ON sessions (token);

CREATE INDEX idx_sessions_expires ON sessions (expires_at);

CREATE INDEX idx_users_first_name ON users (first_name);

CREATE INDEX idx_users_last_name ON users (last_name);

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
        belt_level,
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
        'Schwarzgurt 5. Dan - Meister',
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
        'Schwarzgurt 2. Dan',
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
        'Gelbgurt',
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
        'Weißgurt',
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
        'Gelbgurt',
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
        'Orangegurt',
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
        'Grüngurt',
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
        'Blaugurt',
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
    FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
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
    special_courses (
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
        level,
        category,
        instructor,
        comments,
        status
    )
VALUES (
        3,
        '2026-03-15',
        'Gelbgurt',
        'Technik',
        'Tom Trainer',
        'Gute Leistung gezeigt',
        'passed'
    ),
    (
        3,
        '2026-04-19',
        'Grüngurt',
        'Kampf',
        'Tom Trainer',
        'is aight',
        'passed'
    ),
    (
        3,
        '2026-05-01',
        'Schwarzgurt',
        'Theorie',
        'Tom Trainer',
        'joa',
        'passed'
    ),
    (
        4,
        '2026-03-20',
        'Weißgurt',
        'Kata',
        'Tom Trainer',
        'Noch etwas unsicher',
        'passed'
    );

INSERT INTO
    goals (
        user_id,
        title,
        target_date,
        progress,
        category,
        status
    )
VALUES (
        3,
        'Erreichen des Orangengurts',
        '2026-06-30',
        50,
        'Belt Progression',
        'in_progress'
    ),
    (
        3,
        'Teilnahme am regionalen Turnier',
        '2026-09-15',
        20,
        'Competition',
        'in_progress'
    ),
    (
        2,
        'Verbesserung der Tritttechnik',
        '2026-05-31',
        80,
        'Technique Improvement',
        'in_progress'
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