<?php
require_once __DIR__ . '/BaseDao.php';

/** Table `reviews`: one user's rating and text for one title. */
class ReviewDao extends BaseDao
{
    protected string $table = 'reviews';
    protected array $columns = ['user_id', 'title_id', 'rating', 'body'];

    /** All reviews of one user, newest first. */
    public function findByUserId(int $userId): array
    {
        return $this->fetchAll('SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC, id DESC', [$userId]);
    }

    /** All reviews of one title, with the author's name (never the e-mail or the hash). */
    public function findByTitleId(int $titleId): array
    {
        return $this->fetchAll(
            'SELECT r.*, u.name AS user_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.title_id = ? ORDER BY r.created_at DESC, r.id DESC',
            [$titleId]
        );
    }

    /** The review of one user for one title, or null. */
    public function findByUserAndTitle(int $userId, int $titleId): ?array
    {
        return $this->fetchOne('SELECT * FROM reviews WHERE user_id = ? AND title_id = ?', [$userId, $titleId]);
    }

    /** Average rating of a title, or null when nobody reviewed it. */
    public function averageRatingForTitle(int $titleId): ?float
    {
        $row = $this->fetchOne('SELECT AVG(rating) AS average FROM reviews WHERE title_id = ?', [$titleId]);
        return $row['average'] === null ? null : round((float) $row['average'], 1);
    }
}
