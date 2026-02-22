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
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['Authorization']
        ?? '';

    if (stripos($header, 'Bearer ') === 0) {
        return substr($header, 7);
    }

    return null;
}


