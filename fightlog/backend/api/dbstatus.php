<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../db/storage.php';

$out = ['dbAvailable' => false, 'counts' => [], 'error' => null];
if (isset($GLOBALS['dbAvailable']) && $GLOBALS['dbAvailable'] && isset($GLOBALS['db']) && $GLOBALS['db']) {
    $out['dbAvailable'] = true;
    try {
        $tables = ['exams','goals','users'];
        foreach ($tables as $t) {
            $tbl = preg_replace('/[^a-z0-9_]/i', '', $t);
            $stmt = $GLOBALS['db']->query('SELECT COUNT(*) as c FROM ' . $tbl);
            $r = $stmt->fetch(PDO::FETCH_ASSOC);
            $out['counts'][$t] = isset($r['c']) ? (int)$r['c'] : null;
        }
    } catch (Throwable $e) {
        $out['error'] = 'DB query error: ' . $e->getMessage();
    }
} else {
    $out['error'] = 'DB not configured or not available';
}

echo json_encode($out);
