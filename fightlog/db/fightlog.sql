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
    role ENUM('schueler', 'trainer', 'admin') NOT NULL DEFAULT 'schueler',
    name VARCHAR(100) NOT NULL,
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Urkunden-Tabelle
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type ENUM('belt_exam', 'tournament', 'workshop', 'special_course') NOT NULL,
    date DATE NOT NULL,
    level VARCHAR(50),
    instructor VARCHAR(100),
    file_url VARCHAR(255),
    preview VARCHAR(10),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Prüfungen-Tabelle
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    level VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    score INT CHECK (score >= 0 AND score <= 100),
    instructor VARCHAR(100) NOT NULL,
    comments TEXT,
    status ENUM('passed', 'failed', 'pending') DEFAULT 'passed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    status ENUM('confirmed', 'pending', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (course_id) REFERENCES special_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ziele-Tabelle
CREATE TABLE goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    target_date DATE NOT NULL,
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    category VARCHAR(50) NOT NULL,
    status ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions-Tabelle für Login-Management
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indizes für bessere Performance
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_date ON certificates(date);
CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_exams_date ON exams(date);
CREATE INDEX idx_training_user_id ON training_history(user_id);
CREATE INDEX idx_training_date ON training_history(date);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Beispiel-Daten (optional)
INSERT INTO users (username, email, password_hash, role, name, school, belt_level, verified_trainer) VALUES
('admin', 'admin@fightlog.com', '$2y$10$dummyhash', 'admin', 'Admin Trainer', 'Kampfsport Akademie Berlin', 'Schwarzgurt 5. Dan - Meister', 1),
('trainer', 'trainer@fightlog.com', '$2y$10$dummyhash', 'trainer', 'Tom Trainer', 'Kampfsport Akademie Berlin', 'Schwarzgurt 2. Dan', 1),
('schueler', 'schueler@fightlog.com', '$2y$10$dummyhash', 'schueler', 'Sam Schüler', 'Kampfsport Akademie Berlin', 'Gelbgurt', 0);

-- Basisrechte
INSERT INTO permissions (`key`, label) VALUES
('manage_users', 'Benutzer verwalten'),
('view_all_data', 'Alle Daten einsehen'),
('manage_certificates', 'Urkunden verwalten'),
('approve_certificates', 'Urkunden freigeben'),
('manage_exams', 'Prüfungen verwalten'),
('edit_training_history', 'Trainingsverlauf bearbeiten');

-- Rechte-Zuordnung (Demo)
-- Admin: alle Rechte
INSERT INTO user_permissions (user_id, permission_id)
SELECT 1 as user_id, id FROM permissions;

-- Trainer: ausgewählte Rechte
INSERT INTO user_permissions (user_id, permission_id)
SELECT 2 as user_id, id FROM permissions WHERE `key` IN ('manage_certificates','manage_exams','edit_training_history');

INSERT INTO special_courses (title, instructor, date, duration, max_participants, price, description) VALUES
('Selbstverteidigung für Frauen', 'Anna Weber', '2024-04-15', '4 Stunden', 12, '45€', 'Spezieller Kurs für effektive Selbstverteidigung'),
('Kampfrichter Ausbildung', 'Hans Schmidt', '2024-05-10', '8 Stunden', 8, '120€', 'Offizielle Ausbildung zum Kampfrichter'),
('Kinder Kampfsport (6-12 Jahre)', 'Lisa Meyer', '2024-04-20', '2 Stunden', 15, '25€', 'Spielerisches Kampfsporttraining für Kinder'); 