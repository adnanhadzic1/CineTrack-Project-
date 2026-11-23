<?php
/**
 * Creates the one PDO connection that all DAO classes share.
 *
 * The credentials come from backend/config/config.php (read by Config.php). That file is NOT committed (see .gitignore);
 * copy config.example.php to config.php and put your own values in it.
 */
require_once __DIR__ . '/Config.php';

class Database
{
    private static ?PDO $connection = null;

    /** The shared connection. It is created on first use and then reused. */
    public static function connect(): PDO
    {
        if (self::$connection === null) {
            self::$connection = self::createConnection(Config::get()['db']);
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
