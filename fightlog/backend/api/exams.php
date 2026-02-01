<?php
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_error('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage(), 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$viewerId = auth_user_id($mysqli);

if ($method === 'GET'){
    // SQL mit JOIN für Schülername und Grade-Name
    $baseSelect = "SELECT e.id, e.user_id as userId, e.date, e.grade_id, g.name as level, e.category, e.instructor, e.comments, e.status, 
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as studentName, u.username as studentUsername
                   FROM exams e 
                   LEFT JOIN users u ON e.user_id = u.id
                   LEFT JOIN grade g ON e.grade_id = g.id";

    // Wenn explizit eine userId angefragt wird
    if (isset($_GET['userId']) && $_GET['userId'] !== '') {
        $userId = (int)$_GET['userId'];
        
        // Berechtigungsprüfung: eigene oder fremde Daten?
        if ($userId !== $viewerId && !has_permission($mysqli, 'view_all_exams')) {
            json_error('Keine Berechtigung für fremde Prüfungen', 403);
        }
        
        $stmt = $mysqli->prepare($baseSelect . " WHERE e.user_id=? ORDER BY e.date DESC, e.id DESC");
        $stmt->bind_param('i',$userId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    // Prüfe ob Benutzer alle Prüfungen sehen darf
    if (has_permission($mysqli, 'view_all_exams')) {
        $res = $mysqli->query($baseSelect . " ORDER BY e.date DESC, e.id DESC");
        if (!$res) json_error('DB-Fehler: '.$mysqli->error, 500);
        json_ok($res->fetch_all(MYSQLI_ASSOC));
    }

    // Sonst nur eigene Prüfungen
    if ($viewerId && has_permission($mysqli, 'view_own_exams')) {
        $stmt = $mysqli->prepare($baseSelect . " WHERE e.user_id=? ORDER BY e.date DESC, e.id DESC");
        $stmt->bind_param('i',$viewerId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    json_error('Keine Berechtigung', 403);
}

if ($method === 'POST') {
    require_permission($mysqli, 'create_exams');
    
    $b = body_json();
    if (empty($b['userId'])) { $b['userId'] = $viewerId ?? 1; }
    foreach (['userId','date','level','category','instructor'] as $r) {
        if (!isset($b[$r]) || $b[$r]==='') json_error('Feld fehlt: '.$r, 400);
    }
    $date = normalize_date($b['date']);
    if (!$date) json_error('Ungültiges Datum', 400);
    
    // Grade-ID aus dem Namen ermitteln
    $gradeId = null;
    if (!empty($b['level'])) {
        $gradeStmt = $mysqli->prepare("SELECT id FROM grade WHERE name = ? LIMIT 1");
        $gradeStmt->bind_param('s', $b['level']);
        $gradeStmt->execute();
        $gradeRes = $gradeStmt->get_result()->fetch_assoc();
        if ($gradeRes) {
            $gradeId = (int)$gradeRes['id'];
        }
    }
    
    $comments = $b['comments'] ?? null;
    $status = $b['status'] ?? 'passed';
    $stmt = $mysqli->prepare("INSERT INTO exams (user_id, date, grade_id, category, instructor, comments, status) VALUES (?,?,?,?,?,?,?)");
    if (!$stmt) json_error('Prepare fehlgeschlagen: '.$mysqli->error, 500);
    $stmt->bind_param('isissss', $b['userId'], $date, $gradeId, $b['category'], $b['instructor'], $comments, $status);
    if (!$stmt->execute()) json_error('Insert fehlgeschlagen: '.$stmt->error, 500);
    
    $examId = $stmt->insert_id;
    
    // Automatisch Urkunde erstellen wenn Prüfung bestanden
    if ($status === 'passed') {
        $certTitle = $b['level'] . ' - ' . $b['category'] . ' Prüfung';
        $certStmt = $mysqli->prepare("INSERT INTO certificates (user_id, exam_id, title, date, grade_id, instructor, category, is_manual) VALUES (?,?,?,?,?,?,?,0)");
        if ($certStmt) {
            $certStmt->bind_param('iississ', $b['userId'], $examId, $certTitle, $date, $gradeId, $b['instructor'], $b['category']);
            $certStmt->execute(); // Fehler ignorieren, Prüfung wurde trotzdem erstellt
        }
    }
    
    json_ok(['success'=>true,'id'=>$examId]);
}

// PUT: Prüfung bearbeiten
if ($method === 'PUT') {
    $b = body_json();
    if (empty($b['id'])) json_error('ID fehlt', 400);
    
    // Prüfungsbesitzer und alten Status ermitteln
    $ownerStmt = $mysqli->prepare("SELECT user_id, status as old_status FROM exams WHERE id = ? LIMIT 1");
    $ownerStmt->bind_param('i', $b['id']);
    $ownerStmt->execute();
    $ownerResult = $ownerStmt->get_result()->fetch_assoc();
    if (!$ownerResult) json_error('Prüfung nicht gefunden', 404);
    $ownerId = (int)$ownerResult['user_id'];
    $oldStatus = $ownerResult['old_status'];
    
    // Berechtigungsprüfung
    if (!can_edit($mysqli, $ownerId, 'edit_own_exams', 'edit_all_exams')) {
        json_error('Keine Berechtigung zum Bearbeiten', 403);
    }
    
    foreach (['userId','date','level','category','instructor'] as $r) {
        if (!isset($b[$r]) || $b[$r]==='') json_error('Feld fehlt: '.$r, 400);
    }
    $date = normalize_date($b['date']);
    if (!$date) json_error('Ungültiges Datum', 400);
    
    // Grade-ID aus dem Namen ermitteln
    $gradeId = null;
    if (!empty($b['level'])) {
        $gradeStmt = $mysqli->prepare("SELECT id FROM grade WHERE name = ? LIMIT 1");
        $gradeStmt->bind_param('s', $b['level']);
        $gradeStmt->execute();
        $gradeRes = $gradeStmt->get_result()->fetch_assoc();
        if ($gradeRes) {
            $gradeId = (int)$gradeRes['id'];
        }
    }
    
    $comments = $b['comments'] ?? null;
    $status = $b['status'] ?? 'passed';
    $stmt = $mysqli->prepare("UPDATE exams SET user_id=?, date=?, grade_id=?, category=?, instructor=?, comments=?, status=? WHERE id=?");
    if (!$stmt) json_error('Prepare fehlgeschlagen: '.$mysqli->error, 500);
    $stmt->bind_param('isisssis', $b['userId'], $date, $gradeId, $b['category'], $b['instructor'], $comments, $status, $b['id']);
    if (!$stmt->execute()) json_error('Update fehlgeschlagen: '.$stmt->error, 500);
    
    // Wenn Status von nicht-bestanden auf bestanden geändert wurde, Urkunde erstellen
    if ($status === 'passed' && $oldStatus !== 'passed') {
        // Prüfe ob bereits eine Urkunde für diese Prüfung existiert
        $checkCert = $mysqli->prepare("SELECT id FROM certificates WHERE exam_id = ? LIMIT 1");
        $checkCert->bind_param('i', $b['id']);
        $checkCert->execute();
        if ($checkCert->get_result()->num_rows === 0) {
            $certTitle = $b['level'] . ' - ' . $b['category'] . ' Prüfung';
            $certStmt = $mysqli->prepare("INSERT INTO certificates (user_id, exam_id, title, date, grade_id, instructor, category, is_manual) VALUES (?,?,?,?,?,?,?,0)");
            if ($certStmt) {
                $certStmt->bind_param('iississ', $b['userId'], $b['id'], $certTitle, $date, $gradeId, $b['instructor'], $b['category']);
                $certStmt->execute();
            }
        }
    }
    
    json_ok(['success'=>true]);
}

// DELETE: Prüfung löschen
if ($method === 'DELETE') {
    require_permission($mysqli, 'delete_exams');
    
    $b = body_json();
    if (empty($b['id'])) json_error('ID fehlt', 400);
    $stmt = $mysqli->prepare("DELETE FROM exams WHERE id=?");
    $stmt->bind_param('i', $b['id']);
    if (!$stmt->execute()) json_error('Löschen fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true]);
}

json_error('Nicht erlaubt', 405);
