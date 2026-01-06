-- Passwort-Hashes für Test-Benutzer setzen
-- Diese Datei muss NACH dem Import von fightlog.sql ausgeführt werden
-- Generiert am: 2026-01-05 15:53:45

-- Passwörter:
-- admin: admin123
-- trainer: trainer123
-- schueler: schueler123
-- Alle anderen: test123

-- Username: admin, Passwort: admin123
UPDATE users SET password_hash = '$2y$10$YBTbGKJSYKbuLfBEC3IKu.saaDmKxuq1OykfQjThndpBy/F7YIhm6' WHERE username = 'admin';

-- Username: trainer, Passwort: trainer123
UPDATE users SET password_hash = '$2y$10$GPsvhV8dEUjVp6C1XUgulekpqUpBNAiL/aViWA6m/Ueus617Va3ie' WHERE username = 'trainer';

-- Username: schueler, Passwort: schueler123
UPDATE users SET password_hash = '$2y$10$N5Ne90COspYhrS42Ixr3c./lwss4NVr1g1lrPq7CDiq6OBf4kJy7.' WHERE username = 'schueler';

-- Username: paul, Passwort: test123
UPDATE users SET password_hash = '$2y$10$6mWgFhT7Sq3AWsa5i/QyBOOXp6tjAz4mykacXeyOWTbW3KFp9hUsK' WHERE username = 'paul';

-- Username: paula, Passwort: test123
UPDATE users SET password_hash = '$2y$10$IKT2ffVeS28b9Kfe7kyh..vbIt4qWQk.6Z3.FA1jWNGYqQZeSd7xq' WHERE username = 'paula';

-- Username: patrick, Passwort: test123
UPDATE users SET password_hash = '$2y$10$GJD4jZOlvjCb2SMOtZCx.urNSs/xHjR9DVc1RVJgebVcgz8U23jza' WHERE username = 'patrick';

-- Username: peter, Passwort: test123
UPDATE users SET password_hash = '$2y$10$3gvtWmPTM1n1qCFT91xg3OZL8LxR1/bVxi8o8wgbB/xcw5BYxHj8i' WHERE username = 'peter';

-- Username: sophia, Passwort: test123
UPDATE users SET password_hash = '$2y$10$0g3b0D4rdU/grYlz7TEAxe6KlivZ7G7xyVuHQFlHoZSwJ9kOtK04O' WHERE username = 'sophia';
