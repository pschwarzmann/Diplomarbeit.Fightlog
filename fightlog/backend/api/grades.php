<?php
// backend/api/grades.php
// API für Grad-Verwaltung (Gürtelgrade)

require_once __DIR__ . '/../core/bootstrap.php';

$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];
$userId = auth_user_id($mysqli);
$userRole = auth_user_role($mysqli);

// =============================================
// GET - Grade abrufen
// =============================================
if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : 'list';
    
    // Alle Grade abrufen
    if ($action === 'list') {
        $res = $mysqli->query("SELECT id, name, sort_order, color FROM grade ORDER BY sort_order ASC");
        if (!$res) {
            json_out(['success' => false, 'error' => 'DB-Fehler: ' . $mysqli->error], 500);
        }
        
        $grades = [];
        while ($row = $res->fetch_assoc()) {
            $row['id'] = (int)$row['id'];
            $row['sort_order'] = (int)$row['sort_order'];
            $grades[] = $row;
        }
        
        json_out(['success' => true, 'grades' => $grades]);
    }
    
    // Einzelnen Grad abrufen
    if ($action === 'get') {
        $gradeId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
        if (!$gradeId) {
            json_out(['success' => false, 'error' => 'ID erforderlich'], 400);
        }
        
        $stmt = $mysqli->prepare("SELECT id, name, sort_order, color FROM grade WHERE id = ?");
        $stmt->bind_param('i', $gradeId);
        $stmt->execute();
        $grade = $stmt->get_result()->fetch_assoc();
        
        if (!$grade) {
            json_out(['success' => false, 'error' => 'Grad nicht gefunden'], 404);
        }
        
        $grade['id'] = (int)$grade['id'];
        $grade['sort_order'] = (int)$grade['sort_order'];
        
        json_out(['success' => true, 'grade' => $grade]);
    }
    
    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

// =============================================
// POST - Grad erstellen/aktualisieren (nur Admin)
// =============================================
if ($method === 'POST') {
    if ($userRole !== 'admin') {
        json_out(['success' => false, 'error' => 'Keine Berechtigung'], 403);
    }
    
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : 'create';
    
    // Neuen Grad erstellen
    if ($action === 'create') {
        $name = isset($body['name']) ? trim($body['name']) : '';
        $sortOrder = isset($body['sort_order']) ? (int)$body['sort_order'] : 0;
        $color = isset($body['color']) ? trim($body['color']) : null;
        
        if (!$name) {
            json_out(['success' => false, 'error' => 'Name erforderlich'], 400);
        }
        
        $stmt = $mysqli->prepare("INSERT INTO grade (name, sort_order, color) VALUES (?, ?, ?)");
        $stmt->bind_param('sis', $name, $sortOrder, $color);
        
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        json_out(['success' => true, 'id' => $stmt->insert_id]);
    }
    
    // Grad aktualisieren
    if ($action === 'update') {
        $gradeId = isset($body['id']) ? (int)$body['id'] : 0;
        $name = isset($body['name']) ? trim($body['name']) : '';
        $sortOrder = isset($body['sort_order']) ? (int)$body['sort_order'] : 0;
        $color = isset($body['color']) ? trim($body['color']) : null;
        
        if (!$gradeId) {
            json_out(['success' => false, 'error' => 'ID erforderlich'], 400);
        }
        if (!$name) {
            json_out(['success' => false, 'error' => 'Name erforderlich'], 400);
        }
        
        $stmt = $mysqli->prepare("UPDATE grade SET name = ?, sort_order = ?, color = ? WHERE id = ?");
        $stmt->bind_param('sisi', $name, $sortOrder, $color, $gradeId);
        
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        json_out(['success' => true]);
    }
    
    // Grad löschen
    if ($action === 'delete') {
        $gradeId = isset($body['id']) ? (int)$body['id'] : 0;
        
        if (!$gradeId) {
            json_out(['success' => false, 'error' => 'ID erforderlich'], 400);
        }
        
        // Prüfen ob Grad verwendet wird
        $checkStmt = $mysqli->prepare("
            SELECT 
                (SELECT COUNT(*) FROM users WHERE grade_id = ?) +
                (SELECT COUNT(*) FROM exams WHERE grade_id = ?) +
                (SELECT COUNT(*) FROM certificates WHERE grade_id = ?) AS usage_count
        ");
        $checkStmt->bind_param('iii', $gradeId, $gradeId, $gradeId);
        $checkStmt->execute();
        $usage = $checkStmt->get_result()->fetch_assoc();
        
        if ($usage['usage_count'] > 0) {
            json_out(['success' => false, 'error' => 'Grad wird noch verwendet und kann nicht gelöscht werden'], 400);
        }
        
        $stmt = $mysqli->prepare("DELETE FROM grade WHERE id = ?");
        $stmt->bind_param('i', $gradeId);
        
        if (!$stmt->execute()) {
            json_out(['success' => false, 'error' => 'Fehler: ' . $stmt->error], 500);
        }
        
        json_out(['success' => true]);
    }
    
    json_out(['success' => false, 'error' => 'Unbekannte Aktion'], 400);
}

json_out(['success' => false, 'error' => 'Methode nicht erlaubt'], 405);
