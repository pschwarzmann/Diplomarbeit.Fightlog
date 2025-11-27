<?php
// backend/api/upload.php
// Für die Demo speichern wir nur Metadaten per JSON (kein echter Datei-Upload)
require_once __DIR__ . '/../core/bootstrap.php';
$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['success'=>false, 'error'=>'Nur POST erlaubt'], 405);
}
$body = read_json_body();
require_fields($body, ['userId','title','type','date','level','instructor']);
$body['preview'] = isset($body['preview']) ? $body['preview'] : '📄';
$body['status'] = isset($body['status']) ? $body['status'] : 'pending';

$stmt = $mysqli->prepare("INSERT INTO certificates (user_id, title, type, date, level, instructor, file_url, preview, status) VALUES (?,?,?,?,?,?,?,?,?)");
$fileUrl = isset($body['fileUrl']) ? $body['fileUrl'] : null;
$stmt->bind_param('issssssss', $body['userId'], $body['title'], $body['type'], $body['date'], $body['level'], $body['instructor'], $fileUrl, $body['preview'], $body['status']);
if (!$stmt->execute()) {
    json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
}
json_out(['success'=>true, 'id'=>$stmt->insert_id]);
?>
