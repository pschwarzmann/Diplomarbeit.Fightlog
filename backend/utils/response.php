<?php
// backend/utils/response.php

function json_out(array $data, int $code = 200): void
{
    // Output-Buffer leeren falls vorhanden
    if (ob_get_level() > 0) {
        ob_clean();
    }
    
    // Prüfe ob es ein API-Call ist (Accept-Header oder X-Requested-With)
    $isApiCall = (
        isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
    ) || (
        isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    ) || (
        isset($_SERVER['HTTP_CONTENT_TYPE']) && strpos($_SERVER['HTTP_CONTENT_TYPE'], 'application/json') !== false
    );
    
    // Headers setzen (falls noch nicht gesetzt)
    if (!headers_sent()) {
        http_response_code($code);
        
        // Für API-Calls immer JSON, für Browser-Aufrufe HTML bei Fehlern
        if ($isApiCall || $code >= 400) {
            header('Content-Type: application/json; charset=utf-8');
        }
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


