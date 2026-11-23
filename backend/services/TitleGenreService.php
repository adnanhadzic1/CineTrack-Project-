<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Format.php';
require_once __DIR__ . '/../dao/TitleGenreDao.php';
require_once __DIR__ . '/../dao/TitleDao.php';
require_once __DIR__ . '/../dao/GenreDao.php';

/**
 * The link table between titles and genres. It has no id of its own: a link is the pair (titleId, genreId).
 */
class TitleGenreService
{
    private TitleGenreDao $links;
    private TitleDao $titles;
    private GenreDao $genres;

    public function __construct()
    {
        $this->links = new TitleGenreDao();
        $this->titles = new TitleDao();
        $this->genres = new GenreDao();
    }

    /** All links, or only those of one title and/or one genre. */
    public function getAll(?int $titleId, ?int $genreId): array
    {
        if ($titleId !== null) {
            $rows = $this->links->findByTitleId($titleId);
        } elseif ($genreId !== null) {
            $rows = $this->links->findByGenreId($genreId);
        } else {
            $rows = $this->links->findAll();
        }
        if ($titleId !== null && $genreId !== null) {
            $rows = array_values(array_filter($rows, fn ($row) => (int) $row['genre_id'] === $genreId));
        }
        return Format::camelList($rows);
    }

    /** Give a title one more genre. */
    public function add(array $data): array
    {
        $errors = [];
        $titleId = Validator::whole($data['titleId'] ?? null, 'titleId', 1, 4294967295, $errors);
        $genreId = Validator::whole($data['genreId'] ?? null, 'genreId', 1, 4294967295, $errors);
        Validator::throwIfAny($errors);

        if ($this->titles->findById($titleId) === null) {
            $errors['titleId'] = 'title does not exist';
        }
        if ($this->genres->findById($genreId) === null) {
            $errors['genreId'] = 'genre does not exist';
        }
        Validator::throwIfAny($errors);

        if ($this->links->exists($titleId, $genreId)) {
            throw ApiException::conflict('This title already has this genre');
        }
        $this->links->add($titleId, $genreId);
        return ['titleId' => $titleId, 'genreId' => $genreId];
    }

    public function remove(int $titleId, int $genreId): void
    {
        if (!$this->links->remove($titleId, $genreId)) {
            throw ApiException::notFound('Title-genre link');
        }
    }

    /** Replace all genres of a title with the given list of genre ids (an empty list removes all genres). */
    public function replaceForTitle(int $titleId, array $data): array
    {
        if ($this->titles->findById($titleId) === null) {
            throw ApiException::notFound('Title');
        }
        $errors = [];
        $genreIds = $this->cleanGenreIds($data['genreIds'] ?? null, $errors);
        Validator::throwIfAny($errors);

        $this->links->replaceForTitle($titleId, $genreIds);
        return Format::camelList($this->links->findByTitleId($titleId));
    }

    /**
     * Checks a list of genre ids from a request: it must be a list of whole numbers and every genre must exist.
     * TitleService uses this too. Returns the list without duplicates; problems are added to $errors.
     */
    public function cleanGenreIds(mixed $genreIds, array &$errors): array
    {
        if (!is_array($genreIds) || !array_is_list($genreIds)) {
            $errors['genreIds'] = 'must be a list of genre ids, for example [1, 4]';
            return [];
        }
        $clean = [];
        foreach ($genreIds as $genreId) {
            $single = [];
            $id = Validator::whole($genreId, 'genreIds', 1, 4294967295, $single);
            if ($id === null) {
                $errors['genreIds'] = 'every genre id must be a positive whole number';
                return [];
            }
            if ($this->genres->findById($id) === null) {
                $errors['genreIds'] = "genre $id does not exist";
                return [];
            }
            $clean[] = $id;
        }
        return array_values(array_unique($clean));
    }
}
