# PDF Export Installation

Der PDF Export verwendet TCPDF für die Generierung echter PDF-Dateien.

## Installation

1. Navigieren Sie ins Backend-Verzeichnis:
   ```bash
   cd backend
   ```

2. Installieren Sie Composer (falls nicht vorhanden):
   ```bash
   php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
   php composer-setup.php
   php -r "unlink('composer-setup.php');"
   ```

3. Installieren Sie TCPDF:
   ```bash
   php composer.phar install
   ```
   Oder falls Composer global installiert ist:
   ```bash
   composer install
   ```

## Verwendung

Nach der Installation funktioniert der PDF Export automatisch:
- `/api/export.php?type=certificates&format=pdf`
- `/api/export.php?type=exams&format=pdf`
- `/api/export.php?type=users&format=pdf`

Falls TCPDF nicht installiert ist, wird ein Fehler zurückgegeben (JSON für API-Calls, HTML für Browser-Aufrufe).
