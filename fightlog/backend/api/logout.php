<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// For demo: nothing to do server-side. Client should remove token/localStorage.
echo json_encode(['success'=>true]);

?>
