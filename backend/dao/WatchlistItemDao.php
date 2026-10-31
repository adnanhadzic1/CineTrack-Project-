<?php
require_once __DIR__ . '/BaseDao.php';

/** Table `watchlist_items`: one user tracking one title. */
class WatchlistItemDao extends BaseDao
{
    protected string $table = 'watchlist_items';
    protected array $columns = ['user_id', 'title_id', 'status', 'progress_pct', 'progress_note'];

    /** A user's watchlist, newest change first. Optionally only one status ('planned', 'watching', 'completed'). */
    public function findByUserId(int $userId, ?string $status = null): array
    {
        if ($status === null) {
            return $this->fetchAll('SELECT * FROM watchlist_items WHERE user_id = ? ORDER BY updated_at DESC, id DESC', [$userId]);
        }
        return $this->fetchAll('SELECT * FROM watchlist_items WHERE user_id = ? AND status = ? ORDER BY updated_at DESC, id DESC', [$userId, $status]);
    }

    /** The entry of one user for one title (null if the title is not on the list). */
    public function findByUserAndTitle(int $userId, int $titleId): ?array
    {
        return $this->fetchOne('SELECT * FROM watchlist_items WHERE user_id = ? AND title_id = ?', [$userId, $titleId]);
    }

    /** How many items a user has per status, for example ['planned' => 3, 'watching' => 2, 'completed' => 3]. */
    public function countByStatus(int $userId): array
    {
        $counts = ['planned' => 0, 'watching' => 0, 'completed' => 0];
        $rows = $this->fetchAll('SELECT status, COUNT(*) AS total FROM watchlist_items WHERE user_id = ? GROUP BY status', [$userId]);
        foreach ($rows as $row) {
            $counts[$row['status']] = (int) $row['total'];
        }
        return $counts;
    }
}
