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
├── frontend/                       # Frontend (Vue 3, Vanilla JS, CSS)
│   ├── index.html / simple.html   # Entry Points (Login & App)
│   ├── demo.html                  # Funktionsübersicht
│   ├── main.js                    # Module-Bootstrap
│   ├── styles/                    # Globale Styles
│   └── src/                       # Modularisierte App-Logik
│       ├── app/                   # App-spezifische Logik
│       ├── components/            # Wiederverwendbare UI-Komponenten
│       ├── constants/             # Übersetzungen & Konstanten
│       ├── data/                  # Demo-Daten
│       ├── services/              # API-, Notify-, Passkey-Services
│       ├── store/                 # State- und Storage-Helfer
│       └── utils/                 # Form-Validation, Custom Controls
├── backend/                        # Backend (PHP)
│   ├── api/                       # API-Endpunkte
│   ├── core/                      # Bootstrap & DB-Layer
│   ├── config/                    # Konfigurationen
│   ├── services/                  # Business-Logik (z.B. AuthService)
│   ├── utils/                     # Request/Response-Helfer
│   └── models/                    # (Platzhalter) für spätere Datenmodelle
├── db/
│   └── fightlog.sql               # Datenbankstruktur
└── README.md                     # Diese Datei
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
POST /fightlog/backend/api/login.php
POST /fightlog/backend/api/register.php
POST /fightlog/backend/api/logout.php

// Urkunden
GET /fightlog/backend/api/certificates.php
POST /fightlog/backend/api/upload.php
PUT /fightlog/backend/api/certificates.php
DELETE /fightlog/backend/api/certificates.php

// Prüfungen
GET /fightlog/backend/api/exams.php
POST /fightlog/backend/api/exams.php
PUT /fightlog/backend/api/exams.php

// Trainingsverlauf
GET /fightlog/backend/api/training.php
POST /fightlog/backend/api/training.php

// Sonderkurse
GET /fightlog/backend/api/courses.php
POST /fightlog/backend/api/courses/book.php

// Ziele
GET /fightlog/backend/api/goals.php
POST /fightlog/backend/api/goals.php
PUT /fightlog/backend/api/goals.php
```

#### 2. **Dateien zum Anpassen:**

**`frontend/src/services/api.service.js`:**
```javascript
export const apiService = {
    login(credentials) {
        return request('/login.php', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(credentials)
        });
    },
    // ...
};
```

**`frontend/main.js` (Bootstrap):**
- Lädt Übersetzungen (`src/constants/translations.js`)
- Bindet Demo-Daten (`src/data/demo-data.js`)
- Registriert globale Komponenten (`src/components/registerGlobalComponents.js`)
- Startet anschließend das Vue-Root-Layout

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
   - Passe `backend/config/database.php` (Zugangsdaten) an
   - Gemeinsame Header + DB-Zugriff laufen über `backend/core/bootstrap.php`
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
cp -r backend/* /var/www/html/fightlog/backend/
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
3. Zugangsdaten in `backend/config/database.php` pflegen (Bootstrap kümmert sich um alles Weitere)
4. Frontend-API-Calls in `frontend/src/services/api.service.js` (und bei Bedarf `frontend/main.js`) anpassen