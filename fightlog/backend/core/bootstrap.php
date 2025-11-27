<?php
// backend/core/bootstrap.php
declare(strict_types=1);

use Fightlog\Core\Database;

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/request.php';
require_once __DIR__ . '/../services/AuthService.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db(): mysqli
{
    static $connection = null;

    if ($connection instanceof mysqli) {
        return $connection;
    }

    $connection = Database::getConnection();
    return $connection;
}

function auth_user_id(mysqli $mysqli): ?int
{
    return AuthService::getAuthenticatedUserId($mysqli);
}

