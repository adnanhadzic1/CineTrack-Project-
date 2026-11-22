<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/../config/Config.php';

/**
 * The external API: The Movie Database (TMDB, themoviedb.org).
 *
 * Only the backend talks to TMDB. The access token stays in backend/config/config.php and is sent
 * in an HTTP header, so it never appears in a URL, a log line, a response or the frontend.
 * Every failure (not configured, no connection, timeout, bad answer) becomes an ApiException with a
 * clear status code and a message that is safe to show to a user.
 */
class TmdbService
{
    private const IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

    private string $token;
    private string $baseUrl;
    private int $timeoutSeconds;

    /** $settings is only given by tests; normally the 'tmdb' part of config.php is used. */
    public function __construct(?array $settings = null)
    {
        $settings = $settings ?? (Config::get()['tmdb'] ?? []);
        $this->token = (string) ($settings['api_read_token'] ?? '');
        $this->baseUrl = rtrim((string) ($settings['base_url'] ?? 'https://api.themoviedb.org/3'), '/');
        $this->timeoutSeconds = max(1, (int) ($settings['timeout_seconds'] ?? 5));
    }

    /**
     * Search by title. $type is 'all' (movies and TV shows), 'movie' or 'tv'.
     * Returns ['results' => [...], 'page' => 1, 'totalPages' => 3, 'totalResults' => 52].
     */
    public function search(string $query, string $type = 'all', int $page = 1): array
    {
        $errors = [];
        $query = trim($query);
        if ($query === '' || mb_strlen($query) > 100) {
            $errors['query'] = 'is required and must be 1 to 100 characters';
        }
        Validator::oneOf($type, 'type', ['all', 'movie', 'tv'], $errors);
        Validator::whole($page, 'page', 1, 500, $errors);
        Validator::throwIfAny($errors);

        $path = $type === 'all' ? '/search/multi' : "/search/$type";
        $answer = $this->get($path, ['query' => $query, 'page' => $page, 'include_adult' => 'false']);

        $results = [];
        foreach ($answer['results'] ?? [] as $item) {
            $mediaType = $item['media_type'] ?? $type;      // /search/movie and /search/tv do not repeat the type
            if ($mediaType === 'movie' || $mediaType === 'tv') {
                $results[] = $this->cleanItem($item, $mediaType);
            }
        }
        return [
            'results'      => $results,
            'page'         => (int) ($answer['page'] ?? $page),
            'totalPages'   => (int) ($answer['total_pages'] ?? 1),
            'totalResults' => (int) ($answer['total_results'] ?? count($results)),
        ];
    }

    /** Details of one movie or TV show (adds genres, runtime and number of seasons). */
    public function details(string $mediaType, int $tmdbId): array
    {
        $errors = [];
        Validator::oneOf($mediaType, 'mediaType', ['movie', 'tv'], $errors);
        Validator::whole($tmdbId, 'tmdbId', 1, 4294967295, $errors);
        Validator::throwIfAny($errors);

        $item = $this->get("/$mediaType/$tmdbId");
        $result = $this->cleanItem($item, $mediaType);
        $result['genres'] = array_map(fn ($genre) => $genre['name'] ?? '', $item['genres'] ?? []);
        $result['runtimeMinutes'] = $mediaType === 'movie' ? ($item['runtime'] ?? null) : ($item['episode_run_time'][0] ?? null);
        $result['seasons'] = $mediaType === 'tv' ? ($item['number_of_seasons'] ?? null) : null;
        return $result;
    }

    /** The same small set of fields for movies and TV shows (TMDB calls the title "name" for TV shows). */
    private function cleanItem(array $item, string $mediaType): array
    {
        $date = $item['release_date'] ?? $item['first_air_date'] ?? '';
        $poster = $item['poster_path'] ?? null;
        return [
            'tmdbId'      => (int) ($item['id'] ?? 0),
            'mediaType'   => $mediaType,
            'title'       => (string) ($item['title'] ?? $item['name'] ?? ''),
            'releaseDate' => $date === '' ? null : $date,
            'posterUrl'   => $poster ? self::IMAGE_BASE . $poster : null,
            'overview'    => (string) ($item['overview'] ?? ''),
            'rating'      => isset($item['vote_average']) ? round((float) $item['vote_average'], 1) : null,
        ];
    }

    /** Sends one GET request to TMDB and returns the decoded JSON. Every failure becomes an ApiException. */
    private function get(string $path, array $params = []): array
    {
        if ($this->token === '' || $this->token === 'CHANGE_ME') {
            throw new ApiException('The external movie database is not configured on the server.', 503);
        }

        $url = $this->baseUrl . $path . ($params === [] ? '' : '?' . http_build_query($params));
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeoutSeconds,        // the whole request
            CURLOPT_CONNECTTIMEOUT => $this->timeoutSeconds,        // just connecting
            CURLOPT_HTTPHEADER     => ['Accept: application/json', 'Authorization: Bearer ' . $this->token],
        ]);
        $body = curl_exec($curl);
        $curlError = curl_errno($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);

        if ($curlError === CURLE_OPERATION_TIMEDOUT) {
            throw new ApiException('The movie database did not answer in time. Please try again.', 504);
        }
        if ($curlError !== 0 || $body === false) {
            error_log("TMDB request failed (curl error $curlError) for $path");
            throw new ApiException('The movie database could not be reached. Please try again later.', 503);
        }
        return $this->readAnswer($status, (string) $body, $path);
    }

    /** Turns the HTTP status and body of TMDB's answer into data or an ApiException. */
    private function readAnswer(int $status, string $body, string $path): array
    {
        if ($status === 404) {
            throw ApiException::notFound('Title in the movie database');
        }
        if ($status === 401 || $status === 403) {
            error_log("TMDB rejected the access token (HTTP $status) for $path");
            throw new ApiException('The movie database rejected the server\'s credentials.', 503);
        }
        if ($status === 429) {
            throw new ApiException('The movie database is busy. Please try again in a moment.', 503);
        }
        if ($status !== 200) {
            error_log("TMDB answered with HTTP $status for $path");
            throw new ApiException('The movie database is temporarily unavailable.', 502);
        }
        $data = json_decode($body, true);
        if (!is_array($data)) {
            error_log("TMDB sent an answer that is not valid JSON for $path");
            throw new ApiException('The movie database sent an unexpected answer.', 502);
        }
        return $data;
    }
}
