<?php
// tests/backend/LoginTest.php
// Minimaler PHPUnit Test für Login-Funktionalität

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/core/bootstrap.php';

class LoginTest extends TestCase
{
    private $mysqli;
    
    protected function setUp(): void
    {
        // In echter Umgebung: Test-Datenbank verwenden
        try {
            $this->mysqli = db();
        } catch (Exception $e) {
            $this->markTestSkipped('Datenbankverbindung fehlgeschlagen: ' . $e->getMessage());
        }
    }
    
    public function testPasswordValidationFunctionExists()
    {
        $this->assertTrue(
            function_exists('validate_password_length'),
            'validate_password_length Funktion sollte existieren'
        );
    }
    
    public function testPasswordValidationReturnsArray()
    {
        if (!function_exists('validate_password_length')) {
            $this->markTestSkipped('validate_password_length nicht verfügbar');
        }
        
        $result = validate_password_length($this->mysqli, 'testpassword123');
        $this->assertIsArray($result, 'Rückgabe sollte ein Array sein');
        $this->assertArrayHasKey('valid', $result, 'Array sollte "valid" Key haben');
    }
    
    public function testPasswordTooShort()
    {
        if (!function_exists('validate_password_length')) {
            $this->markTestSkipped('validate_password_length nicht verfügbar');
        }
        
        $result = validate_password_length($this->mysqli, 'abc');
        $this->assertFalse($result['valid'], 'Zu kurzes Passwort sollte ungültig sein');
    }
}
