<?php
// backend/errors/handle_error.php
// Zentrale Fehlerbehandlung

function handle_error(int $code, string $message = ''): void
{
    // Prüfe ob es ein API-Call ist
    $isApiCall = (
        isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false
    ) || (
        isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest'
    ) || (
        isset($_SERVER['HTTP_CONTENT_TYPE']) && strpos($_SERVER['HTTP_CONTENT_TYPE'], 'application/json') !== false
    );
    
    if ($isApiCall) {
        // JSON-Response für API-Calls
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=utf-8');
        }
        
        $errorMessages = [
            404 => 'Ressource nicht gefunden',
            500 => 'Interner Serverfehler',
            403 => 'Zugriff verweigert',
            401 => 'Nicht authentifiziert'
        ];
        
        echo json_encode([
            'success' => false,
            'error' => $message ?: ($errorMessages[$code] ?? 'Ein Fehler ist aufgetreten'),
            'code' => $code
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } else {
        // HTML-Fehlerseite für Browser-Aufrufe
        $errorFile = __DIR__ . "/{$code}.html";
        if (file_exists($errorFile)) {
            if (!headers_sent()) {
                http_response_code($code);
                header('Content-Type: text/html; charset=utf-8');
            }
            readfile($errorFile);
            exit;
        } else {
            // Fallback: Einfache HTML-Fehlerseite
            if (!headers_sent()) {
                http_response_code($code);
                header('Content-Type: text/html; charset=utf-8');
            }
            echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Fehler {$code}</title></head><body><h1>Fehler {$code}</h1><p>" . htmlspecialchars($message ?: 'Ein Fehler ist aufgetreten') . "</p></body></html>";
            exit;
        }
    }
}
