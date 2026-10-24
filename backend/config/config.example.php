<?php
/**
 * CineTrack configuration TEMPLATE  (planning artifact for M1 - nothing reads this file yet).
 *
 * How it will be used (from M2 onwards):
 *   1. Copy this file to backend/config/config.php
 *   2. Replace every placeholder value with your real value
 *   3. NEVER commit config.php - it is listed in .gitignore
 *
 * This template contains placeholders only. Do not put real secrets in it.
 */

return [
    'db' => [
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'name'     => 'cinetrack',
        'user'     => 'CHANGE_ME',
        'password' => 'CHANGE_ME',
        'charset'  => 'utf8mb4',
    ],

    // Used from M4 to sign and verify JWTs. Use a long random string.
    'jwt' => [
        'secret'      => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
        'ttl_seconds' => 3600,
    ],

    // Used from M3 for the TMDB integration. Keep the token on the server only.
    'tmdb' => [
        'api_read_token'  => 'CHANGE_ME',
        'base_url'        => 'https://api.themoviedb.org/3',
        'timeout_seconds' => 5,
    ],
];
