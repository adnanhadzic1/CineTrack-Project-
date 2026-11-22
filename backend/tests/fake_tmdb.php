<?php
/**
 * A FAKE stand-in for the TMDB server, used only by api_test.php. The data below is invented for tests
 * and has nothing to do with real TMDB data. Start (the test does this itself):  php -S 127.0.0.1:18099 fake_tmdb.php
 */
header('Content-Type: application/json');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = $_GET['query'] ?? '';

// Like the real TMDB, a wrong token is refused.
if (($_SERVER['HTTP_AUTHORIZATION'] ?? '') !== 'Bearer test-token') {
    http_response_code(401);
    echo json_encode(['status_message' => 'Invalid API key']);
    exit;
}

// Special search words make the fake server misbehave on purpose.
if ($query === 'slow')    { sleep(3); }
if ($query === 'boom')    { http_response_code(500); echo '{"status_message":"internal error"}'; exit; }
if ($query === 'garbage') { echo 'this is not json'; exit; }
if ($query === 'limit')   { http_response_code(429); echo '{}'; exit; }

$movie = ['id' => 9001, 'title' => 'Fake Test Movie', 'release_date' => '2001-02-03', 'poster_path' => '/fake.jpg', 'overview' => 'Invented for tests.', 'vote_average' => 7.46];
$show  = ['id' => 9002, 'name' => 'Fake Test Show', 'first_air_date' => '', 'poster_path' => null, 'overview' => '', 'vote_average' => 0];

if ($path === '/search/multi') {
    echo json_encode(['page' => 1, 'total_pages' => 1, 'total_results' => 3, 'results' => [
        $movie + ['media_type' => 'movie'], ['id' => 5, 'name' => 'A Person', 'media_type' => 'person'], $show + ['media_type' => 'tv'],
    ]]);
} elseif ($path === '/search/movie') {
    echo json_encode(['page' => 1, 'total_pages' => 1, 'total_results' => 1, 'results' => [$movie]]);
} elseif ($path === '/search/tv') {
    echo json_encode(['page' => 1, 'total_pages' => 1, 'total_results' => 1, 'results' => [$show]]);
} elseif ($path === '/movie/9001') {
    echo json_encode($movie + ['runtime' => 101, 'genres' => [['id' => 1, 'name' => 'Fake Genre']]]);
} elseif ($path === '/tv/9002') {
    echo json_encode($show + ['episode_run_time' => [45], 'number_of_seasons' => 2, 'genres' => []]);
} else {
    http_response_code(404);
    echo json_encode(['status_message' => 'The resource you requested could not be found.']);
}
