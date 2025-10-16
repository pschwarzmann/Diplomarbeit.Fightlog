# FightLog - Kampfsporterfolge digital erfassen

Eine moderne Webanwendung zur digitalen Erfassung und Verwaltung von Kampfsporterfolgen für Schüler und Trainer.

## 🎯 Projektübersicht

FightLog ist eine responsive Webanwendung, die es Kampfsportlern und Trainern ermöglicht, ihre Erfolge, Urkunden, Prüfungen und Trainingsverläufe digital zu erfassen und zu verwalten.

### Hauptfunktionen:
- 🔐 Login/Registrierung mit Rollenwahl (Schüler/Trainer)
- 📄 Urkunden-Upload und -Verwaltung
- 🏆 Prüfungsergebnisse und Bewertungen
- 📊 Trainingsverlauf mit Timeline
- 🎯 Zielsetzung und Fortschrittsverfolgung
- 📚 Sonderkurse und Workshops
- 🌐 Mehrsprachigkeit (Deutsch/Englisch)
- 📱 Responsive Design (Mobile First)

## 📁 Projektstruktur

```
fightlog/
├── frontend/                 # Frontend (HTML, CSS, JS, Vue.js)
│   ├── index.html           # Haupt-HTML-Datei
│   ├── main.js              # Vue.js Anwendung
│   └── styles/
│       └── main.css         # CSS-Styles
├── backend/                  # Backend (PHP)
│   ├── api/                 # API-Endpunkte
│   │   ├── login.php        # Login-API
│   │   └── upload.php       # Upload-API
│   ├── db/                  # Datenbank-Verbindung
│   └── uploads/             # Upload-Ziel für Dateien
├── db/
│   └── fightlog.sql         # Datenbankstruktur
└── README.md               # Diese Datei
```

## 🚀 Installation und Start

### Voraussetzungen:
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Lokaler Webserver (für Entwicklung)

### Schnellstart:
1. **Dateien herunterladen:**
   ```bash
   # Alle Dateien in einen Ordner kopieren
   ```

2. **Lokalen Server starten:**
   ```bash
   # Mit Python 3
   python -m http.server 8000
   
   # Oder mit Node.js (http-server)
   npx http-server
   
   # Oder mit PHP
   php -S localhost:8000
   ```

3. **Anwendung öffnen:**
   ```
   http://localhost:8000/frontend/
   ```

## 🔧 Technologie-Stack

- **Frontend Framework:** Vue.js 3 (CDN)
- **Styling:** CSS3 mit modernen Features
- **Icons:** Font Awesome 6
- **Schriftart:** Inter (Google Fonts)
- **Backend:** PHP (für Backend-Entwickler)
- **Datenbank:** MySQL (für Backend-Entwickler)

## 🎨 Design-Features

- **Farbschema:** Dunkler Hintergrund mit Blautönen
- **Responsive:** Mobile-First Design
- **Barrierefreiheit:** Hohe Kontraste, Tastaturnavigation
- **Animationen:** Smooth Transitions und Hover-Effekte
- **Upload:** Drag & Drop für Dateien

## 🔄 Backend-Integration

### Für Backend-Entwickler:

Die Anwendung ist so strukturiert, dass Backend-API-Calls einfach integriert werden können:

#### 1. **API-Endpunkte benötigt:**

```javascript
// Authentifizierung
POST /backend/api/login.php
POST /backend/api/register.php
POST /backend/api/logout.php

// Urkunden
GET /backend/api/certificates.php
POST /backend/api/upload.php
PUT /backend/api/certificates.php
DELETE /backend/api/certificates.php

// Prüfungen
GET /backend/api/exams.php
POST /backend/api/exams.php
PUT /backend/api/exams.php

// Trainingsverlauf
GET /backend/api/training.php
POST /backend/api/training.php

// Sonderkurse
GET /backend/api/courses.php
POST /backend/api/courses/book.php

// Ziele
GET /backend/api/goals.php
POST /backend/api/goals.php
PUT /backend/api/goals.php
```

#### 2. **Dateien zum Anpassen:**

**`frontend/main.js` (Zeile 200-300):**
```javascript
// Backend-Entwickler: Hier echte API-Calls einfügen
const apiService = {
    async login(credentials) {
        // Ersetze durch echten API-Call:
        // return fetch('/backend/api/login.php', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(credentials)
        // }).then(res => res.json());
    }
};
```

**`backend/api/login.php` (Zeile 25-35):**
```php
// TODO: Backend-Entwickler - Hier echte Authentifizierung implementieren
// - Datenbankverbindung herstellen
// - Passwort-Hashing überprüfen
// - Session-Token erstellen
```

#### 3. **Datenstrukturen:**

Die Anwendung erwartet folgende Datenformate:

```javascript
// Benutzer
{
    id: 1,
    username: "max.mueller",
    email: "max@example.com",
    role: "trainer", // "schueler" oder "trainer"
    name: "Max Müller",
    school: "Kampfsport Akademie",
    beltLevel: "Schwarzgurt 3. Dan"
}

// Urkunden
{
    id: 1,
    title: "Gelbgurt Prüfung",
    type: "belt_exam",
    date: "2023-06-15",
    level: "Gelbgurt",
    instructor: "Hans Schmidt",
    fileUrl: "certificate_1.pdf",
    status: "approved"
}

// Prüfungen
{
    id: 1,
    date: "2023-06-15",
    level: "Gelbgurt",
    category: "Technik",
    score: 85,
    instructor: "Hans Schmidt",
    comments: "Sehr gute Grundtechniken",
    status: "passed"
}
```

#### 4. **Datenbank-Setup:**

1. **MySQL-Datenbank erstellen:**
   ```sql
   -- Siehe db/fightlog.sql für komplette Struktur
   ```

2. **PHP-Konfiguration:**
   - Erstelle `backend/db/config.php` mit Datenbankverbindung
   - Setze Upload-Pfad in `backend/uploads/`

3. **API-Endpunkte implementieren:**
   - Kopiere Platzhalter aus `backend/api/`
   - Ersetze Dummy-Logik durch echte Datenbankabfragen

## 🧪 Demo-Funktionen

Die Anwendung enthält umfangreiche Demo-Daten:

- **Demo-Login:** Beliebige Anmeldedaten funktionieren
- **Beispiel-Urkunden:** 3 verschiedene Urkunden
- **Prüfungsverlauf:** 2 Beispiel-Prüfungen
- **Trainingsverlauf:** 2 Trainingseinheiten
- **Sonderkurse:** 2 verfügbare Kurse
- **Ziele:** 2 Beispiel-Ziele mit Fortschritt

## 📱 Responsive Design

Die Anwendung ist vollständig responsive:

- **Mobile (< 768px):** Einspaltige Layouts, größere Touch-Targets
- **Tablet (768px - 1024px):** Zweispaltige Grids
- **Desktop (> 1024px):** Mehrspaltige Layouts, Hover-Effekte

## 🌐 Mehrsprachigkeit

- **Deutsch:** Standardsprache
- **Englisch:** Vollständige Übersetzung
- **Sprachauswahl:** Rechts oben in der Anwendung
- **Persistierung:** Sprache wird im Browser gespeichert

## 🔒 Sicherheitshinweise

**Für Produktionsumgebung:**

1. **HTTPS verwenden** für alle API-Calls
2. **CSRF-Token** für alle POST-Requests
3. **Input-Validierung** auf Server-Seite
4. **File-Upload-Sicherheit** implementieren
5. **Session-Management** mit sicheren Cookies
6. **Passwort-Hashing** mit bcrypt oder Argon2

## 🚀 Deployment

### Statisches Hosting (Frontend):
```bash
# Frontend-Dateien in Webserver-Ordner kopieren
cp -r frontend/* /var/www/html/
```

### Backend-Server:
```bash
# Backend-Dateien auf PHP-Server kopieren
cp -r backend/* /var/www/html/backend/
```

### Datenbank:
```bash
# MySQL-Datenbank importieren
mysql -u username -p < db/fightlog.sql
```

## 📞 Support

Bei Fragen zur Frontend-Entwicklung oder Backend-Integration:

1. **Code-Kommentare** in den JavaScript-Dateien beachten
2. **Console-Logs** für Debugging verwenden
3. **Browser-Entwicklertools** für Netzwerk-Analyse

## 📄 Lizenz

Dieses Projekt ist für die Diplomarbeit "FightLog" erstellt.

---

**Hinweis für Backend-Entwickler:** Alle API-Call-Stellen sind mit Kommentaren markiert und können einfach durch echte Backend-Aufrufe ersetzt werden. Die Datenstrukturen sind konsistent und erweiterbar.

**Nächste Schritte für Backend-Entwickler:**
1. Datenbank mit `db/fightlog.sql` erstellen
2. PHP-API-Endpunkte in `backend/api/` implementieren
3. Datenbankverbindung in `backend/db/config.php` konfigurieren
4. Frontend-API-Calls in `frontend/main.js` anpassen 