<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Format.php';
require_once __DIR__ . '/../dao/ReviewDao.php';
require_once __DIR__ . '/../dao/UserDao.php';
require_once __DIR__ . '/../dao/TitleDao.php';

/** Business rules for reviews: a rating from 1 to 5 and a text, one review per user and title. */
class ReviewService
{
    private ReviewDao $reviews;
    private UserDao $users;
    private TitleDao $titles;

    public function __construct()
    {
        $this->reviews = new ReviewDao();
        $this->users = new UserDao();
        $this->titles = new TitleDao();
    }

    /** All reviews, or those of one user, or those of one title. */
    public function getAll(?int $userId, ?int $titleId): array
    {
        if ($userId !== null && $titleId !== null) {
            $review = $this->reviews->findByUserAndTitle($userId, $titleId);
            $rows = $review === null ? [] : [$review];
        } elseif ($userId !== null) {
            $rows = $this->reviews->findByUserId($userId);
        } elseif ($titleId !== null) {
            $rows = $this->reviews->findByTitleId($titleId);
        } else {
            $rows = $this->reviews->findAll();
        }
        return Format::camelList($rows);
    }

    public function getById(int $id): array
    {
        $review = $this->reviews->findById($id);
        if ($review === null) {
            throw ApiException::notFound('Review');
        }
        return Format::camel($review);
    }

    public function create(array $data): array
    {
        $errors = [];
        $userId = Validator::whole($data['userId'] ?? null, 'userId', 1, 4294967295, $errors);
        $titleId = Validator::whole($data['titleId'] ?? null, 'titleId', 1, 4294967295, $errors);
        $rating = Validator::whole($data['rating'] ?? null, 'rating', 1, 5, $errors);
        $body = Validator::text($data, 'body', 1, 5000, $errors);
        Validator::throwIfAny($errors);

        if ($this->users->findById($userId) === null) {
            $errors['userId'] = 'user does not exist';
        }
        if ($this->titles->findById($titleId) === null) {
            $errors['titleId'] = 'title does not exist';
        }
        Validator::throwIfAny($errors);

        if ($this->reviews->findByUserAndTitle($userId, $titleId) !== null) {
            throw ApiException::conflict('This user has already reviewed this title');
        }
        $id = $this->reviews->create(['user_id' => $userId, 'title_id' => $titleId, 'rating' => $rating, 'body' => $body]);
        return $this->getById($id);
    }

    /** Changes rating and/or body. The user and the title of a review cannot be changed. */
    public function update(int $id, array $data): array
    {
        $this->getById($id);   // 404 when the review does not exist
        $errors = [];
        $row = [];
        if (array_key_exists('rating', $data)) {
            $row['rating'] = Validator::whole($data['rating'], 'rating', 1, 5, $errors);
        }
        if (array_key_exists('body', $data)) {
            $row['body'] = Validator::text($data, 'body', 1, 5000, $errors);
        }
        Validator::throwIfAny($errors);
        if ($row === []) {
            throw ApiException::validation(['body' => 'send at least one of: rating, body']);
        }
        $this->reviews->update($id, $row);
        return $this->getById($id);
    }

    public function delete(int $id): void
    {
        $this->getById($id);
        $this->reviews->delete($id);
    }
}
