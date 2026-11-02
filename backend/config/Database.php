<?php
/**
 * Creates the one PDO connection that all DAO classes share.
 *
 * The credentials are read from backend/config/config.php. That file is NOT committed (see .gitignore);
 * copy config.example.php to config.php and put your own values in it.
 */
class Database
{
    private static ?PDO $connection = null;

    /** The shared connection. It is created on first use and then reused. */
    public static function connect(): PDO
    {
        if (self::$connection === null) {
            $configFile = __DIR__ . '/config.php';
            if (!is_file($configFile)) {
                throw new RuntimeException('Missing backend/config/config.php. Copy config.example.php to config.php and fill it in.');
            }
            $config = require $configFile;
            self::$connection = self::createConnection($config['db']);
        }
        return self::$connection;
    }

    /** Builds a new PDO object from a settings array (host, port, name, user, password, charset). */
    public static function createConnection(array $db): PDO
    {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $db['host'], $db['port'], $db['name'], $db['charset']);
        try {
            return new PDO($dsn, $db['user'], $db['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // errors become exceptions
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // rows come back as arrays
                PDO::ATTR_EMULATE_PREPARES   => false,                    // real prepared statements
                PDO::MYSQL_ATTR_FOUND_ROWS   => true,                     // rowCount() counts matched rows, not only changed ones
            ]);
        } catch (PDOException $e) {
            // The original message can contain the host or user name, so it goes to the server log only.
            error_log('CineTrack database connection failed: ' . $e->getMessage());
            throw new RuntimeException('Could not connect to the database.');
        }
    }
}
