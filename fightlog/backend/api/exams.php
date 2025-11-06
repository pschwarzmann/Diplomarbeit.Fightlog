<?php
require_once __DIR__ . '/_bootstrap.php';
$mysqli = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET'){
    $res = $mysqli->query("SELECT id, user_id as userId, date, level, category, score, instructor, comments, status FROM exams ORDER BY date DESC, id DESC");
    $rows = $res->fetch_all(MYSQLI_ASSOC);
    json_ok($rows);
}

if ($method === 'POST') {
    $b = body_json();
    if (empty($b['userId'])) { $b['userId'] = auth_user_id($mysqli) ?? 1; }
    foreach (['userId','date','level','category','instructor'] as $r) {
        if (empty($b[$r])) json_error('Feld fehlt: '.$r, 400);
    }
    $date = normalize_date($b['date']);
    if (!$date) json_error('Ungültiges Datum', 400);
    $score = isset($b['score']) ? (int)$b['score'] : null;
    $comments = $b['comments'] ?? null;
    $status = $b['status'] ?? 'passed';
    $stmt = $mysqli->prepare("INSERT INTO exams (user_id, date, level, category, score, instructor, comments, status) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->bind_param('isssisss', $b['userId'], $date, $b['level'], $b['category'], $score, $b['instructor'], $comments, $status);
    if (!$stmt->execute()) json_error('Insert fehlgeschlagen: '.$stmt->error, 500);
    json_ok(['success'=>true,'id'=>$stmt->insert_id]);
}

json_error('Nicht erlaubt', 405);
