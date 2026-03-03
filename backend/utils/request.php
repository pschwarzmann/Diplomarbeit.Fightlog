<?php
// backend/utils/request.php

function read_json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function body_json(): array
{
    return read_json_body();
}

function require_fields(array $payload, array $required): void
{
    foreach ($required as $field) {
        if (!isset($payload[$field]) || $payload[$field] === '') {
            json_error('Feld fehlt: ' . $field, 400);
        }
    }
}

function normalize_date($value): ?string
{
    if (!is_string($value)) {
        return null;
    }

    $value = trim($value);
    if ($value === '') {
        return null;
    }

    if (preg_match('/^(\\d{2})\\.(\\d{2})\\.(\\d{4})$/', $value, $matches)) {
        [$full, $d, $m, $y] = $matches;
        if (checkdate((int)$m, (int)$d, (int)$y)) {
            return sprintf('%04d-%02d-%02d', $y, $m, $d);
        }
        return null;
    }

    if (preg_match('/^(\\d{4})-(\\d{2})-(\\d{2})$/', $value, $matches)) {
        [$full, $y, $m, $d] = $matches;
        if (checkdate((int)$m, (int)$d, (int)$y)) {
            return $full;
        }
        return null;
    }

    return null;
}

function bearer_token(): ?string
{
    // Alle möglichen Quellen für den Authorization-Header sammeln.
    // WICHTIG: Nicht bei der ersten nicht-leeren Quelle stoppen,
    // da manche (z.B. mod_php SetEnv) einen kaputten Literal-String liefern.
    $candidates = [];
    
    // 1. Standard $_SERVER
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $candidates[] = $_SERVER['HTTP_AUTHORIZATION'];
    }
    // 2. Nach mod_rewrite (REDIRECT_ prefix)
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $candidates[] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    // 3. Legacy-Variante
    if (!empty($_SERVER['Authorization'])) {
        $candidates[] = $_SERVER['Authorization'];
    }
    // 4. Workaround: X-Authorization Header (wird von Apache nicht gefiltert)
    if (!empty($_SERVER['HTTP_X_AUTHORIZATION'])) {
        $candidates[] = $_SERVER['HTTP_X_AUTHORIZATION'];
    }
    // 5. Apache-spezifisch via getallheaders()
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (!empty($headers['Authorization']))   $candidates[] = $headers['Authorization'];
        if (!empty($headers['authorization']))   $candidates[] = $headers['authorization'];
        if (!empty($headers['X-Authorization'])) $candidates[] = $headers['X-Authorization'];
    }
    // 6. Apache-spezifisch via apache_request_headers()
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (!empty($headers['Authorization']))   $candidates[] = $headers['Authorization'];
        if (!empty($headers['X-Authorization'])) $candidates[] = $headers['X-Authorization'];
    }

    // Erste gültige "Bearer ..."-Quelle zurückgeben
    foreach ($candidates as $header) {
        if (is_string($header) && stripos($header, 'Bearer ') === 0) {
            return substr($header, 7);
        }
    }

    return null;
}


