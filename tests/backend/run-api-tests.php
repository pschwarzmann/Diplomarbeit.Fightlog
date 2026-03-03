<?php
/**
 * Einfache API-Integrationstests
 * Ausführung: php tests/backend/run-api-tests.php
 * Voraussetzung: Backend läuft (z.B. php -S localhost:8080 -t backend)
 *
 * API_BASE kann per Umgebungsvariable gesetzt werden:
 * API_BASE=http://localhost:8080/api php tests/backend/run-api-tests.php
 */
$apiBase = getenv('API_BASE') ?: 'http://localhost:8080/api';
// Hinweis: Backend muss laufen (z.B. cd backend && php -S localhost:8080)
$passed = 0;
$failed = 0;

function test(string $name, callable $fn): void {
    global $passed, $failed;
    try {
        $fn();
        echo "  ✓ $name\n";
        $passed++;
    } catch (Throwable $e) {
        echo "  ✗ $name: " . $e->getMessage() . "\n";
        $failed++;
    }
}

function request(string $url, array $options = []): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $options['headers'] ?? ['Content-Type: application/json'],
        CURLOPT_POST => ($options['method'] ?? 'GET') === 'POST',
        CURLOPT_POSTFIELDS => $options['body'] ?? null,
        CURLOPT_COOKIEJAR => '',
        CURLOPT_COOKIEFILE => '',
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    $decoded = json_decode($body, true);
    return ['code' => $code, 'contentType' => $contentType, 'body' => $body, 'json' => $decoded];
}

echo "\n=== FightLog API Tests ===\n";
echo "API Base: $apiBase\n\n";

// Login Fail
test('Login mit falschen Daten liefert JSON mit success=false', function () use ($apiBase) {
    $r = request("$apiBase/login.php", [
        'method' => 'POST',
        'body' => json_encode(['identifier' => 'invalid_user_xyz', 'password' => 'wrong']),
    ]);
    if (strpos($r['contentType'] ?? '', 'application/json') === false) {
        throw new Exception('Response ist nicht JSON, Content-Type: ' . ($r['contentType'] ?? 'n/a'));
    }
    if ($r['json'] === null) {
        throw new Exception('Response ist kein gültiges JSON: ' . substr($r['body'], 0, 200));
    }
    if (($r['json']['success'] ?? true) !== false) {
        throw new Exception('success sollte false sein');
    }
});

// Login Success (mit Test-User falls vorhanden)
test('Login mit gültigen Daten liefert JSON mit success=true', function () use ($apiBase) {
    $r = request("$apiBase/login.php", [
        'method' => 'POST',
        'body' => json_encode(['identifier' => 'admin', 'password' => 'admin123']),
    ]);
    if (strpos($r['contentType'] ?? '', 'application/json') === false) {
        throw new Exception('Response ist nicht JSON');
    }
    if ($r['json'] === null) {
        throw new Exception('Response ist kein gültiges JSON');
    }
    if (($r['json']['success'] ?? false) !== true) {
        throw new Exception('success sollte true sein (admin/admin123), Fehler: ' . ($r['json']['error'] ?? 'unbekannt'));
    }
});

// Session valid (mit Token vom Login)
$loginToken = null;
test('Session-Check liefert JSON', function () use ($apiBase, &$loginToken) {
    $login = request("$apiBase/login.php", [
        'method' => 'POST',
        'body' => json_encode(['identifier' => 'admin', 'password' => 'admin123']),
    ]);
    $loginToken = $login['json']['token'] ?? null;
    if (!$loginToken) {
        throw new Exception('Kein Token vom Login erhalten');
    }
    $r = request("$apiBase/session.php", [
        'method' => 'GET',
        'headers' => ['Content-Type: application/json', 'Authorization: Bearer ' . $loginToken],
    ]);
    if (strpos($r['contentType'] ?? '', 'application/json') === false) {
        throw new Exception('Session-Response ist nicht JSON');
    }
    if (($r['json']['success'] ?? false) !== true) {
        throw new Exception('Session sollte gültig sein');
    }
});

// Passkey begin (authenticate) - liefert JSON
test('Passkey login begin liefert JSON', function () use ($apiBase, $loginToken) {
    $r = request("$apiBase/passkeys_login.php", [
        'method' => 'POST',
        'body' => json_encode(['identifier' => 'admin']),
        'headers' => ['Content-Type: application/json', 'Authorization: Bearer ' . ($loginToken ?? '')],
    ]);
    if (strpos($r['contentType'] ?? '', 'application/json') === false) {
        throw new Exception('Passkey-Response ist nicht JSON');
    }
    if ($r['json'] === null) {
        throw new Exception('Response ist kein gültiges JSON');
    }
    // Kann success=false sein wenn keine Passkeys, aber muss JSON sein
});

echo "\n--- Ergebnis: $passed bestanden, $failed fehlgeschlagen ---\n";
exit($failed > 0 ? 1 : 0);
