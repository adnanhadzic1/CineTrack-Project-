<?php
require_once __DIR__ . '/BaseDao.php';

/** Table `genres`. */
class GenreDao extends BaseDao
{
    protected string $table = 'genres';
    protected array $columns = ['name'];

    public function findByName(string $name): ?array
    {
        return $this->fetchOne('SELECT * FROM genres WHERE name = ?', [$name]);
    }

    /** All genres of one title. */
    public function findByTitleId(int $titleId): array
    {
        return $this->fetchAll(
            'SELECT g.* FROM genres g JOIN title_genres tg ON tg.genre_id = g.id WHERE tg.title_id = ? ORDER BY g.name',
            [$titleId]
        );
    }
}
