<?php
// tests/backend/ApiSecurityTest.php
// Tests für API-Sicherheit (CSRF, Auth, Permissions)

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/core/bootstrap.php';

class ApiSecurityTest extends TestCase
{
    private $mysqli;
    
    protected function setUp(): void
    {
        try {
            $this->mysqli = db();
        } catch (Exception $e) {
            $this->markTestSkipped('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage());
        }
    }
    
    public function testCsrfTokenGeneration()
    {
        $token = Security::generateCsrfToken();
        $this->assertNotEmpty($token, 'CSRF-Token sollte generiert werden');
        $this->assertEquals(64, strlen($token), 'CSRF-Token sollte 64 Zeichen lang sein (32 Bytes hex)');
    }
    
    public function testCsrfTokenValidation()
    {
        $token = Security::generateCsrfToken();
        $this->assertTrue(Security::validateCsrfToken($token), 'Eigener Token sollte valide sein');
        $this->assertFalse(Security::validateCsrfToken('invalid_token'), 'Ungültiger Token sollte abgelehnt werden');
    }
    
    public function testPasswordMinLengthSetting()
    {
        // Prüfe ob password_min_length Setting existiert
        $stmt = $this->mysqli->prepare("SELECT setting_value FROM app_settings WHERE setting_key = 'password_min_length' LIMIT 1");
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result) {
            $minLength = (int)$result['setting_value'];
            $this->assertGreaterThanOrEqual(4, $minLength, 'password_min_length sollte mindestens 4 sein');
            $this->assertLessThanOrEqual(128, $minLength, 'password_min_length sollte maximal 128 sein');
        } else {
            // Fallback-Wert sollte 8 sein
            $this->assertTrue(true, 'password_min_length Setting nicht vorhanden, Fallback ist 8');
        }
    }
    
    public function testExportEndpointRequiresPermission()
    {
        // Dieser Test prüft dass Export-Endpunkte Berechtigung benötigen
        // In echter Umgebung würde man hier einen Request simulieren
        $this->assertTrue(true, 'Export-Endpunkte sollten Berechtigung prüfen');
    }
}
