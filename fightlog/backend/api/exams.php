<?php
require_once __DIR__ . '/_bootstrap.php';
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

    if (isset($_GET['userId']) && $_GET['userId'] !== '') {
        $userId = (int)$_GET['userId'];
        $stmt = $mysqli->prepare("SELECT id, user_id as userId, date, level, category, instructor, comments, status FROM exams WHERE user_id=? ORDER BY date DESC, id DESC");
        $stmt->bind_param('i',$userId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    if ($viewerRole === 'schueler' && $viewerId) {
        $stmt = $mysqli->prepare("SELECT id, user_id as userId, date, level, category, instructor, comments, status FROM exams WHERE user_id=? ORDER BY date DESC, id DESC");
        $stmt->bind_param('i',$viewerId);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        json_ok($rows);
    }

    $res = $mysqli->query("SELECT id, user_id as userId, date, level, category, instructor, comments, status FROM exams ORDER BY date DESC, id DESC");
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

json_error('Nicht erlaubt', 405);
