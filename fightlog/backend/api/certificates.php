<?php
// backend/api/certificates.php
// Urkunden-API - Urkunden werden automatisch bei bestandenen Prüfungen erstellt
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

$viewerId = auth_user_id($mysqli);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    // Einstellungen abrufen
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
    
    // Urkunden abrufen
    $baseSelect = "SELECT c.id, c.user_id as userId, c.exam_id as examId, c.title, c.date, c.grade_id, g.name as gradeName, g.color as gradeColor,
                   c.instructor, c.category, c.is_manual as isManual, c.created_at as createdAt,
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as ownerName, u.username as ownerUsername
                   FROM certificates c
                   LEFT JOIN users u ON c.user_id = u.id
                   LEFT JOIN grade g ON c.grade_id = g.id";
    
    // Prüfe ob Benutzer alle Urkunden sehen darf
    if (has_permission($mysqli, 'view_all_certificates')) {
        $res = $mysqli->query($baseSelect . " ORDER BY c.date DESC, c.id DESC");
        if (!$res) {
            json_out(['success' => false, 'error' => 'Query fehlgeschlagen: ' . $mysqli->error], 500);
        }
        $list = $res->fetch_all(MYSQLI_ASSOC);
        // Boolean-Konvertierung
        foreach ($list as &$cert) {
            $cert['isManual'] = (bool)$cert['isManual'];
        }
        json_out($list);
    }
    
    // Sonst nur eigene Urkunden
    if ($viewerId && has_permission($mysqli, 'view_own_certificates')) {
        $stmt = $mysqli->prepare($baseSelect . " WHERE c.user_id = ? ORDER BY c.date DESC, c.id DESC");
        $stmt->bind_param('i', $viewerId);
        $stmt->execute();
        $list = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        // Boolean-Konvertierung
        foreach ($list as &$cert) {
            $cert['isManual'] = (bool)$cert['isManual'];
        }
        json_out($list);
    }
    
    json_error('Keine Berechtigung', 403);
}

// POST: Manuelle Urkunde erstellen (nur Trainer/Admin)
if ($method === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : 'create';
    
    // Einstellungen speichern (nur Admin)
    if ($action === 'saveSettings') {
        require_permission($mysqli, 'manage_settings');
        
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
    
    // Manuelle Urkunde erstellen
    if ($action === 'create') {
        require_permission($mysqli, 'create_certificates');
        
        require_fields($body, ['userId', 'title', 'date', 'level', 'instructor']);
        
        $date = normalize_date($body['date']);
        if (!$date) json_error('Ungültiges Datum', 400);
        
        // Grade-ID aus dem Namen ermitteln
        $gradeId = null;
        if (!empty($body['level'])) {
            $gradeStmt = $mysqli->prepare("SELECT id FROM grade WHERE name = ? LIMIT 1");
            $gradeStmt->bind_param('s', $body['level']);
            $gradeStmt->execute();
            $gradeRes = $gradeStmt->get_result()->fetch_assoc();
            if ($gradeRes) {
                $gradeId = (int)$gradeRes['id'];
            }
        }
        
        $category = isset($body['category']) ? $body['category'] : null;
        
        $stmt = $mysqli->prepare("INSERT INTO certificates (user_id, exam_id, title, date, grade_id, instructor, category, is_manual) VALUES (?, NULL, ?, ?, ?, ?, ?, 1)");
        $stmt->bind_param('ississ', $body['userId'], $body['title'], $date, $gradeId, $body['instructor'], $category);
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Insert fehlgeschlagen: ' . $stmt->error], 500);
        }
        json_out(['success' => true, 'id' => $stmt->insert_id]);
    }
    
    json_error('Unbekannte Aktion', 400);
}

// DELETE: Urkunde löschen (nur manuelle Urkunden, nur Admin)
if ($method === 'DELETE') {
    require_permission($mysqli, 'delete_certificates');
    
    $body = read_json_body();
    if (empty($body['id'])) json_error('ID fehlt', 400);
    
    // Prüfe ob es eine manuelle Urkunde ist
    $checkStmt = $mysqli->prepare("SELECT is_manual FROM certificates WHERE id = ? LIMIT 1");
    $checkStmt->bind_param('i', $body['id']);
    $checkStmt->execute();
    $result = $checkStmt->get_result()->fetch_assoc();
    
    if (!$result) json_error('Urkunde nicht gefunden', 404);
    
    // Automatische Urkunden können nicht gelöscht werden (nur durch Löschen der Prüfung)
    if (!$result['is_manual']) {
        json_error('Automatische Urkunden können nicht manuell gelöscht werden. Löschen Sie stattdessen die zugehörige Prüfung.', 400);
    }
    
    $stmt = $mysqli->prepare("DELETE FROM certificates WHERE id = ? AND is_manual = 1");
    $stmt->bind_param('i', $body['id']);
    if (!$stmt->execute()) json_error('Löschen fehlgeschlagen: ' . $stmt->error, 500);
    json_out(['success' => true]);
}

json_out(['success' => false, 'error' => 'Nur GET/POST/DELETE erlaubt'], 405);
?>
