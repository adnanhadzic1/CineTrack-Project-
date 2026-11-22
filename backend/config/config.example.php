<?php
/**
 * CineTrack configuration TEMPLATE  (used by backend/config/Database.php since M2).
 *
 * How to use it:
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

    // The browser origin that may call the API (the address where the frontend is served). Used for CORS.
    'app' => [
        'allowed_origin' => 'http://localhost:8000',
    ],

    // Used from M4 to sign and verify JWTs. Use a long random string.
    'jwt' => [
        'secret'      => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
        'ttl_seconds' => 3600,
    ],

    // TMDB (themoviedb.org) integration, used by services/TmdbService.php since M3.
    // Create a free account at themoviedb.org, open Settings > API and copy the "API Read Access Token"
    // (the long one, not the short API key). Keep it on the server only: never in the frontend, never in Git.
    'tmdb' => [
        'api_read_token'  => 'CHANGE_ME',
        'base_url'        => 'https://api.themoviedb.org/3',
        'timeout_seconds' => 5,
    ],
];
