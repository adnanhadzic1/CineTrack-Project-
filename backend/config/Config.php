<?php
/**
 * Reads backend/config/config.php once and returns it as an array.
 * Database.php (database settings) and TmdbService.php (external API settings) both use it,
 * so the settings file is read in exactly one place.
 *
 * Automated tests can point to another settings file with the environment variable CINETRACK_CONFIG_FILE.
 */
class Config
{
    private static ?array $settings = null;

    public static function get(): array
    {
        if (self::$settings === null) {
            $file = getenv('CINETRACK_CONFIG_FILE') ?: __DIR__ . '/config.php';
            if (!is_file($file)) {
                throw new RuntimeException('Missing backend/config/config.php. Copy config.example.php to config.php and fill it in.');
            }
            self::$settings = require $file;
        }
        return self::$settings;
    }
}
