<?php
// backend/api/goals.php
require_once __DIR__ . '/../db/config.php';
$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $res = $mysqli->query("SELECT id, user_id as userId, title, target_date as targetDate, progress, category, status FROM goals ORDER BY created_at DESC, id DESC");
    $list = $res->fetch_all(MYSQLI_ASSOC);
    json_out($list);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    // Wenn kein userId angegeben: 1 (Admin) als Demo
    if (!isset($body['userId'])) $body['userId'] = 1;
    require_fields($body, ['userId','title','targetDate','progress','category']);
    $status = isset($body['status']) ? $body['status'] : 'in_progress';

    $stmt = $mysqli->prepare("INSERT INTO goals (user_id, title, target_date, progress, category, status) VALUES (?,?,?,?,?,?)");
    $stmt->bind_param('ississ', $body['userId'], $body['title'], $body['targetDate'], $body['progress'], $body['category'], $status);
    if (!$stmt->execute()) {
        json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
    }
    json_out(['success'=>true, 'id'=>$stmt->insert_id]);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST erlaubt'], 405);
?>
