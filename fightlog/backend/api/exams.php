<?php
// backend/api/exams.php
require_once __DIR__ . '/../db/config.php';
$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $res = $mysqli->query("SELECT id, user_id as userId, date, level, category, score, instructor, comments, status FROM exams ORDER BY date DESC, id DESC");
    $list = $res->fetch_all(MYSQLI_ASSOC);
    json_out($list);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    require_fields($body, ['userId','date','level','category','score','instructor']);
    $comments = isset($body['comments']) ? $body['comments'] : null;
    $status = isset($body['status']) ? $body['status'] : 'passed';

    $stmt = $mysqli->prepare("INSERT INTO exams (user_id, date, level, category, score, instructor, comments, status) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->bind_param('isssiiss', $body['userId'], $body['date'], $body['level'], $body['category'], $body['score'], $body['instructor'], $comments, $status);
    if (!$stmt->execute()) {
        json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
    }
    json_out(['success'=>true, 'id'=>$stmt->insert_id]);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST erlaubt'], 405);
?>
