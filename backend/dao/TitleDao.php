<?php
require_once __DIR__ . '/BaseDao.php';

/** Table `titles` (movies and TV shows). */
class TitleDao extends BaseDao
{
    protected string $table = 'titles';
    protected array $columns = ['tmdb_id', 'media_type', 'title', 'release_date', 'poster_path'];

    /** Find the title that belongs to a TMDB id. The media type is needed because TMDB reuses ids. */
    public function findByTmdbId(int $tmdbId, string $mediaType): ?array
    {
        return $this->fetchOne('SELECT * FROM titles WHERE tmdb_id = ? AND media_type = ?', [$tmdbId, $mediaType]);
    }

    /** Titles whose name contains the text. Optionally only 'movie' or 'tv'. */
    public function search(string $text, ?string $mediaType = null): array
    {
        // % and _ are wildcards in LIKE, so a typed "%" is escaped to match only a real percent sign.
        $pattern = '%' . addcslashes($text, '%_\\') . '%';
        if ($mediaType === null) {
            return $this->fetchAll('SELECT * FROM titles WHERE title LIKE ? ORDER BY title', [$pattern]);
        }
        return $this->fetchAll('SELECT * FROM titles WHERE title LIKE ? AND media_type = ? ORDER BY title', [$pattern, $mediaType]);
    }

    /** All titles that have the given genre. */
    public function findByGenreId(int $genreId): array
    {
        return $this->fetchAll(
            'SELECT t.* FROM titles t JOIN title_genres tg ON tg.title_id = t.id WHERE tg.genre_id = ? ORDER BY t.title',
            [$genreId]
        );
    }
}
