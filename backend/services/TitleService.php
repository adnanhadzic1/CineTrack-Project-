<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Format.php';
require_once __DIR__ . '/TitleGenreService.php';
require_once __DIR__ . '/../dao/TitleDao.php';
require_once __DIR__ . '/../dao/GenreDao.php';

/**
 * Business rules for titles (movies and TV shows that CineTrack knows).
 * Only the basic facts are stored locally; descriptions and ratings come from TMDB (see TmdbService).
 */
class TitleService
{
    private TitleDao $titles;
    private GenreDao $genres;
    private TitleGenreService $titleGenres;

    public function __construct()
    {
        $this->titles = new TitleDao();
        $this->genres = new GenreDao();
        $this->titleGenres = new TitleGenreService();
    }

    /** All titles. Optional filters: part of the name, 'movie' or 'tv', and a genre id. */
    public function getAll(?string $search, ?string $mediaType, ?int $genreId): array
    {
        $errors = [];
        if ($mediaType !== null) {
            Validator::oneOf($mediaType, 'type', ['movie', 'tv'], $errors);
        }
        Validator::throwIfAny($errors);

        if ($genreId !== null) {
            $rows = $this->titles->findByGenreId($genreId);
        } elseif ($search !== null && $search !== '') {
            $rows = $this->titles->search($search);
        } else {
            $rows = $this->titles->findAll();
        }
        // The DAO can combine only some filters, so the remaining ones are applied here.
        if ($genreId !== null && $search !== null && $search !== '') {
            $rows = array_filter($rows, fn ($row) => stripos($row['title'], $search) !== false);
        }
        if ($mediaType !== null) {
            $rows = array_filter($rows, fn ($row) => $row['media_type'] === $mediaType);
        }
        return Format::camelList(array_values($rows));
    }

    /** One title together with its genres. */
    public function getById(int $id): array
    {
        $title = $this->titles->findById($id);
        if ($title === null) {
            throw ApiException::notFound('Title');
        }
        $title = Format::camel($title);
        $title['genres'] = Format::camelList($this->genres->findByTitleId($id));
        return $title;
    }

    public function create(array $data): array
    {
        $errors = [];
        $row = $this->cleanFields($data, true, $errors);
        $genreIds = array_key_exists('genreIds', $data) ? $this->titleGenres->cleanGenreIds($data['genreIds'], $errors) : null;
        Validator::throwIfAny($errors);

        $this->assertTmdbIdIsFree($row['tmdb_id'] ?? null, $row['media_type'], null);
        $id = $this->titles->create($row);
        if ($genreIds !== null) {
            $this->titleGenres->replaceForTitle($id, ['genreIds' => $genreIds]);
        }
        return $this->getById($id);
    }

    /** Changes only the fields that are sent. */
    public function update(int $id, array $data): array
    {
        $current = $this->getById($id);   // 404 when the title does not exist
        $errors = [];
        $row = $this->cleanFields($data, false, $errors);
        $genreIds = array_key_exists('genreIds', $data) ? $this->titleGenres->cleanGenreIds($data['genreIds'], $errors) : null;
        Validator::throwIfAny($errors);
        if ($row === [] && $genreIds === null) {
            throw ApiException::validation(['body' => 'send at least one field to change']);
        }

        $mediaType = $row['media_type'] ?? $current['mediaType'];
        $tmdbId = array_key_exists('tmdb_id', $row) ? $row['tmdb_id'] : $current['tmdbId'];
        $this->assertTmdbIdIsFree($tmdbId, $mediaType, $id);

        if ($row !== []) {
            $this->titles->update($id, $row);
        }
        if ($genreIds !== null) {
            $this->titleGenres->replaceForTitle($id, ['genreIds' => $genreIds]);
        }
        return $this->getById($id);
    }

    /** Deleting a title also deletes its watchlist entries, reviews and genre links (ON DELETE CASCADE). */
    public function delete(int $id): void
    {
        $this->getById($id);
        $this->titles->delete($id);
    }

    /**
     * Validates the title fields of a request and returns them as database columns.
     * When $isNew is true, mediaType and title are required; otherwise only the fields that were sent are checked.
     */
    private function cleanFields(array $data, bool $isNew, array &$errors): array
    {
        $row = [];
        if ($isNew || array_key_exists('mediaType', $data)) {
            $row['media_type'] = Validator::oneOf($data['mediaType'] ?? null, 'mediaType', ['movie', 'tv'], $errors);
        }
        if ($isNew || array_key_exists('title', $data)) {
            $row['title'] = Validator::text($data, 'title', 1, 200, $errors);
        }
        if (array_key_exists('tmdbId', $data)) {
            $row['tmdb_id'] = $data['tmdbId'] === null ? null : Validator::whole($data['tmdbId'], 'tmdbId', 1, 4294967295, $errors);
        }
        if (array_key_exists('releaseDate', $data)) {
            $row['release_date'] = $data['releaseDate'] === null ? null : Validator::date($data['releaseDate'], 'releaseDate', $errors);
        }
        if (array_key_exists('posterPath', $data)) {
            $row['poster_path'] = Validator::optionalText($data, 'posterPath', 255, $errors);
        }
        return $row;
    }

    /** The pair (tmdbId, mediaType) may exist only once. A title without a tmdbId is always allowed. */
    private function assertTmdbIdIsFree(?int $tmdbId, string $mediaType, ?int $ownId): void
    {
        if ($tmdbId === null) {
            return;
        }
        $existing = $this->titles->findByTmdbId($tmdbId, $mediaType);
        if ($existing !== null && (int) $existing['id'] !== $ownId) {
            throw ApiException::conflict('A title with this tmdbId and mediaType already exists');
        }
    }
}
