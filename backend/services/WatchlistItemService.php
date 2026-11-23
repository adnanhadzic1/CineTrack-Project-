<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Format.php';
require_once __DIR__ . '/../dao/WatchlistItemDao.php';
require_once __DIR__ . '/../dao/UserDao.php';
require_once __DIR__ . '/../dao/TitleDao.php';

/**
 * Business rules for watchlist items (one user tracking one title).
 * In M3 the user id comes from the request; in M4 it will come from the login token.
 */
class WatchlistItemService
{
    private const STATUSES = ['planned', 'watching', 'completed'];

    private WatchlistItemDao $items;
    private UserDao $users;
    private TitleDao $titles;

    public function __construct()
    {
        $this->items = new WatchlistItemDao();
        $this->users = new UserDao();
        $this->titles = new TitleDao();
    }

    /** All items, or those of one user (optionally only one status). */
    public function getAll(?int $userId, ?string $status): array
    {
        $errors = [];
        if ($status !== null) {
            Validator::oneOf($status, 'status', self::STATUSES, $errors);
        }
        if ($status !== null && $userId === null) {
            $errors['userId'] = 'is required when filtering by status';
        }
        Validator::throwIfAny($errors);

        $rows = $userId === null ? $this->items->findAll() : $this->items->findByUserId($userId, $status);
        return Format::camelList($rows);
    }

    public function getById(int $id): array
    {
        $item = $this->items->findById($id);
        if ($item === null) {
            throw ApiException::notFound('Watchlist item');
        }
        return Format::camel($item);
    }

    public function create(array $data): array
    {
        $errors = [];
        $userId = Validator::whole($data['userId'] ?? null, 'userId', 1, 4294967295, $errors);
        $titleId = Validator::whole($data['titleId'] ?? null, 'titleId', 1, 4294967295, $errors);
        $row = $this->cleanProgress($data, 'planned', $errors);
        Validator::throwIfAny($errors);

        if ($this->users->findById($userId) === null) {
            $errors['userId'] = 'user does not exist';
        }
        if ($this->titles->findById($titleId) === null) {
            $errors['titleId'] = 'title does not exist';
        }
        Validator::throwIfAny($errors);

        if ($this->items->findByUserAndTitle($userId, $titleId) !== null) {
            throw ApiException::conflict('This title is already on the watchlist of this user');
        }
        $id = $this->items->create(['user_id' => $userId, 'title_id' => $titleId] + $row);
        return $this->getById($id);
    }

    /** Changes status, progressPct and progressNote. The user and the title of an item cannot be changed. */
    public function update(int $id, array $data): array
    {
        $current = $this->getById($id);   // 404 when the item does not exist
        $errors = [];
        $row = $this->cleanProgress($data, $current['status'], $errors, true);
        Validator::throwIfAny($errors);
        if ($row === []) {
            throw ApiException::validation(['body' => 'send at least one of: status, progressPct, progressNote']);
        }
        $this->items->update($id, $row);
        return $this->getById($id);
    }

    public function delete(int $id): void
    {
        $this->getById($id);
        $this->items->delete($id);
    }

    /**
     * Validates status, progressPct and progressNote and returns them as database columns.
     * Only the fields that were sent are returned, except that a new item always gets a status.
     * Rule: when the status is set but no progress is sent, 'planned' resets progress to 0 and
     * 'completed' sets it to 100 (this is how the frontend prototype behaves).
     */
    private function cleanProgress(array $data, string $defaultStatus, array &$errors, bool $isUpdate = false): array
    {
        $row = [];
        if (array_key_exists('status', $data) || !$isUpdate) {
            $status = $data['status'] ?? $defaultStatus;
            $row['status'] = Validator::oneOf($status, 'status', self::STATUSES, $errors);
        }
        if (array_key_exists('progressPct', $data)) {
            $row['progress_pct'] = Validator::whole($data['progressPct'], 'progressPct', 0, 100, $errors);
        } elseif (($row['status'] ?? null) === 'completed') {
            $row['progress_pct'] = 100;
        } elseif (($row['status'] ?? null) === 'planned') {
            $row['progress_pct'] = 0;
        }
        if (array_key_exists('progressNote', $data)) {
            $row['progress_note'] = Validator::optionalText($data, 'progressNote', 100, $errors);
        }
        return $row;
    }
}
