<?php
/**
 * Automatic check of the REST API, the services and the external API service. Plain PHP, no test framework.
 *
 * Needs: the database from database/cinetrack.sql, backend/config/config.php, and FlightPHP in backend/vendor
 * (run "composer install" in backend/). Run from the project root:
 *     php backend/tests/api_test.php
 *
 * The script starts two temporary PHP servers on ports 18001 (the CineTrack API) and 18099 (a FAKE TMDB server,
 * see fake_tmdb.php), sends real HTTP requests, removes the rows it created and stops the servers.
 * Nothing here contacts the real TMDB. Exit code 0 = all checks passed, 1 = at least one failed.
 */
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../services/TmdbService.php';

const API = 'http://127.0.0.1:18001';
$passed = 0;
$failed = 0;

function check(string $name, bool $condition): void
{
    global $passed, $failed;
    if ($condition) { $passed++; echo "  ok    $name\n"; } else { $failed++; echo "  FAIL  $name\n"; }
}

/** Sends one request to the API. Returns [status code, decoded JSON body, raw body, response headers]. */
function call(string $method, string $path, mixed $body = null, array $headers = []): array
{
    $curl = curl_init(API . $path);
    $headers[] = 'Accept: application/json';
    if ($body !== null) { $headers[] = 'Content-Type: application/json'; }
    curl_setopt_array($curl, [
        CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 15,
        CURLOPT_POSTFIELDS => $body === null ? null : (is_string($body) ? $body : json_encode($body)),
    ]);
    $response = curl_exec($curl);
    $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $headerSize = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    curl_close($curl);
    $raw = substr((string) $response, $headerSize);
    return [$status, json_decode($raw, true), $raw, substr((string) $response, 0, $headerSize)];
}

function startServer(string $address, string $arguments, array $env, string &$log)
{
    $log = tempnam(sys_get_temp_dir(), 'cinetrack_srv');
    $process = proc_open("exec php -S $address $arguments", [0 => ['pipe', 'r'], 1 => ['file', $log, 'a'], 2 => ['file', $log, 'a']], $pipes, null, $env + getenv());
    for ($i = 0; $i < 50; $i++) {
        $socket = @fsockopen(...explode(':', $address, 2));
        if ($socket) { fclose($socket); return $process; }
        usleep(100000);
    }
    throw new RuntimeException("Could not start the test server on $address");
}

// ---------- Start the fake TMDB server and the API ----------
$real = Config::get();
$testConfig = tempnam(sys_get_temp_dir(), 'cinetrack_cfg');
file_put_contents($testConfig, '<?php return ' . var_export([
    'db'   => $real['db'],
    'app'  => ['allowed_origin' => 'http://localhost:8000'],
    'tmdb' => ['api_read_token' => 'test-token', 'base_url' => 'http://127.0.0.1:18099', 'timeout_seconds' => 1],
], true) . ';');
$fakeLog = $apiLog = '';
// The fake server needs several workers: PHP's built-in server handles one request at a time, so a request that
// is still sleeping ('slow') would otherwise block the next request and turn a 500 or 404 test into a timeout.
$fake = startServer('127.0.0.1:18099', __DIR__ . '/fake_tmdb.php', ['PHP_CLI_SERVER_WORKERS' => '4'], $fakeLog);
$api = startServer('127.0.0.1:18001', '-t ' . escapeshellarg(__DIR__ . '/../public'), ['CINETRACK_CONFIG_FILE' => $testConfig], $apiLog);
$db = Database::connect();
$count = fn (string $table) => (int) $db->query("SELECT COUNT(*) FROM $table")->fetchColumn();
$before = array_map($count, ['users', 'titles', 'genres', 'title_genres', 'watchlist_items', 'reviews']);

try {
    echo "General\n";
    [$s, $j, , $h] = call('GET', '/');
    check('GET / answers 200 with JSON', $s === 200 && $j['success'] === true && stripos($h, 'application/json') !== false);
    [$s, $j] = call('GET', '/no-such-route');
    check('unknown route: 404 JSON (not an HTML page)', $s === 404 && $j['success'] === false);
    [$s, $j] = call('PATCH', '/titles/1');
    check('wrong HTTP method: 405 JSON', $s === 405 && $j['success'] === false);
    [$s, $j] = call('POST', '/genres', '{broken json');
    check('broken JSON body: 400', $s === 400 && isset($j['errors']['body']));
    [$s, $j] = call('POST', '/genres', '[1,2]');
    check('JSON list instead of object: 400', $s === 400);
    [, , , $h] = call('GET', '/genres', null, ['Origin: http://localhost:8000']);
    check('CORS header for the configured frontend origin', stripos($h, 'Access-Control-Allow-Origin: http://localhost:8000') !== false);
    [, , , $h] = call('GET', '/genres', null, ['Origin: http://evil.example']);
    check('no CORS header for other origins', stripos($h, 'Access-Control-Allow-Origin') === false);
    [$s] = call('OPTIONS', '/titles', null, ['Origin: http://localhost:8000']);
    check('OPTIONS preflight answers 204', $s === 204);
    [$s, , $raw] = call('GET', '/openapi');
    check('GET /openapi serves the specification', $s === 200 && str_contains($raw, 'openapi: 3.'));

    echo "\nGenres\n";
    [$s, $j] = call('POST', '/genres', ['name' => 'Test Genre']);
    $genreId = $j['data']['id'] ?? 0;
    check('POST creates (201) and returns the new genre', $s === 201 && $j['data']['name'] === 'Test Genre' && $genreId > 0);
    [$s, $j] = call('GET', "/genres/$genreId");
    check('GET by id: 200', $s === 200 && $j['data']['id'] === $genreId);
    [$s, $j] = call('GET', '/genres');
    check('GET list: 200 and contains the sample genres', $s === 200 && count($j['data']) >= 12);
    [$s] = call('POST', '/genres', ['name' => 'Test Genre']);
    check('duplicate name: 409', $s === 409);
    [$s, $j] = call('POST', '/genres', ['name' => '']);
    check('empty name: 400 with field error', $s === 400 && isset($j['errors']['name']));
    [$s] = call('POST', '/genres', ['name' => str_repeat('x', 41)]);
    check('name longer than 40: 400', $s === 400);
    [$s] = call('POST', '/genres', ['name' => 123]);
    check('name that is not text: 400', $s === 400);
    [$s, $j] = call('PUT', "/genres/$genreId", ['name' => 'Test Genre 2']);
    check('PUT updates: 200', $s === 200 && $j['data']['name'] === 'Test Genre 2');
    [$s] = call('PUT', "/genres/$genreId", ['name' => 'Drama']);
    check('renaming to an existing name: 409', $s === 409);
    [$s] = call('PUT', '/genres/999999', ['name' => 'x']);
    check('PUT on a missing genre: 404', $s === 404);
    [$s, $j] = call('GET', '/genres/0');
    check('id 0 is invalid: 400', $s === 400);
    [$s] = call('GET', '/genres/abc');
    check('id "abc" is invalid: 400', $s === 400);
    [$s, $j] = call('POST', '/genres', ['name' => "'; DROP TABLE genres; --"]);
    $injectedId = $j['data']['id'] ?? 0;
    check('SQL-injection-like text is stored as plain text', $s === 201 && $j['data']['name'] === "'; DROP TABLE genres; --" && $count('genres') >= 13);
    call('DELETE', "/genres/$injectedId");

    echo "\nTitles\n";
    [$s, $j] = call('POST', '/titles', ['mediaType' => 'movie', 'title' => "Test O'Brien 100%", 'tmdbId' => 777001, 'releaseDate' => '2026-05-06', 'genreIds' => [$genreId, 1]]);
    $titleId = $j['data']['id'] ?? 0;
    check('POST creates (201) with genres', $s === 201 && $titleId > 0 && count($j['data']['genres']) === 2);
    [$s, $j] = call('GET', "/titles/$titleId");
    check('GET by id returns camelCase fields and genres', $s === 200 && $j['data']['mediaType'] === 'movie' && $j['data']['tmdbId'] === 777001 && count($j['data']['genres']) === 2);
    [$s, $j] = call('GET', '/titles');
    check('GET list: 200', $s === 200 && count($j['data']) >= 14);
    [$s, $j] = call('GET', '/titles?search=' . urlencode("O'Brien"));
    check('search with a quote works', $s === 200 && count($j['data']) === 1);
    [$s, $j] = call('GET', '/titles?search=' . urlencode("' OR 1=1 --"));
    check('SQL-injection-like search finds nothing and is not an error', $s === 200 && $j['data'] === []);
    [$s, $j] = call('GET', '/titles?type=tv');
    check('filter by type', $s === 200 && count($j['data']) >= 6 && !in_array('movie', array_column($j['data'], 'mediaType'), true));
    [$s, $j] = call('GET', "/titles?genreId=$genreId&search=O'B");
    check('filter by genre and search together', $s === 200 && count($j['data']) === 1);
    [$s] = call('GET', '/titles?type=book');
    check('invalid type filter: 400', $s === 400);
    [$s] = call('GET', '/titles?genreId=abc');
    check('invalid genreId filter: 400', $s === 400);
    [$s] = call('POST', '/titles', ['mediaType' => 'movie', 'title' => 'Dup', 'tmdbId' => 777001]);
    check('same tmdbId + mediaType twice: 409', $s === 409);
    [$s, $j] = call('POST', '/titles', ['mediaType' => 'tv', 'title' => 'Same TMDB id, TV show', 'tmdbId' => 777001]);
    $tvId = $j['data']['id'] ?? 0;
    check('same tmdbId as a TV show is allowed', $s === 201);
    [$s, $j] = call('POST', '/titles', ['mediaType' => 'book', 'title' => '', 'releaseDate' => '2026-13-45', 'tmdbId' => 'x']);
    check('several invalid fields: 400 listing each field', $s === 400 && count($j['errors']) === 4);
    [$s] = call('POST', '/titles', ['mediaType' => 'movie', 'title' => 'Bad genre', 'genreIds' => [999999]]);
    check('unknown genre id in genreIds: 400', $s === 400);
    check('a rejected title was not half-created', (int) $db->query("SELECT COUNT(*) FROM titles WHERE title = 'Bad genre'")->fetchColumn() === 0);
    [$s] = call('POST', '/titles', ['mediaType' => 'movie', 'title' => str_repeat('a', 201)]);
    check('title longer than 200: 400', $s === 400);
    [$s, $j] = call('PUT', "/titles/$titleId", ['title' => 'Renamed', 'genreIds' => [1]]);
    check('PUT changes the title and replaces genres', $s === 200 && $j['data']['title'] === 'Renamed' && count($j['data']['genres']) === 1);
    [$s] = call('PUT', "/titles/$titleId", []);
    check('PUT with nothing to change: 400', $s === 400);
    [$s] = call('PUT', '/titles/999999', ['title' => 'x']);
    check('PUT on a missing title: 404', $s === 404);
    [$s] = call('PUT', "/titles/$tvId", ['mediaType' => 'movie']);
    check('PUT that would duplicate (tmdbId, mediaType): 409', $s === 409);

    echo "\nTitle-genre links\n";
    [$s, $j] = call('GET', "/title-genres?titleId=$titleId");
    check('GET links of a title', $s === 200 && count($j['data']) === 1);
    [$s, $j] = call('POST', '/title-genres', ['titleId' => $titleId, 'genreId' => $genreId]);
    check('POST adds a link (201)', $s === 201 && $j['data'] === ['titleId' => $titleId, 'genreId' => $genreId]);
    [$s] = call('POST', '/title-genres', ['titleId' => $titleId, 'genreId' => $genreId]);
    check('the same link twice: 409', $s === 409);
    [$s, $j] = call('POST', '/title-genres', ['titleId' => 999999, 'genreId' => 999999]);
    check('unknown title and genre: 400 listing both', $s === 400 && isset($j['errors']['titleId'], $j['errors']['genreId']));
    [$s, $j] = call('GET', "/title-genres?genreId=$genreId");
    check('GET links of a genre', $s === 200 && count($j['data']) === 1);
    [$s, $j] = call('PUT', "/titles/$titleId/genres", ['genreIds' => [2, 3]]);
    check('PUT replaces all genres of a title', $s === 200 && array_column($j['data'], 'genreId') === [2, 3]);
    [$s] = call('PUT', "/titles/$titleId/genres", ['genreIds' => [2, 999999]]);
    check('PUT with an unknown genre: 400 and nothing changed', $s === 400 && count(call('GET', "/title-genres?titleId=$titleId")[1]['data']) === 2);
    [$s] = call('PUT', "/titles/$titleId/genres", ['genreIds' => 'x']);
    check('genreIds that is not a list: 400', $s === 400);
    [$s] = call('PUT', '/titles/999999/genres', ['genreIds' => []]);
    check('PUT genres of a missing title: 404', $s === 404);
    [$s, $j] = call('DELETE', "/title-genres/$titleId/2");
    check('DELETE removes a link: 200', $s === 200 && $j['data'] === null);
    [$s] = call('DELETE', "/title-genres/$titleId/2");
    check('DELETE of a link that is gone: 404', $s === 404);

    echo "\nUsers\n";
    [$s, $j, $raw] = call('POST', '/users', ['name' => "Test O'Brien", 'email' => 'Api.Test@Example.com', 'password' => 'Secret123']);
    $userId = $j['data']['id'] ?? 0;
    check('POST creates (201)', $s === 201 && $userId > 0 && $j['data']['role'] === 'user' && $j['data']['isActive'] === true);
    check('the e-mail is stored in lower case', $j['data']['email'] === 'api.test@example.com');
    check('the response never contains a password or hash', !str_contains($raw, 'password') && !str_contains($raw, '$2y$'));
    $hash = $db->query("SELECT password_hash FROM users WHERE id = $userId")->fetchColumn();
    check('the password is stored as a bcrypt hash', password_verify('Secret123', $hash));
    [, , $raw] = call('GET', '/users');
    check('GET /users never contains hashes', !str_contains($raw, 'password') && !str_contains($raw, '$2y$'));
    [$s] = call('POST', '/users', ['name' => 'Dup', 'email' => 'api.test@example.com', 'password' => 'Secret123']);
    check('duplicate e-mail: 409', $s === 409);
    [$s, $j] = call('POST', '/users', ['name' => '', 'email' => 'not-an-email', 'password' => 'short']);
    check('invalid name, e-mail and password: 400 listing each', $s === 400 && count($j['errors']) === 3);
    [$s, $j] = call('POST', '/users', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'onlyletters']);
    check('password without a number: 400', $s === 400 && isset($j['errors']['password']));
    [$s] = call('POST', '/users', ['name' => 'X', 'email' => 'x@example.com', 'password' => 'Secret123', 'role' => 'root']);
    check('unknown role: 400', $s === 400);
    [$s, $j] = call('PUT', "/users/$userId", ['name' => 'Renamed', 'role' => 'admin', 'isActive' => false]);
    check('PUT updates name, role and isActive', $s === 200 && $j['data']['role'] === 'admin' && $j['data']['isActive'] === false);
    [$s] = call('PUT', "/users/$userId", ['isActive' => 'no']);
    check('isActive that is not true/false: 400', $s === 400);
    [$s] = call('PUT', "/users/$userId", ['email' => 'alex.admin@example.com']);
    check('e-mail of another user: 409', $s === 409);
    [$s] = call('PUT', "/users/$userId", ['password' => 'NewSecret456']);
    check('PUT can change the password (hashed)', $s === 200 && password_verify('NewSecret456', $db->query("SELECT password_hash FROM users WHERE id = $userId")->fetchColumn()));
    [$s] = call('GET', '/users/999999');
    check('GET a missing user: 404', $s === 404);

    echo "\nWatchlist items\n";
    [$s, $j] = call('POST', '/watchlist-items', ['userId' => $userId, 'titleId' => $titleId, 'status' => 'completed']);
    $itemId = $j['data']['id'] ?? 0;
    check('POST creates (201); completed without progress gets 100', $s === 201 && $j['data']['status'] === 'completed' && $j['data']['progressPct'] === 100);
    [$s, $j] = call('POST', '/watchlist-items', ['userId' => $userId, 'titleId' => $tvId]);
    $item2 = $j['data']['id'] ?? 0;
    check('default status is planned with progress 0', $s === 201 && $j['data']['status'] === 'planned' && $j['data']['progressPct'] === 0);
    [$s] = call('POST', '/watchlist-items', ['userId' => $userId, 'titleId' => $titleId]);
    check('same title twice for one user: 409', $s === 409);
    [$s, $j] = call('POST', '/watchlist-items', ['userId' => 999999, 'titleId' => 999999]);
    check('unknown user and title: 400 listing both', $s === 400 && isset($j['errors']['userId'], $j['errors']['titleId']));
    [$s] = call('POST', '/watchlist-items', ['userId' => $userId, 'titleId' => 1, 'status' => 'abandoned']);
    check('invalid status: 400', $s === 400);
    [$s] = call('POST', '/watchlist-items', ['userId' => $userId, 'titleId' => 1, 'progressPct' => 101]);
    check('progress above 100: 400', $s === 400);
    [$s] = call('POST', '/watchlist-items', ['userId' => $userId, 'titleId' => 1, 'progressNote' => str_repeat('n', 101)]);
    check('progress note longer than 100: 400', $s === 400);
    [$s, $j] = call('GET', "/watchlist-items?userId=$userId");
    check('GET items of a user', $s === 200 && count($j['data']) === 2);
    [$s, $j] = call('GET', "/watchlist-items?userId=$userId&status=planned");
    check('GET items of a user with a status', $s === 200 && count($j['data']) === 1);
    [$s] = call('GET', '/watchlist-items?status=planned');
    check('status filter without userId: 400', $s === 400);
    [$s, $j] = call('PUT', "/watchlist-items/$item2", ['status' => 'watching', 'progressPct' => 40, 'progressNote' => "S1 'E4'"]);
    check('PUT changes status, progress and note', $s === 200 && $j['data']['progressPct'] === 40 && $j['data']['progressNote'] === "S1 'E4'");
    [$s, $j] = call('PUT', "/watchlist-items/$itemId", ['status' => 'planned']);
    check('PUT status planned resets progress to 0', $s === 200 && $j['data']['progressPct'] === 0);
    [$s] = call('PUT', "/watchlist-items/$itemId", ['userId' => 1]);
    check('the user of an item cannot be changed (nothing to update: 400)', $s === 400);
    [$s] = call('PUT', '/watchlist-items/999999', ['status' => 'planned']);
    check('PUT on a missing item: 404', $s === 404);

    echo "\nReviews\n";
    $text = "Loved it! \"Great\" -- 100% back\\slash ünïcödé ✓";
    [$s, $j] = call('POST', '/reviews', ['userId' => $userId, 'titleId' => $titleId, 'rating' => 5, 'body' => $text]);
    $reviewId = $j['data']['id'] ?? 0;
    check('POST creates (201); quotes and unicode survive', $s === 201 && $j['data']['body'] === $text);
    [$s] = call('POST', '/reviews', ['userId' => $userId, 'titleId' => $titleId, 'rating' => 3, 'body' => 'again']);
    check('second review of the same title by the same user: 409', $s === 409);
    foreach ([0, 6, 'five', 2.5] as $badRating) {
        [$s] = call('POST', '/reviews', ['userId' => $userId, 'titleId' => $tvId, 'rating' => $badRating, 'body' => 'x']);
        check('rating ' . json_encode($badRating) . ' is rejected: 400', $s === 400);
    }
    [$s, $j] = call('POST', '/reviews', ['userId' => 999999, 'titleId' => 999999, 'rating' => 3, 'body' => 'x']);
    check('unknown user and title: 400 listing both', $s === 400 && isset($j['errors']['userId'], $j['errors']['titleId']));
    [$s] = call('POST', '/reviews', ['userId' => $userId, 'titleId' => $tvId, 'rating' => 3]);
    check('missing body: 400', $s === 400);
    [$s, $j] = call('GET', "/reviews?titleId=$titleId");
    check('GET reviews of a title (with the author name)', $s === 200 && count($j['data']) === 1 && $j['data'][0]['userName'] === 'Renamed');
    [$s, $j] = call('GET', "/reviews?userId=$userId");
    check('GET reviews of a user', $s === 200 && count($j['data']) === 1);
    [$s, $j] = call('GET', "/reviews?userId=$userId&titleId=$titleId");
    check('GET reviews of one user and one title', $s === 200 && count($j['data']) === 1);
    [$s, $j] = call('PUT', "/reviews/$reviewId", ['rating' => 2, 'body' => 'Changed my mind.']);
    check('PUT changes rating and body', $s === 200 && $j['data']['rating'] === 2);
    [$s] = call('PUT', "/reviews/$reviewId", ['rating' => 9]);
    check('PUT with rating 9: 400', $s === 400);
    [$s] = call('GET', '/reviews/999999');
    check('GET a missing review: 404', $s === 404);

    echo "\nDeleting (and what is removed with it)\n";
    [$s, $j] = call('DELETE', "/genres/$genreId");
    check('DELETE a genre: 200, the title stays', $s === 200 && call('GET', "/titles/$titleId")[0] === 200);
    [$s] = call('DELETE', "/genres/$genreId");
    check('DELETE again: 404', $s === 404);
    [$s] = call('DELETE', "/watchlist-items/$item2");
    check('DELETE a watchlist item', $s === 200 && call('GET', "/watchlist-items/$item2")[0] === 404);
    [$s] = call('DELETE', "/reviews/$reviewId");
    check('DELETE a review', $s === 200 && call('GET', "/reviews/$reviewId")[0] === 404);
    [$s] = call('DELETE', "/titles/$tvId");
    check('DELETE a title', $s === 200 && call('GET', "/titles/$tvId")[0] === 404);
    call('POST', '/reviews', ['userId' => $userId, 'titleId' => $titleId, 'rating' => 4, 'body' => 'cascade test']);
    [$s] = call('DELETE', "/titles/$titleId");
    check('DELETE a title also removes its watchlist items and reviews', $s === 200 && call('GET', "/watchlist-items/$itemId")[0] === 404 && call('GET', "/reviews?userId=$userId")[1]['data'] === []);
    [$s] = call('DELETE', "/users/$userId");
    check('DELETE a user', $s === 200 && call('GET', "/users/$userId")[0] === 404);
    [$s] = call('DELETE', '/users/999999');
    check('DELETE a missing user: 404', $s === 404);

    echo "\nExternal API through the backend (FAKE TMDB server)\n";
    [$s, $j] = call('GET', '/external/titles/search?query=anything');
    check('search: 200 and only movies and TV shows (the person is filtered out)', $s === 200 && count($j['data']['results']) === 2);
    $first = $j['data']['results'][0] ?? [];
    check('results are clean: camelCase, full poster URL, rating rounded', ($first['tmdbId'] ?? 0) === 9001 && $first['title'] === 'Fake Test Movie' && $first['posterUrl'] === 'https://image.tmdb.org/t/p/w342/fake.jpg' && $first['rating'] === 7.5 && $first['releaseDate'] === '2001-02-03');
    $show = $j['data']['results'][1] ?? [];
    check('TV shows use "name"; empty date becomes null; missing poster becomes null', ($show['title'] ?? '') === 'Fake Test Show' && $show['releaseDate'] === null && $show['posterUrl'] === null);
    [$s, $j] = call('GET', '/external/titles/search?query=anything&type=movie');
    check('search with type=movie', $s === 200 && count($j['data']['results']) === 1 && $j['data']['results'][0]['mediaType'] === 'movie');
    [$s, $j] = call('GET', '/external/titles/search?query=anything&type=tv');
    check('search with type=tv', $s === 200 && $j['data']['results'][0]['mediaType'] === 'tv');
    [$s, $j] = call('GET', '/external/titles/search');
    check('search without query: 400', $s === 400 && isset($j['errors']['query']));
    [$s] = call('GET', '/external/titles/search?query=x&type=book');
    check('search with a bad type: 400', $s === 400);
    [$s] = call('GET', '/external/titles/search?query=x&page=0');
    check('search with page 0: 400', $s === 400);
    [$s, $j] = call('GET', '/external/titles/search?query=slow');
    check('TMDB too slow (timeout): 504 with a friendly message', $s === 504 && str_contains($j['message'], 'did not answer in time'));
    [$s, $j] = call('GET', '/external/titles/search?query=boom');
    check('TMDB answers 500: 502', $s === 502 && $j['success'] === false);
    [$s] = call('GET', '/external/titles/search?query=garbage');
    check('TMDB answers with something that is not JSON: 502', $s === 502);
    [$s] = call('GET', '/external/titles/search?query=limit');
    check('TMDB says "too many requests": 503', $s === 503);
    [$s, $j] = call('GET', '/external/titles/movie/9001');
    check('details of a movie', $s === 200 && $j['data']['runtimeMinutes'] === 101 && $j['data']['genres'] === ['Fake Genre'] && $j['data']['seasons'] === null);
    [$s, $j] = call('GET', '/external/titles/tv/9002');
    check('details of a TV show', $s === 200 && $j['data']['seasons'] === 2 && $j['data']['runtimeMinutes'] === 45);
    [$s] = call('GET', '/external/titles/movie/1');
    check('details of an unknown title: 404', $s === 404);
    [$s] = call('GET', '/external/titles/book/1');
    check('details with a bad media type: 400', $s === 400);
    [, , $raw] = call('GET', '/external/titles/search?query=boom');
    check('the token never appears in a response', !str_contains($raw, 'test-token'));
} finally {
    // ---------- Clean up: the database must look as before ----------
    foreach (["DELETE FROM users WHERE email IN ('api.test@example.com', 'x@example.com')", "DELETE FROM titles WHERE title IN ('Renamed', 'Same TMDB id, TV show', 'Bad genre') OR tmdb_id = 777001", "DELETE FROM genres WHERE name LIKE 'Test Genre%' OR name LIKE '%DROP TABLE%'"] as $sql) {
        $db->exec($sql);
    }
}
$after = array_map($count, ['users', 'titles', 'genres', 'title_genres', 'watchlist_items', 'reviews']);
check('the test rows were removed again (all six tables have their original row counts)', $after === $before);

echo "\nTmdbService on its own (FAKE TMDB server)\n";
$base = 'http://127.0.0.1:18099';
$good = ['api_read_token' => 'test-token', 'base_url' => $base, 'timeout_seconds' => 1];
function failsWith(callable $action, int $status, string $messagePart = ''): bool
{
    try { $action(); } catch (ApiException $e) { return $e->getStatusCode() === $status && str_contains($e->getMessage(), $messagePart); }
    return false;
}
check('a placeholder token (CHANGE_ME) gives 503 "not configured"', failsWith(fn () => (new TmdbService(['api_read_token' => 'CHANGE_ME', 'base_url' => $base]))->search('x'), 503, 'not configured'));
check('an empty token gives 503', failsWith(fn () => (new TmdbService(['api_read_token' => '', 'base_url' => $base]))->search('x'), 503, 'not configured'));
$logFile = tempnam(sys_get_temp_dir(), 'cinetrack_log');
ini_set('error_log', $logFile);
check('a wrong token (TMDB answers 401) gives 503 without leaking the token', failsWith(fn () => (new TmdbService(['api_read_token' => 'wrong-secret-token', 'base_url' => $base]))->search('x'), 503, 'rejected'));
check('nothing listens on the port: 503 "could not be reached"', failsWith(fn () => (new TmdbService(['api_read_token' => 'test-token', 'base_url' => 'http://127.0.0.1:1']))->search('x'), 503, 'could not be reached'));
check('a slow answer: 504 after the 1 second timeout', failsWith(fn () => (new TmdbService($good))->search('slow'), 504));
$started = microtime(true);
try { (new TmdbService($good))->search('slow'); } catch (ApiException $e) { }
check('the timeout really stops the request early (under 2.5 seconds)', microtime(true) - $started < 2.5);
check('upstream 500: 502', failsWith(fn () => (new TmdbService($good))->search('boom'), 502));
check('invalid JSON from upstream: 502', failsWith(fn () => (new TmdbService($good))->search('garbage'), 502));
check('a 404 for details: 404', failsWith(fn () => (new TmdbService($good))->details('movie', 1), 404));
check('too short a query is a 400', failsWith(fn () => (new TmdbService($good))->search('   '), 400));
check('a query longer than 100 characters is a 400', failsWith(fn () => (new TmdbService($good))->search(str_repeat('a', 101)), 400));
$result = (new TmdbService($good))->search('anything');
check('search returns paging information', $result['page'] === 1 && $result['totalPages'] === 1 && $result['totalResults'] === 3);
check('the error log does not contain the token', !str_contains((string) file_get_contents($logFile), 'wrong-secret-token') && !str_contains((string) file_get_contents($logFile), 'test-token'));

// ---------- Stop the servers ----------
proc_terminate($api);
proc_terminate($fake);
foreach ([$testConfig, $fakeLog, $apiLog, $logFile] as $file) { @unlink($file); }

echo "\n$passed passed, $failed failed\n";
exit($failed === 0 ? 0 : 1);
