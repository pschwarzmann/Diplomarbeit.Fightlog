<?php
// backend/core/env.php
// Lädt Umgebungsvariablen aus .env Datei

class Env
{
    private static bool $loaded = false;
    private static array $vars = [];

    /**
     * Lädt die .env Datei
     */
    public static function load(string $path = null): void
    {
        if (self::$loaded) {
            return;
        }

        $path = $path ?? dirname(__DIR__, 2) . '/.env';
        
        if (!file_exists($path)) {
            // Fallback zu .env.example für Entwicklung
            $path = dirname(__DIR__, 2) . '/.env.example';
        }

        if (!file_exists($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        
        foreach ($lines as $line) {
            // Überspringe Kommentare
            if (strpos(trim($line), '#') === 0) {
                continue;
            }

            // Parse KEY=VALUE
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                
                // Entferne Anführungszeichen
                $value = trim($value, '"\'');
                
                self::$vars[$key] = $value;
                
                // Setze auch in $_ENV und putenv
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }

        self::$loaded = true;
    }

    /**
     * Holt eine Umgebungsvariable
     */
    public static function get(string $key, $default = null)
    {
        self::load();
        
        // Prüfe in dieser Reihenfolge: getenv, $_ENV, self::$vars
        $value = getenv($key);
        if ($value !== false) {
            return $value;
        }
        
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        
        return self::$vars[$key] ?? $default;
    }

    /**
     * Prüft ob Produktionsmodus aktiv ist
     */
    public static function isProduction(): bool
    {
        $mode = self::get('PRODUCTION_MODE', 'false');
        return in_array(strtolower($mode), ['true', '1', 'yes'], true);
    }

    /**
     * Holt erlaubte CORS Origins als Array
     */
    public static function getAllowedOrigins(): array
    {
        $origins = self::get('ALLOWED_ORIGINS', '');
        if (empty($origins)) {
            return [];
        }
        return array_map('trim', explode(',', $origins));
    }
}
