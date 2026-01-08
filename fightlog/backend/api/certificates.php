<?php
// backend/api/certificates.php
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

$viewerId = auth_user_id($mysqli);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $baseSelect = "SELECT c.id, c.user_id as userId, c.title, c.type, c.date, c.level, c.instructor, c.file_url as fileUrl, c.preview, c.status,
                   CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as ownerName, u.username as ownerUsername
                   FROM certificates c
                   LEFT JOIN users u ON c.user_id = u.id";
    
    // Prüfe ob Benutzer alle Urkunden sehen darf
    if (has_permission($mysqli, 'view_all_certificates')) {
        $res = $mysqli->query($baseSelect . " ORDER BY c.date DESC, c.id DESC");
        if (!$res) {
            json_out(['success' => false, 'error' => 'Query fehlgeschlagen: ' . $mysqli->error], 500);
        }
        $list = $res->fetch_all(MYSQLI_ASSOC);
        json_out($list);
    }
    
    // Sonst nur eigene Urkunden
    if ($viewerId && has_permission($mysqli, 'view_own_certificates')) {
        $stmt = $mysqli->prepare($baseSelect . " WHERE c.user_id = ? ORDER BY c.date DESC, c.id DESC");
        $stmt->bind_param('i', $viewerId);
        $stmt->execute();
        $list = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_out($list);
    }
    
    json_error('Keine Berechtigung', 403);
}

if ($method === 'POST') {
    require_permission($mysqli, 'create_certificates');
    
    $body = read_json_body();
    require_fields($body, ['userId','title','type','date','level','instructor']);
    $status = isset($body['status']) ? $body['status'] : 'pending';
    $fileUrl = isset($body['fileUrl']) ? $body['fileUrl'] : null;
    $preview = isset($body['preview']) ? $body['preview'] : '📄';

    $stmt = $mysqli->prepare("INSERT INTO certificates (user_id, title, type, date, level, instructor, file_url, preview, status) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param('issssssss', $body['userId'], $body['title'], $body['type'], $body['date'], $body['level'], $body['instructor'], $fileUrl, $preview, $status);
    if (!$stmt->execute()) {
        json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
    }
    json_out(['success'=>true, 'id'=>$stmt->insert_id]);
}

// PUT: Urkunde bearbeiten
if ($method === 'PUT') {
    $body = read_json_body();
    if (empty($body['id'])) json_error('ID fehlt', 400);
    
    // Urkunden-Besitzer ermitteln
    $ownerStmt = $mysqli->prepare("SELECT user_id FROM certificates WHERE id = ? LIMIT 1");
    $ownerStmt->bind_param('i', $body['id']);
    $ownerStmt->execute();
    $ownerResult = $ownerStmt->get_result()->fetch_assoc();
    if (!$ownerResult) json_error('Urkunde nicht gefunden', 404);
    $ownerId = (int)$ownerResult['user_id'];
    
    // Berechtigungsprüfung
    if (!can_edit($mysqli, $ownerId, 'edit_own_certificates', 'edit_all_certificates')) {
        json_error('Keine Berechtigung zum Bearbeiten', 403);
    }
    
    require_fields($body, ['title','type','date','level','instructor']);
    $status = isset($body['status']) ? $body['status'] : 'pending';
    $fileUrl = isset($body['fileUrl']) ? $body['fileUrl'] : null;
    $preview = isset($body['preview']) ? $body['preview'] : '📄';
    
    $stmt = $mysqli->prepare("UPDATE certificates SET title=?, type=?, date=?, level=?, instructor=?, file_url=?, preview=?, status=? WHERE id=?");
    $stmt->bind_param('ssssssssi', $body['title'], $body['type'], $body['date'], $body['level'], $body['instructor'], $fileUrl, $preview, $status, $body['id']);
    if (!$stmt->execute()) {
        json_out(['success'=>false, 'error'=>'Update fehlgeschlagen: '.$stmt->error], 500);
    }
    json_out(['success'=>true]);
}

// DELETE: Urkunde löschen
if ($method === 'DELETE') {
    require_permission($mysqli, 'delete_certificates');
    
    $body = read_json_body();
    if (empty($body['id'])) json_error('ID fehlt', 400);
    
    $stmt = $mysqli->prepare("DELETE FROM certificates WHERE id=?");
    $stmt->bind_param('i', $body['id']);
    if (!$stmt->execute()) json_error('Löschen fehlgeschlagen: '.$stmt->error, 500);
    json_out(['success'=>true]);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST/PUT/DELETE erlaubt'], 405);
?>
