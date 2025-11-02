<?php
// Storage helper that prefers a real database (MySQL via PDO) when configured,
// and falls back to simple file-based JSON storage under backend/data/.

define('DATA_DIR', __DIR__ . '/../data');

// Attempt to load DB config if present (create backend/db/config.php to enable DB)
$dbAvailable = false;
$db = null;
if (file_exists(__DIR__ . '/config.php')) {
    try {
        // Expect config.php to return an array: ['dsn'=>..., 'user'=>..., 'pass'=>...]
        $cfg = include __DIR__ . '/config.php';
        if (is_array($cfg) && !empty($cfg['dsn']) && isset($cfg['user']) && isset($cfg['pass'])) {
            $db = new PDO($cfg['dsn'], $cfg['user'], $cfg['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
            $dbAvailable = true;
        }
    } catch (Throwable $e) {
        // DB not available; we'll silently fall back to file storage
        error_log('DB connection failed: ' . $e->getMessage());
        $dbAvailable = false;
        $db = null;
    }
}

if (!file_exists(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// -- Read data: prefer DB when available
function read_data($name) {
    global $dbAvailable, $db;
    if ($dbAvailable && $db) {
        try {
            // Simple mapping: table name == $name
            $stmt = $db->query('SELECT * FROM ' . preg_replace('/[^a-z0-9_]/i', '', $name));
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            // convert snake_case columns to camelCase for frontend compatibility
            $out = [];
            foreach ($rows as $r) {
                $mapped = [];
                foreach ($r as $k => $v) {
                    $mapped[snake_to_camel($k)] = $v;
                }
                $out[] = $mapped;
            }
            return $out ?: [];
        } catch (Throwable $e) {
            error_log('DB read error for ' . $name . ': ' . $e->getMessage());
            // fall through to file fallback
        }
    }

    $path = DATA_DIR . '/' . $name . '.json';
    if (!file_exists($path)) return [];
    $txt = file_get_contents($path);
    $arr = json_decode($txt, true);
    return is_array($arr) ? $arr : [];
}

// helper: camelCase -> snake_case
function camel_to_snake($input) {
    $s = preg_replace('/([a-z0-9])([A-Z])/', '$1_$2', $input);
    $s = strtolower($s);
    return $s;
}

// helper: snake_case -> camelCase
function snake_to_camel($input) {
    return preg_replace_callback('/_([a-z])/', function($m){ return strtoupper($m[1]); }, $input);
}

function write_data($name, $data) {
    global $dbAvailable, $db;
    // If DB available, attempt to upsert simple JSON payload into a table's `data` column if such table exists.
    // By default, keep file-based write to avoid accidental DB schema changes.
    $path = DATA_DIR . '/' . $name . '.json';
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function append_data($name, $item) {
    global $dbAvailable, $db;
    // We'll return a status array: ['ok'=>bool,'used_db'=>bool,'error'=>string|null,'item'=>...] to help debugging
    $status = ['ok' => false, 'used_db' => false, 'error' => null, 'item' => $item];
    if ($dbAvailable && $db) {
        try {
            // Try to insert into table; expects table columns matching item keys.
            $table = preg_replace('/[^a-z0-9_]/i', '', $name);
            // map camelCase keys from frontend to snake_case DB columns
            $dbItem = [];
            foreach ($item as $k => $v) {
                $dbItem[camel_to_snake($k)] = $v;
            }
            $cols = array_keys($dbItem);
            $placeholders = array_map(function($c){ return ':' . $c; }, $cols);
            $sql = 'INSERT INTO ' . $table . ' (' . implode(',', $cols) . ') VALUES (' . implode(',', $placeholders) . ')';
            $stmt = $db->prepare($sql);
            foreach ($dbItem as $k => $v) $stmt->bindValue(':' . $k, is_array($v) || is_object($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v);
            $stmt->execute();
            // If id not present, try to set it from lastInsertId
            if (!isset($item['id'])) {
                $item['id'] = (int)$db->lastInsertId();
                $status['item']['id'] = $item['id'];
            }
            $status['ok'] = true;
            $status['used_db'] = true;
            $status['item'] = $item;
            return $status;
        } catch (Throwable $e) {
            $status['error'] = 'DB append error: ' . $e->getMessage();
            error_log('DB append error for ' . $name . ': ' . $e->getMessage());
            // fall back to file
        }
    }
    // File fallback
    try {
        $arr = read_data($name);
        $arr[] = $item;
        write_data($name, $arr);
        $status['ok'] = true;
        $status['used_db'] = false;
        $status['item'] = $item;
    } catch (Throwable $e) {
        $status['error'] = 'File append error: ' . $e->getMessage();
        error_log('File append error for ' . $name . ': ' . $e->getMessage());
    }
    return $status;
}

function find_by_id($name, $id) {
    global $dbAvailable, $db;
    if ($dbAvailable && $db) {
        try {
            $table = preg_replace('/[^a-z0-9_]/i', '', $name);
            $stmt = $db->prepare('SELECT * FROM ' . $table . ' WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) return null;
            $mapped = [];
            foreach ($row as $k => $v) {
                $mapped[snake_to_camel($k)] = $v;
            }
            return $mapped;
        } catch (Throwable $e) {
            error_log('DB find_by_id error for ' . $name . ': ' . $e->getMessage());
        }
    }
    $arr = read_data($name);
    foreach ($arr as $item) {
        if (isset($item['id']) && $item['id'] == $id) return $item;
    }
    return null;
}

function update_item($name, $id, $new) {
    global $dbAvailable, $db;
    if ($dbAvailable && $db) {
        try {
            $table = preg_replace('/[^a-z0-9_]/i', '', $name);
            $sets = [];
            $params = [':id' => $id];
            // map incoming camelCase keys to snake_case DB columns
            $dbNew = [];
            foreach ($new as $k => $v) {
                if ($k === 'id') continue;
                $dbNew[camel_to_snake($k)] = $v;
            }
            foreach ($dbNew as $col => $v) {
                $sets[] = $col . ' = :' . $col;
                $params[':' . $col] = is_array($v) || is_object($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
            }
            if (!count($sets)) return false;
            $sql = 'UPDATE ' . $table . ' SET ' . implode(',', $sets) . ' WHERE id = :id';
            $stmt = $db->prepare($sql);
            $ok = $stmt->execute($params);
            return (bool)$ok;
        } catch (Throwable $e) {
            error_log('DB update_item error for ' . $name . ': ' . $e->getMessage());
        }
    }
    $arr = read_data($name);
    $updated = false;
    foreach ($arr as $i => $item) {
        if (isset($item['id']) && $item['id'] == $id) {
            $arr[$i] = array_merge($item, $new);
            $updated = true;
            break;
        }
    }
    if ($updated) write_data($name, $arr);
    return $updated;
}

function delete_item($name, $id) {
    global $dbAvailable, $db;
    if ($dbAvailable && $db) {
        try {
            $table = preg_replace('/[^a-z0-9_]/i', '', $name);
            $stmt = $db->prepare('DELETE FROM ' . $table . ' WHERE id = :id');
            return (bool)$stmt->execute([':id' => $id]);
        } catch (Throwable $e) {
            error_log('DB delete_item error for ' . $name . ': ' . $e->getMessage());
        }
    }
    $arr = read_data($name);
    $found = false;
    foreach ($arr as $i => $item) {
        if (isset($item['id']) && $item['id'] == $id) {
            array_splice($arr, $i, 1);
            $found = true;
            break;
        }
    }
    if ($found) write_data($name, $arr);
    return $found;
}

?>
