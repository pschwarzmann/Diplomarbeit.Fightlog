<?php
// Einstellungen-API (extrahiert aus certificates.php)
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    error_log('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage());
    json_error('Datenbankverbindung fehlgeschlagen', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

// CSRF-Schutz für state-changing Requests
if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
    Security::requireCsrf();
}

if ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    
    // Urkunden-Einstellungen abrufen
    if ($action === 'settings') {
        $res = $mysqli->query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key LIKE 'certificate_%'");
        $settings = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        }
        json_out(['success' => true, 'settings' => $settings]);
    }
    
    // Öffentliche Passwort-Mindestlänge (für Registrierung/Reset ohne Auth)
    if ($action === 'publicPasswordMinLength') {
        $res = $mysqli->query("SELECT setting_value FROM app_settings WHERE setting_key = 'password_min_length' LIMIT 1");
        $minLength = 8; // Fallback-Wert
        if ($res && $row = $res->fetch_assoc()) {
            $minLength = (int)$row['setting_value'];
        }
        json_out(['success' => true, 'password_min_length' => $minLength]);
    }
    
    // Allgemeine Einstellungen abrufen (nur Admin)
    if ($action === 'generalSettings') {
        $userRole = auth_user_role($mysqli);
        if ($userRole !== 'admin') {
            json_error('Keine Berechtigung', 403);
        }
        
        $res = $mysqli->query("SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('password_min_length')");
        $settings = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $settings[$row['setting_key']] = $row['setting_value'];
            }
        }
        // Fallback-Wert falls nicht in DB vorhanden
        if (!isset($settings['password_min_length'])) {
            $settings['password_min_length'] = '8';
        }
        json_out(['success' => true, 'settings' => $settings]);
    }
    
    json_error('Unbekannte Aktion', 400);
}

if ($method === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : '';
    
    // Urkunden-Einstellungen speichern
    if ($action === 'saveSettings') {
        $userRole = auth_user_role($mysqli);
        if ($userRole !== 'admin' && $userRole !== 'trainer') {
            json_error('Keine Berechtigung', 403);
        }
        
        $settings = isset($body['settings']) ? $body['settings'] : [];
        foreach ($settings as $key => $value) {
            // Nur certificate_ Einstellungen erlauben
            if (strpos($key, 'certificate_') !== 0) continue;
            
            $stmt = $mysqli->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->bind_param('sss', $key, $value, $value);
            $stmt->execute();
        }
        json_out(['success' => true]);
    }
    
    // Allgemeine Einstellungen speichern (nur Admin)
    if ($action === 'saveGeneralSettings') {
        $userRole = auth_user_role($mysqli);
        if ($userRole !== 'admin') {
            json_error('Keine Berechtigung', 403);
        }
        
        $settings = isset($body['settings']) ? $body['settings'] : [];
        foreach ($settings as $key => $value) {
            // Nur erlaubte Keys
            if ($key !== 'password_min_length') continue;
            
            // Validierung: password_min_length muss zwischen 4 und 128 sein
            if ($key === 'password_min_length') {
                $intValue = (int)$value;
                if ($intValue < 4 || $intValue > 128) {
                    json_error('Passwort-Mindestlänge muss zwischen 4 und 128 liegen', 400);
                }
                $value = (string)$intValue;
            }
            
            $stmt = $mysqli->prepare("INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->bind_param('sss', $key, $value, $value);
            $stmt->execute();
        }
        json_out(['success' => true]);
    }
    
    json_error('Unbekannte Aktion', 400);
}

json_error('Nur GET/POST erlaubt', 405);
