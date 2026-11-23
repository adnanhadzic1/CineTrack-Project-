<?php
/**
 * Entry point of the CineTrack API. Start it from the project root with:
 *     php -S localhost:8001 -t backend/public
 *
 * Request flow:  browser -> this file -> Flight route (routes/*.php) -> service (services/*.php)
 *                -> DAO (dao/*.php) -> MySQL, and the JSON answer travels back the same way.
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../routes/helpers.php';

// ---- CORS: lets the frontend (a different address, e.g. http://localhost:8000) call this API ----
Flight::before('start', function () {
    $allowedOrigin = Config::get()['app']['allowed_origin'] ?? '';
    if ($allowedOrigin !== '' && ($_SERVER['HTTP_ORIGIN'] ?? '') === $allowedOrigin) {
        header("Access-Control-Allow-Origin: $allowedOrigin");
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
});

// ---- Errors always become JSON, never an HTML page ----
Flight::map('error', function (Throwable $error) {
    if ($error instanceof ApiException) {                          // an expected problem: 400, 404, 409, 502 ...
        respondError($error->getMessage(), $error->getStatusCode(), $error->getErrors());
        return;
    }
    error_log('CineTrack API error: ' . $error->getMessage() . ' in ' . basename($error->getFile()) . ':' . $error->getLine());
    respondError('Something went wrong on the server.', 500);      // details stay in the server log only
});

Flight::map('notFound', function () {
    respondError('Route not found', 404);
});

Flight::map('methodNotFound', function () {
    respondError('This URL does not support that HTTP method', 405);
});

// ---- Routes ----
Flight::route('GET /', function () {
    respond(['name' => 'CineTrack API', 'documentation' => '/docs/', 'specification' => '/openapi'], 'CineTrack API is running');
});

// The OpenAPI file lives in backend/openapi.yaml; Swagger UI (public/docs/index.html) loads it from here.
// The URL has no ".yaml" ending on purpose: PHP's built-in server answers URLs that end in a file extension
// with its own 404 page when no such file exists, and never reaches our code.
Flight::route('GET /openapi', function () {
    header('Content-Type: application/yaml; charset=utf-8');
    readfile(__DIR__ . '/../openapi.yaml');
});

foreach (['users', 'titles', 'genres', 'title-genres', 'watchlist-items', 'reviews', 'external'] as $name) {
    require __DIR__ . "/../routes/$name.php";
}

Flight::start();
