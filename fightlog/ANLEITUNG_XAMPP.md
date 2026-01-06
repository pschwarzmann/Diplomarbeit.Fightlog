# 🚀 Anleitung: FightLog mit XAMPP starten

## Voraussetzungen
- ✅ XAMPP installiert und gestartet (Apache + MySQL)
- ✅ Projekt im XAMPP `htdocs` Ordner

---

## 📋 Schritt 1: Projekt in XAMPP einrichten

### 1.1 Projekt-Ordner kopieren
1. Öffne den XAMPP-Installationsordner (meist `C:\xampp`)
2. Gehe zu `htdocs`
3. Kopiere den gesamten `fightlog` Ordner nach `C:\xampp\htdocs\fightlog`

**Wichtig:** Der Pfad sollte so aussehen:
```
C:\xampp\htdocs\fightlog\
├── backend\
├── frontend\
├── db\
└── ...
```

---

## 📋 Schritt 2: Datenbank einrichten

### 2.1 phpMyAdmin öffnen
1. Öffne im Browser: `http://localhost/phpmyadmin`
2. Stelle sicher, dass MySQL in XAMPP läuft (grüner Haken)

### 2.2 Datenbank importieren
1. Klicke auf **"Import"** (oben im Menü)
2. Klicke auf **"Datei auswählen"**
3. Navigiere zu: `C:\xampp\htdocs\fightlog\db\fightlog.sql`
4. Klicke auf **"Ausführen"** (unten)

**Erwartetes Ergebnis:**
- ✅ Datenbank `fightlog` wird erstellt
- ✅ Alle Tabellen werden angelegt (users, certificates, exams, etc.)

### 2.3 Datenbank-Verbindung prüfen
1. Öffne: `C:\xampp\htdocs\fightlog\backend\config\database.php`
2. Stelle sicher, dass die Einstellungen so sind:
```php
return [
    'host' => '127.0.0.1',
    'user' => 'root',
    'pass' => '',           // Leer = kein Passwort (XAMPP Standard)
    'name' => 'fightlog',
    'charset' => 'utf8mb4',
];
```

**Falls MySQL ein Passwort hat:**
- Ändere `'pass' => 'dein_passwort'` in der `database.php`

---

## 📋 Schritt 3: Website starten

### 3.1 XAMPP starten
1. Öffne **XAMPP Control Panel**
2. Starte **Apache** (klicke auf "Start")
3. Starte **MySQL** (klicke auf "Start")
4. Beide sollten grün sein ✅

### 3.2 Website im Browser öffnen
Öffne im Browser:
```
http://localhost/fightlog/frontend/index.html
```

**Alternative URLs:**
- `http://localhost/fightlog/frontend/` (falls index.html automatisch geladen wird)
- `http://127.0.0.1/fightlog/frontend/index.html`

---

## 📋 Schritt 4: Testen

### 4.1 API-Verbindung testen
Öffne im Browser:
```
http://localhost/fightlog/backend/api/dbstatus.php
```

**Erwartetes Ergebnis:**
```json
{
  "status": "connected",
  "database": "fightlog",
  "tables": [...]
}
```

### 4.2 Ersten Benutzer anlegen
1. Gehe zu: `http://localhost/fightlog/frontend/index.html`
2. Klicke auf **"Registrieren"**
3. Fülle das Formular aus:
   - Benutzername: `admin`
   - E-Mail: `admin@test.de`
   - Passwort: `123456`
   - Vorname: `Admin`
   - Nachname: `Test`
   - Telefon: `+49123456789`
4. Klicke auf **"Registrieren"**

### 4.3 Admin-Rechte setzen (optional)
Falls du den ersten Benutzer als Admin haben möchtest:

1. Öffne phpMyAdmin: `http://localhost/phpmyadmin`
2. Wähle Datenbank `fightlog`
3. Klicke auf Tabelle `users`
4. Finde deinen Benutzer
5. Klicke auf **"Bearbeiten"** (Stift-Icon)
6. Ändere `role` von `schueler` zu `admin`
7. Klicke auf **"OK"**

---

## 🔧 Fehlerbehebung

### Problem: "404 Not Found"
**Lösung:**
- Prüfe, ob der Ordner wirklich in `C:\xampp\htdocs\fightlog` liegt
- Prüfe, ob Apache läuft (grüner Haken im XAMPP Control Panel)

### Problem: "Database connection failed"
**Lösung:**
1. Prüfe, ob MySQL läuft (grüner Haken)
2. Prüfe die Einstellungen in `backend/config/database.php`
3. Prüfe in phpMyAdmin, ob die Datenbank `fightlog` existiert

### Problem: "CORS-Fehler" im Browser
**Lösung:**
- Die Backend-Dateien sollten bereits CORS-Header setzen
- Falls nicht, prüfe `backend/core/bootstrap.php`

### Problem: API-Aufrufe funktionieren nicht
**Lösung:**
1. Öffne die Browser-Konsole (F12)
2. Prüfe die Netzwerk-Tab für Fehler
3. Prüfe, ob die URL stimmt: `/fightlog/backend/api/...`
4. Teste direkt: `http://localhost/fightlog/backend/api/dbstatus.php`

---

## 📝 Wichtige URLs

| Funktion | URL |
|----------|-----|
| **Website** | `http://localhost/fightlog/frontend/index.html` |
| **phpMyAdmin** | `http://localhost/phpmyadmin` |
| **API Status** | `http://localhost/fightlog/backend/api/dbstatus.php` |
| **Login API** | `http://localhost/fightlog/backend/api/login.php` |

---

## ✅ Checkliste

- [ ] XAMPP installiert
- [ ] Projekt in `C:\xampp\htdocs\fightlog` kopiert
- [ ] Apache gestartet (grün)
- [ ] MySQL gestartet (grün)
- [ ] Datenbank `fightlog` importiert
- [ ] `database.php` konfiguriert
- [ ] Website läuft: `http://localhost/fightlog/frontend/index.html`
- [ ] API-Test erfolgreich: `http://localhost/fightlog/backend/api/dbstatus.php`
- [ ] Erster Benutzer angelegt

---

## 🎉 Fertig!

Wenn alles funktioniert, solltest du jetzt:
- ✅ Die Website im Browser sehen
- ✅ Dich registrieren/anmelden können
- ✅ Daten aus der MySQL-Datenbank laden
- ✅ Benutzer, Urkunden, Prüfungen etc. verwalten können

**Viel Erfolg! 🚀**

