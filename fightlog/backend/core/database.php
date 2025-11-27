<?php
// backend/core/database.php

namespace Fightlog\Core;

use RuntimeException;

class Database
{
    private static ?\mysqli $connection = null;

    /**
     * Liefert eine wiederverwendbare mysqli-Instanz.
     */
    public static function getConnection(): \mysqli
    {
        if (self::$connection instanceof \mysqli) {
            return self::$connection;
        }

        $config = require __DIR__ . '/../config/database.php';

        $mysqli = @new \mysqli(
            $config['host'],
            $config['user'],
            $config['pass'],
            $config['name']
        );

        if ($mysqli->connect_errno) {
            throw new RuntimeException('DB-Verbindung fehlgeschlagen: ' . $mysqli->connect_error);
        }

        $charset = $config['charset'] ?? 'utf8mb4';
        $mysqli->set_charset($charset);

        self::$connection = $mysqli;
        return self::$connection;
    }
}


