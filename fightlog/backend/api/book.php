<?php
// Duplicate endpoint kept for backward compatibility.
// Redirect client to the canonical route: /fightlog/backend/api/courses/book.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Send a 307 Temporary Redirect to the new canonical endpoint
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { echo json_encode(['ok'=>true]); exit; }

http_response_code(307);
header('Location: /fightlog/backend/api/courses/book.php');
echo json_encode(['success'=>false,'error'=>'moved','location'=>'/fightlog/backend/api/courses/book.php']);
exit;

?>
