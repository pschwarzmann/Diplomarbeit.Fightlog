<?php
// backend/db/config.php
// XAMPP default settings (adjust if you set a MySQL password)
$DB_HOST = '127.0.0.1';
$DB_USER = 'root';
$DB_PASS = ''; // XAMPP default: empty password
$DB_NAME = 'fightlog';
$DB_CHARSET = 'utf8mb4';

function db() {
    global $DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_CHARSET;
    $mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
    if ($mysqli->connect_errno) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'DB connection failed: '.$mysqli->connect_error]);
        exit;
    }
    $mysqli->set_charset($DB_CHARSET);
    return $mysqli;
}

function json_out($data, $code = 200){
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function read_json_body(){
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_fields($arr, $fields){
    foreach($fields as $f){
        if (!isset($arr[$f]) || $arr[$f] === '') {
            json_out(['success'=>false, 'error'=>'Feld fehlt: '.$f], 400);
        }
    }
}
?>
