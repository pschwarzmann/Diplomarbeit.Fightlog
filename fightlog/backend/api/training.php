<?php
require_once __DIR__ . '/../core/bootstrap.php';

try {
    $mysqli = db();
} catch (Throwable $e) {
    json_error('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage(), 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Nur GET erlaubt', 405);
$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : null;
if (!$userId) json_error('userId fehlt', 400);
$stmt = $mysqli->prepare("SELECT id, user_id as userId, date, duration, type, instructor, focus, notes FROM training_history WHERE user_id=? ORDER BY date DESC, id DESC");
$stmt->bind_param('i',$userId);
$stmt->execute();
$res = $stmt->get_result();
json_ok($res->fetch_all(MYSQLI_ASSOC));
