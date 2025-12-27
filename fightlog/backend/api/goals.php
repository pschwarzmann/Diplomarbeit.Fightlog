<?php
require_once __DIR__ . '/../core/bootstrap.php';
$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];

function get_user_role($mysqli, $uid){
    if (!$uid) return null;
    $stmt = $mysqli->prepare("SELECT role FROM users WHERE id=? LIMIT 1");
    $stmt->bind_param('i',$uid);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) return $row['role'];
    return null;
}

if ($method === 'GET'){
    $viewerId = auth_user_id($mysqli);
    $viewerRole = get_user_role($mysqli, $viewerId);

    // SQL mit JOIN für Benutzername/Name
    $baseSelect = "SELECT g.id, g.user_id as userId, g.title, g.target_date as targetDate, g.progress, g.category, g.status,
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as ownerName, u.username as ownerUsername
                   FROM goals g 
                   LEFT JOIN users u ON g.user_id = u.id";

    if (isset($_GET['userId']) && $_GET['userId'] !== '') {
        $userId = (int)$_GET['userId'];
        $stmt = $mysqli->prepare($baseSelect . " WHERE g.user_id=? AND g.status != 'cancelled' ORDER BY g.target_date DESC, g.id DESC");
        $stmt->bind_param('i',$userId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    // Schüler und Trainer sehen nur ihre eigenen Ziele
    if (($viewerRole === 'schueler' || $viewerRole === 'trainer') && $viewerId) {
        $stmt = $mysqli->prepare($baseSelect . " WHERE g.user_id=? AND g.status != 'cancelled' ORDER BY g.target_date DESC, g.id DESC");
        $stmt->bind_param('i',$viewerId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    // Admin sieht alle Ziele (außer cancelled)
    $res = $mysqli->query($baseSelect . " WHERE g.status != 'cancelled' ORDER BY g.target_date DESC, g.id DESC");
    if (!$res) json_error('DB-Fehler: '.$mysqli->error, 500);
    json_ok($res->fetch_all(MYSQLI_ASSOC));
}

if ($method === 'POST'){
    $b = body_json();
    if (empty($b['userId'])) { $b['userId'] = auth_user_id($mysqli) ?? 1; }
    foreach (['userId','title','targetDate','progress','category'] as $r) {
        if (!isset($b[$r]) || $b[$r] === '') json_error('Feld fehlt: '.$r, 400);
    }
    $targetDate = normalize_date($b['targetDate']);
    if (!$targetDate) json_error('Ungültiges Datum', 400);
    
    // Setze Status auf completed wenn progress 100% ist
    $progress = (int)$b['progress'];
    $status = $progress >= 100 ? 'completed' : ($b['status'] ?? 'in_progress');
    
    $stmt = $mysqli->prepare("INSERT INTO goals (user_id, title, target_date, progress, category, status) VALUES (?,?,?,?,?,?)");
    if (!$stmt) json_error('Prepare fehlgeschlagen: '.$mysqli->error, 500);
    $stmt->bind_param('ississ', $b['userId'], $b['title'], $targetDate, $progress, $b['category'], $status);
    if (!$stmt->execute()) json_error('Insert fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true,'id'=>$stmt->insert_id]);
}

// PUT: Ziel aktualisieren (inkl. auto-complete bei 100%)
if ($method === 'PUT') {
    $b = body_json();
    if (empty($b['id'])) json_error('ID fehlt', 400);
    
    $progress = isset($b['progress']) ? (int)$b['progress'] : null;
    
    // Wenn progress übergeben wird, aktualisiere progress und ggf. status
    if ($progress !== null) {
        $status = $progress >= 100 ? 'completed' : 'in_progress';
        $stmt = $mysqli->prepare("UPDATE goals SET progress=?, status=? WHERE id=?");
        if (!$stmt) json_error('Prepare fehlgeschlagen: '.$mysqli->error, 500);
        $stmt->bind_param('isi', $progress, $status, $b['id']);
        if (!$stmt->execute()) json_error('Update fehlgeschlagen: '.$stmt->error, 500);
        json_ok(['success'=>true]);
    }
    
    json_error('Keine Änderungen angegeben', 400);
}

// DELETE: Ziel als cancelled markieren
if ($method === 'DELETE') {
    $b = body_json();
    if (empty($b['id'])) json_error('ID fehlt', 400);
    $stmt = $mysqli->prepare("UPDATE goals SET status='cancelled' WHERE id=?");
    $stmt->bind_param('i', $b['id']);
    if (!$stmt->execute()) json_error('Löschen fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true]);
}

json_error('Nicht erlaubt', 405);
