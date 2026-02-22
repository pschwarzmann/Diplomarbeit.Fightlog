# FightLog API Dokumentation

## Basis-Informationen

- **Base URL**: `/backend/api/`
- **Content-Type**: `application/json`
- **Authentication**: Cookie-basiert (Session) oder Header `X-User-ID`

## Endpunkte

### Authentifizierung

#### POST `/login.php`
Login mit Username/Email und Passwort.

**Request Body:**
```json
{
  "identifier": "username oder email",
  "password": "passwort"
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": 1, "username": "...", "role": "..." },
  "token": "..."
}
```

#### POST `/logout.php`
Logout und Session beenden.

#### POST `/register.php`
Neue Benutzer-Registrierung.

**Request Body:**
```json
{
  "username": "...",
  "email": "...",
  "password": "...",
  "firstName": "...",
  "lastName": "...",
  "phone": "..."
}
```

### Session Management

#### GET `/session.php`
Session-Status abrufen.

**Response:**
```json
{
  "success": true,
  "expires_at": "2026-02-20 12:00:00",
  "remaining_seconds": 3600
}
```

#### POST `/session.php`
Session verlängern.

**Request Body:**
```json
{
  "action": "extend"
}
```

### Passwort-Reset

#### POST `/password-reset.php`
Passwort-Reset anfordern oder zurücksetzen.

**Request (anfordern):**
```json
{
  "action": "request",
  "email": "user@example.com"
}
```

**Request (zurücksetzen):**
```json
{
  "action": "reset",
  "token": "reset-token",
  "newPassword": "neues-passwort"
}
```

### Urkunden (Certificates)

#### GET `/certificates.php`
Alle Urkunden abrufen.

#### POST `/certificates.php`
Urkunde erstellen.

**Request Body:**
```json
{
  "action": "add",
  "title": "...",
  "date": "2026-02-19",
  "level": "...",
  "instructor": "...",
  "userId": 1
}
```

### Prüfungen (Exams)

#### GET `/exams.php`
Alle Prüfungen abrufen.

#### POST `/exams.php`
Prüfung erstellen.

**Request Body:**
```json
{
  "action": "add",
  "date": "2026-02-19",
  "level": "...",
  "category": "...",
  "instructor": "...",
  "userId": 1
}
```

### Benutzer (Users)

#### GET `/users.php?action=profile`
Eigenes Profil abrufen.

#### POST `/users.php`
Benutzer aktualisieren oder Passwort ändern.

**Request Body (Profil aktualisieren):**
```json
{
  "action": "updateProfile",
  "firstName": "...",
  "lastName": "...",
  "email": "...",
  "phone": "..."
}
```

**Request Body (Passwort ändern):**
```json
{
  "action": "changeOwnPassword",
  "currentPassword": "...",
  "newPassword": "..."
}
```

### Profilbild

#### POST `/profile-picture.php`
Profilbild hochladen.

**Request:** `multipart/form-data` mit Feld `picture`

**Response:**
```json
{
  "success": true,
  "picture_url": "/backend/uploads/profile-pictures/user_1_abc123.jpg"
}
```

#### DELETE `/profile-picture.php`
Profilbild löschen.

### Statistiken

#### GET `/stats.php`
Dashboard-Statistiken abrufen.

**Response:**
```json
{
  "success": true,
  "stats": {
    "own": {
      "certificate_count": 5,
      "exam_count": 10,
      "completed_goals": 3,
      "pending_goals": 2
    },
    "global": {
      "total_students": 50,
      "total_certificates": 200,
      "total_exams": 300,
      "upcoming_courses": 5
    },
    "exam_chart": [
      { "month": "2025-08", "count": 2 },
      { "month": "2025-09", "count": 3 }
    ]
  }
}
```

### Export

#### GET `/export.php?type=certificates&format=csv`
Daten exportieren.

**Query Parameters:**
- `type`: `certificates`, `exams`, `users`
- `format`: `csv`, `pdf`

### Einstellungen

#### GET `/certificates.php?action=generalSettings`
Allgemeine Einstellungen abrufen.

#### POST `/certificates.php?action=saveGeneralSettings`
Allgemeine Einstellungen speichern (nur Admin).

**Request Body:**
```json
{
  "password_min_length": 8
}
```

## Fehlerbehandlung

Alle Endpunkte geben bei Fehlern folgendes Format zurück:

```json
{
  "success": false,
  "error": "Fehlermeldung"
}
```

HTTP-Status-Codes:
- `200`: Erfolg
- `400`: Ungültige Anfrage
- `401`: Nicht authentifiziert
- `403`: Keine Berechtigung
- `404`: Nicht gefunden
- `500`: Serverfehler
