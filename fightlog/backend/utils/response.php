<?php
// backend/utils/response.php

function json_out(array $data, int $code = 200): void
{
    // Output-Buffer leeren falls vorhanden
    if (ob_get_level() > 0) {
        ob_clean();
    }
    
    // Headers setzen (falls noch nicht gesetzt)
    if (!headers_sent()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
    }
    
    // JSON ausgeben
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    
    // Output-Buffer flushen und beenden
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
    
    exit;
}

function json_ok($data = [], int $code = 200): void
{
    json_out($data, $code);
}

function json_error(string $message, int $code = 400, array $extra = []): void
{
    json_out(array_merge(['success' => false, 'error' => $message], $extra), $code);
}


