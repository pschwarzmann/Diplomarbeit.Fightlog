<?php
// backend/api/courses.php
require_once __DIR__ . '/../db/config.php';
$mysqli = db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $res = $mysqli->query("SELECT id, title, instructor, date, duration, description, status, current_participants, max_participants FROM (
        SELECT sc.id, sc.title, sc.instructor, sc.date, sc.duration, sc.description, 'approved' AS status, sc.current_participants, sc.max_participants
        FROM special_courses sc
    ) x ORDER BY date DESC, id DESC");
    $list = $res->fetch_all(MYSQLI_ASSOC);
    json_out($list);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = read_json_body();
    $action = isset($body['action']) ? $body['action'] : 'add';

    if ($action === 'add') {
        require_fields($body, ['title','date','instructor']);
        $desc = isset($body['description']) ? $body['description'] : null;
        $status = isset($body['status']) ? $body['status'] : 'approved';
        $dur = isset($body['duration']) ? $body['duration'] : '—';
        $max = isset($body['max_participants']) ? (int)$body['max_participants'] : 30;
        $stmt = $mysqli->prepare("INSERT INTO special_courses (title, instructor, date, duration, max_participants, current_participants, price, description) VALUES (?,?,?,?,?,0,'0',?)");
        $stmt->bind_param('ssssiss', $body['title'], $body['instructor'], $body['date'], $dur, $max, $desc);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Insert fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true, 'id'=>$stmt->insert_id]);
    }

    if ($action === 'update') {
        require_fields($body, ['id','title']);
        $desc = isset($body['description']) ? $body['description'] : null;
        $instr = isset($body['instructor']) ? $body['instructor'] : null;
        $date  = isset($body['date']) ? $body['date'] : null;
        $stmt = $mysqli->prepare("UPDATE special_courses SET title=?, instructor=COALESCE(?, instructor), date=COALESCE(?, date), description=? WHERE id=?");
        $stmt->bind_param('ssssi', $body['title'], $instr, $date, $desc, $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Update fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true]);
    }

    if ($action === 'delete') {
        require_fields($body, ['id']);
        $stmt = $mysqli->prepare("DELETE FROM special_courses WHERE id=?");
        $stmt->bind_param('i', $body['id']);
        if (!$stmt->execute()) {
            json_out(['success'=>false, 'error'=>'Delete fehlgeschlagen: '.$stmt->error], 500);
        }
        json_out(['success'=>true]);
    }

    json_out(['success'=>false, 'error'=>'Unbekannte Aktion'], 400);
}

json_out(['success'=>false, 'error'=>'Nur GET/POST erlaubt'], 405);
?>
