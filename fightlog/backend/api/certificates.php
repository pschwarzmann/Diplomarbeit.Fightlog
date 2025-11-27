<?php
// backend/api/certificates.php
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_out(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen: ' . $e->getMessage()], 500);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $res = $mysqli->query("SELECT id, user_id as userId, title, type, date, level, instructor, file_url as fileUrl, preview, status FROM certificates ORDER BY date DESC, id DESC");
    if (!$res) {
        json_out(['success' => false, 'error' => 'Query fehlgeschlagen: ' . $mysqli->error], 500);
    }
    $list = $res->fetch_all(MYSQLI_ASSOC);
    json_out($list);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

json_out(['success'=>false, 'error'=>'Nur GET/POST erlaubt'], 405);
?>
