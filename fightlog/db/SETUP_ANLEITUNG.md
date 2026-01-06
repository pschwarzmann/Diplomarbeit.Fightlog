# 🚀 Setup-Anleitung: Datenbank mit Passwort-Hashes

## Schritt 1: Datenbank importieren

1. Öffne **phpMyAdmin**: `http://localhost:8080/phpmyadmin`
2. Klicke auf den Tab **"SQL"**
3. Öffne die Datei `fightlog/db/fightlog.sql` in einem Texteditor
4. Kopiere den **gesamten Inhalt** und füge ihn in phpMyAdmin ein
5. Klicke auf **"Ausführen"**

## Schritt 2: Passwort-Hashes setzen

1. Öffne erneut den Tab **"SQL"** in phpMyAdmin
2. Öffne die Datei `fightlog/db/set-passwords.sql` in einem Texteditor
3. Kopiere den **gesamten Inhalt** und füge ihn in phpMyAdmin ein
4. Klicke auf **"Ausführen"**

## ✅ Fertig!

Jetzt kannst du dich mit folgenden Test-Accounts einloggen:

| Username | Passwort | Rolle |
|----------|----------|-------|
| `admin` | `admin123` | Admin |
| `trainer` | `trainer123` | Trainer |
| `schueler` | `schueler123` | Schüler |
| `paul` | `test123` | Schüler |
| `paula` | `test123` | Schüler |
| `patrick` | `test123` | Schüler |
| `peter` | `test123` | Schüler |
| `sophia` | `test123` | Schüler |

## 🔐 Wichtige Hinweise

- **Login**: Funktioniert jetzt vollständig datenbankbasiert
- **Benutzer erstellen**: Nur als Admin möglich (Button "Benutzer anlegen" im Admin-Panel)
- **Registrierung**: Nur für Admin verfügbar

## 🧪 Testen

1. Öffne: `http://localhost:8080/fightlog/frontend/`
2. Logge dich mit `admin` / `admin123` ein
3. Gehe zum Admin-Panel
4. Klicke auf "Benutzer anlegen"
5. Erstelle einen neuen Benutzer

Viel Erfolg! 🥋

