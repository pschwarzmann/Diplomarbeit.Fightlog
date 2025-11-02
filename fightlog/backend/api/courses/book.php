<?php
// POST /fightlog/backend/api/courses/book.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../db/storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['courseId']) || !isset($input['userId'])) {
        http_response_code(400); echo json_encode(['success'=>false,'error'=>'courseId and userId required']); exit;
    }
    $book = [ 'id' => time(), 'courseId' => $input['courseId'], 'userId' => $input['userId'], 'createdAt' => date('c') ];
    append_data('course_bookings', $book);
    echo json_encode(['success'=>true,'booking'=>$book]);
    exit;
}

http_response_code(405); echo json_encode(['error'=>'Method not allowed']);

?>
