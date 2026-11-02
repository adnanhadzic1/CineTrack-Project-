<?php
require_once __DIR__ . '/BaseDao.php';

/**
 * Table `title_genres` (junction table between titles and genres).
 *
 * Its primary key is the pair (title_id, genre_id), not a single `id`, so the generic
 * findById / update / delete of BaseDao do not fit and are replaced by the methods below.
 */
class TitleGenreDao extends BaseDao
{
    protected string $table = 'title_genres';
    protected array $columns = ['title_id', 'genre_id'];

    /** Give a title one genre. The database rejects a duplicate pair. */
    public function add(int $titleId, int $genreId): void
    {
        $this->run('INSERT INTO title_genres (title_id, genre_id) VALUES (?, ?)', [$titleId, $genreId]);
    }

    public function exists(int $titleId, int $genreId): bool
    {
        return $this->fetchOne('SELECT 1 AS found FROM title_genres WHERE title_id = ? AND genre_id = ?', [$titleId, $genreId]) !== null;
    }

    /** The rows of one title. */
    public function findByTitleId(int $titleId): array
    {
        return $this->fetchAll('SELECT * FROM title_genres WHERE title_id = ? ORDER BY genre_id', [$titleId]);
    }

    /** The rows of one genre. */
    public function findByGenreId(int $genreId): array
    {
        return $this->fetchAll('SELECT * FROM title_genres WHERE genre_id = ? ORDER BY title_id', [$genreId]);
    }

    /** Remove one genre from one title. Returns true when the pair existed. */
    public function remove(int $titleId, int $genreId): bool
    {
        return $this->run('DELETE FROM title_genres WHERE title_id = ? AND genre_id = ?', [$titleId, $genreId])->rowCount() > 0;
    }

    /**
     * Replace all genres of a title with a new list ("update").
     * Two steps (delete, insert) that must succeed together, so they run in one transaction.
     */
    public function replaceForTitle(int $titleId, array $genreIds): void
    {
        $this->db->beginTransaction();
        try {
            $this->run('DELETE FROM title_genres WHERE title_id = ?', [$titleId]);
            foreach (array_unique($genreIds) as $genreId) {
                $this->add($titleId, (int) $genreId);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /** All rows of the table. */
    public function findAll(): array
    {
        return $this->fetchAll('SELECT * FROM title_genres ORDER BY title_id, genre_id');
    }

    // The single-id methods of BaseDao do not apply to a composite key.
    public function findById(int $id): ?array { throw new LogicException('title_genres has no single id. Use findByTitleId() or exists().'); }
    public function update(int $id, array $data): bool { throw new LogicException('Use replaceForTitle() to change the genres of a title.'); }
    public function delete(int $id): bool { throw new LogicException('Use remove() or replaceForTitle().'); }
}
