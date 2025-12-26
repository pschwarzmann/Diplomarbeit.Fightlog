<?php
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_error('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage(), 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET'){
    $viewerId = auth_user_id($mysqli);
    $viewerRole = auth_user_role($mysqli);

    // SQL mit JOIN für Schülername
    $baseSelect = "SELECT e.id, e.user_id as userId, e.date, e.level, e.category, e.instructor, e.comments, e.status, 
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as studentName, u.username as studentUsername
                   FROM exams e 
                   LEFT JOIN users u ON e.user_id = u.id";

    // Wenn explizit eine userId angefragt wird
    if (isset($_GET['userId']) && $_GET['userId'] !== '') {
        $userId = (int)$_GET['userId'];
        $stmt = $mysqli->prepare($baseSelect . " WHERE e.user_id=? ORDER BY e.date DESC, e.id DESC");
        $stmt->bind_param('i',$userId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    // Schüler sehen nur eigene Prüfungen (nur wenn Rolle explizit 'schueler' ist)
    if ($viewerRole === 'schueler' && $viewerId) {
        $stmt = $mysqli->prepare($baseSelect . " WHERE e.user_id=? ORDER BY e.date DESC, e.id DESC");
        $stmt->bind_param('i',$viewerId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    // Trainer/Admin oder unbekannte Rolle: alle Prüfungen anzeigen
    $res = $mysqli->query($baseSelect . " ORDER BY e.date DESC, e.id DESC");
    if (!$res) json_error('DB-Fehler: '.$mysqli->error, 500);
    json_ok($res->fetch_all(MYSQLI_ASSOC));
}

if ($method === 'POST') {
    $b = body_json();
    if (empty($b['userId'])) { $b['userId'] = auth_user_id($mysqli) ?? 1; }
    foreach (['userId','date','level','category','instructor'] as $r) {
        if (!isset($b[$r]) || $b[$r]==='') json_error('Feld fehlt: '.$r, 400);
    }
    $date = normalize_date($b['date']);
    if (!$date) json_error('Ungültiges Datum', 400);
    $comments = $b['comments'] ?? null;
    $status = $b['status'] ?? 'passed';
    $stmt = $mysqli->prepare("INSERT INTO exams (user_id, date, level, category, instructor, comments, status) VALUES (?,?,?,?,?,?,?)");
    if (!$stmt) json_error('Prepare fehlgeschlagen: '.$mysqli->error, 500);
    $stmt->bind_param('issssss', $b['userId'], $date, $b['level'], $b['category'], $b['instructor'], $comments, $status);
    if (!$stmt->execute()) json_error('Insert fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true,'id'=>$stmt->insert_id]);
}

// PUT: Prüfung bearbeiten
if ($method === 'PUT') {
    $b = body_json();
    if (empty($b['id'])) json_error('ID fehlt', 400);
    foreach (['userId','date','level','category','instructor'] as $r) {
        if (!isset($b[$r]) || $b[$r]==='') json_error('Feld fehlt: '.$r, 400);
    }
    $date = normalize_date($b['date']);
    if (!$date) json_error('Ungültiges Datum', 400);
    $comments = $b['comments'] ?? null;
    $status = $b['status'] ?? 'passed';
    $stmt = $mysqli->prepare("UPDATE exams SET user_id=?, date=?, level=?, category=?, instructor=?, comments=?, status=? WHERE id=?");
    if (!$stmt) json_error('Prepare fehlgeschlagen: '.$mysqli->error, 500);
    $stmt->bind_param('issssssi', $b['userId'], $date, $b['level'], $b['category'], $b['instructor'], $comments, $status, $b['id']);
    if (!$stmt->execute()) json_error('Update fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true]);
}

// DELETE: Prüfung löschen
if ($method === 'DELETE') {
    $b = body_json();
    if (empty($b['id'])) json_error('ID fehlt', 400);
    $stmt = $mysqli->prepare("DELETE FROM exams WHERE id=?");
    $stmt->bind_param('i', $b['id']);
    if (!$stmt->execute()) json_error('Löschen fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true]);
}

json_error('Nicht erlaubt', 405);
