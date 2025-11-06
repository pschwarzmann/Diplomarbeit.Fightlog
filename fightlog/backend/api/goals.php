<?php
require_once __DIR__ . '/_bootstrap.php';
$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];

function fetch_goals($mysqli, $userId){
    $stmt = $mysqli->prepare("SELECT g.id, g.user_id as userId, g.title, g.target_date as targetDate, g.progress, g.category, g.status
        FROM goals g WHERE g.user_id=? ORDER BY g.target_date DESC, g.id DESC");
    $stmt->bind_param('i',$userId);
    $stmt->execute();
    $res = $stmt->get_result();
    return $res->fetch_all(MYSQLI_ASSOC);
}

if ($method === 'GET'){
    $userId = isset($_GET['userId']) ? (int)$_GET['userId'] : (auth_user_id($mysqli) ?? 1);
    $rows = fetch_goals($mysqli, $userId);
    json_ok($rows); // <-- flat array
}

if ($method === 'POST'){
    $b = body_json();
    if (empty($b['userId'])) { $b['userId'] = auth_user_id($mysqli) ?? 1; }
    foreach (['userId','title','targetDate','progress','category'] as $r) {
        if (!isset($b[$r]) || $b[$r] === '') json_error('Feld fehlt: '.$r, 400);
    }
    $targetDate = normalize_date($b['targetDate']);
    if (!$targetDate) json_error('Ungültiges Datum', 400);
    $status = $b['status'] ?? 'in_progress';
    $stmt = $mysqli->prepare("INSERT INTO goals (user_id, title, target_date, progress, category, status) VALUES (?,?,?,?,?,?)");
    $stmt->bind_param('ississ', $b['userId'], $b['title'], $targetDate, $b['progress'], $b['category'], $status);
    if (!$stmt->execute()) json_error('Insert fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true,'id'=>$stmt->insert_id]);
}

json_error('Nicht erlaubt', 405);
