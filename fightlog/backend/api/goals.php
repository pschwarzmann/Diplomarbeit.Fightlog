<?php
require_once __DIR__ . '/../core/bootstrap.php';
$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];
$viewerId = auth_user_id($mysqli);

if ($method === 'GET'){
    // SQL mit JOIN für Benutzername/Name
    $baseSelect = "SELECT g.id, g.user_id as userId, g.title, g.target_date as targetDate, g.progress, g.category, g.status,
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as ownerName, u.username as ownerUsername
                   FROM goals g 
                   LEFT JOIN users u ON g.user_id = u.id";

    if (isset($_GET['userId']) && $_GET['userId'] !== '') {
        $userId = (int)$_GET['userId'];
        
        // Berechtigungsprüfung: eigene oder fremde Daten?
        if ($userId !== $viewerId && !has_permission($mysqli, 'view_all_goals')) {
            json_error('Keine Berechtigung für fremde Ziele', 403);
        }
        
        $stmt = $mysqli->prepare($baseSelect . " WHERE g.user_id=? AND g.status != 'cancelled' ORDER BY g.target_date DESC, g.id DESC");
        $stmt->bind_param('i',$userId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    // Prüfe ob Benutzer alle Ziele sehen darf
    if (has_permission($mysqli, 'view_all_goals')) {
        $res = $mysqli->query($baseSelect . " WHERE g.status != 'cancelled' ORDER BY g.target_date DESC, g.id DESC");
        if (!$res) json_error('DB-Fehler: '.$mysqli->error, 500);
        json_ok($res->fetch_all(MYSQLI_ASSOC));
    }

    // Sonst nur eigene Ziele
    if ($viewerId && has_permission($mysqli, 'view_own_goals')) {
        $stmt = $mysqli->prepare($baseSelect . " WHERE g.user_id=? AND g.status != 'cancelled' ORDER BY g.target_date DESC, g.id DESC");
        $stmt->bind_param('i',$viewerId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    json_error('Keine Berechtigung', 403);
}

if ($method === 'POST'){
    require_permission($mysqli, 'create_goals');
    
    $b = body_json();
    // Wenn keine userId angegeben, verwende die des eingeloggten Benutzers
    if (empty($b['userId'])) { $b['userId'] = $viewerId; }
    
    // Prüfen ob für sich selbst oder andere erstellt wird
    if ((int)$b['userId'] !== $viewerId && !has_permission($mysqli, 'edit_all_goals')) {
        json_error('Keine Berechtigung, Ziele für andere zu erstellen', 403);
    }
    
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
    
    // Ziel-Besitzer ermitteln
    $ownerStmt = $mysqli->prepare("SELECT user_id FROM goals WHERE id = ? LIMIT 1");
    $ownerStmt->bind_param('i', $b['id']);
    $ownerStmt->execute();
    $ownerResult = $ownerStmt->get_result()->fetch_assoc();
    if (!$ownerResult) json_error('Ziel nicht gefunden', 404);
    $ownerId = (int)$ownerResult['user_id'];
    
    // Berechtigungsprüfung
    if (!can_edit($mysqli, $ownerId, 'edit_own_goals', 'edit_all_goals')) {
        json_error('Keine Berechtigung zum Bearbeiten', 403);
    }
    
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
    
    // Ziel-Besitzer ermitteln
    $ownerStmt = $mysqli->prepare("SELECT user_id FROM goals WHERE id = ? LIMIT 1");
    $ownerStmt->bind_param('i', $b['id']);
    $ownerStmt->execute();
    $ownerResult = $ownerStmt->get_result()->fetch_assoc();
    if (!$ownerResult) json_error('Ziel nicht gefunden', 404);
    $ownerId = (int)$ownerResult['user_id'];
    
    // Berechtigungsprüfung: eigene löschen oder alle löschen
    if ($ownerId === $viewerId) {
        require_permission($mysqli, 'delete_goals');
    } else {
        // Für fremde Ziele braucht man delete_goals UND edit_all_goals
        if (!has_permission($mysqli, 'delete_goals') || !has_permission($mysqli, 'edit_all_goals')) {
            json_error('Keine Berechtigung zum Löschen fremder Ziele', 403);
        }
    }
    
    $stmt = $mysqli->prepare("UPDATE goals SET status='cancelled' WHERE id=?");
    $stmt->bind_param('i', $b['id']);
    if (!$stmt->execute()) json_error('Löschen fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true]);
}

json_error('Nicht erlaubt', 405);
