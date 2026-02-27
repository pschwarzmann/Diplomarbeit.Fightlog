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
    $header = '';
    
    // Mehrere mögliche Quellen für den Authorization-Header prüfen
    // 1. Standard $_SERVER
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_AUTHORIZATION'];
    }
    // 2. Nach mod_rewrite (REDIRECT_ prefix)
    elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $header = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    // 3. Legacy-Variante
    elseif (!empty($_SERVER['Authorization'])) {
        $header = $_SERVER['Authorization'];
    }
    // 4. Workaround: X-Authorization Header (wird von Apache nicht gefiltert)
    elseif (!empty($_SERVER['HTTP_X_AUTHORIZATION'])) {
        $header = $_SERVER['HTTP_X_AUTHORIZATION'];
    }
    // 5. Apache-spezifisch via getallheaders()
    elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (!empty($headers['Authorization'])) {
            $header = $headers['Authorization'];
        } elseif (!empty($headers['authorization'])) {
            $header = $headers['authorization'];
        } elseif (!empty($headers['X-Authorization'])) {
            $header = $headers['X-Authorization'];
        }
    }
    // 6. Apache-spezifisch via apache_request_headers()
    elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (!empty($headers['Authorization'])) {
            $header = $headers['Authorization'];
        } elseif (!empty($headers['X-Authorization'])) {
            $header = $headers['X-Authorization'];
        }
    }

    if ($header && stripos($header, 'Bearer ') === 0) {
        return substr($header, 7);
    }

    return null;
}


