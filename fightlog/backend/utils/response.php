<?php
// backend/utils/response.php

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
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


