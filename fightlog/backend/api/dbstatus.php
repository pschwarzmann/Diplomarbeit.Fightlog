<?php
require_once __DIR__ . '/../core/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');
try {
    $mysqli = db();
    $r = $mysqli->query("SELECT NOW() AS now");
    $row = $r->fetch_assoc();
    echo json_encode(['ok'=>true,'now'=>$row['now']], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
}
