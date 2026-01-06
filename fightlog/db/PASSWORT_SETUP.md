# Passwort-Setup für Test-Benutzer

Nach dem Import der Datenbank `fightlog.sql` müssen die Passwort-Hashes für die Test-Benutzer gesetzt werden.

## Schritt 1: Datenbank importieren

Importiere zuerst `fightlog.sql` in phpMyAdmin oder per MySQL-Client.

## Schritt 2: Passwort-Hashes generieren

Führe das PHP-Skript aus, um die Passwort-Hashes zu generieren:

```bash
php db/generate-passwords.php
```

Dies erzeugt UPDATE-Statements für alle Test-Benutzer.

## Schritt 3: Hashes in Datenbank setzen

Kopiere die generierten UPDATE-Statements und führe sie in phpMyAdmin oder per MySQL-Client aus.

## Standard-Passwörter

- **admin**: `admin123`
- **trainer**: `trainer123`
- **schueler**: `schueler123`
- **Alle anderen** (paul, paula, patrick, peter, sophia): `test123`

## Alternative: Manuell mit PHP

Falls das Skript nicht funktioniert, kannst du die Hashes auch manuell generieren:

```php
<?php
echo password_hash('admin123', PASSWORD_BCRYPT);
echo password_hash('trainer123', PASSWORD_BCRYPT);
echo password_hash('schueler123', PASSWORD_BCRYPT);
echo password_hash('test123', PASSWORD_BCRYPT);
?>
```

Dann die UPDATE-Statements manuell in der Datenbank ausführen.

