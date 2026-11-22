<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Format.php';
require_once __DIR__ . '/../dao/UserDao.php';

/**
 * Business rules for user accounts.
 * Passwords are received as plain text only to be hashed at once; a hash is never sent back.
 * (Login and tokens are added in Milestone 4.)
 */
class UserService
{
    private UserDao $users;

    public function __construct()
    {
        $this->users = new UserDao();
    }

    public function getAll(): array
    {
        return array_map([$this, 'toApi'], $this->users->findAll());
    }

    public function getById(int $id): array
    {
        $user = $this->users->findById($id);
        if ($user === null) {
            throw ApiException::notFound('User');
        }
        return $this->toApi($user);
    }

    public function create(array $data): array
    {
        $errors = [];
        $row = $this->cleanFields($data, true, $errors);
        Validator::throwIfAny($errors);

        $this->assertEmailIsFree($row['email'], null);
        $id = $this->users->create($row);
        return $this->getById($id);
    }

    /** Changes only the fields that are sent (name, email, password, role, isActive). */
    public function update(int $id, array $data): array
    {
        $this->getById($id);   // 404 when the user does not exist
        $errors = [];
        $row = $this->cleanFields($data, false, $errors);
        Validator::throwIfAny($errors);
        if ($row === []) {
            throw ApiException::validation(['body' => 'send at least one field to change']);
        }

        if (isset($row['email'])) {
            $this->assertEmailIsFree($row['email'], $id);
        }
        $this->users->update($id, $row);
        return $this->getById($id);
    }

    /** Deleting a user also deletes their watchlist entries and reviews (ON DELETE CASCADE). */
    public function delete(int $id): void
    {
        $this->getById($id);
        $this->users->delete($id);
    }

    /**
     * Validates the user fields of a request and returns them as database columns.
     * When $isNew is true, name, email and password are required.
     */
    private function cleanFields(array $data, bool $isNew, array &$errors): array
    {
        $row = [];
        if ($isNew || array_key_exists('name', $data)) {
            $row['name'] = Validator::text($data, 'name', 1, 60, $errors);
        }
        if ($isNew || array_key_exists('email', $data)) {
            $row['email'] = $this->cleanEmail($data, $errors);
        }
        if ($isNew || array_key_exists('password', $data)) {
            $password = $this->cleanPassword($data['password'] ?? null, $errors);
            if ($password !== null) {
                $row['password_hash'] = password_hash($password, PASSWORD_BCRYPT);
            }
        }
        if (array_key_exists('role', $data)) {
            $row['role'] = Validator::oneOf($data['role'], 'role', ['user', 'admin'], $errors);
        }
        if (array_key_exists('isActive', $data)) {
            if (is_bool($data['isActive'])) {
                $row['is_active'] = $data['isActive'] ? 1 : 0;
            } else {
                $errors['isActive'] = 'must be true or false';
            }
        }
        return $row;
    }

    private function cleanEmail(array $data, array &$errors): ?string
    {
        $email = Validator::text($data, 'email', 3, 255, $errors);
        if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errors['email'] = 'must be a valid e-mail address';
            return null;
        }
        return $email === null ? null : strtolower($email);
    }

    /** At least 8 characters with a letter and a number (the same rule as the registration form). 72 is bcrypt's limit. */
    private function cleanPassword(mixed $password, array &$errors): ?string
    {
        if (!is_string($password) || strlen($password) < 8 || strlen($password) > 72) {
            $errors['password'] = 'must be 8 to 72 characters';
            return null;
        }
        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            $errors['password'] = 'must contain at least one letter and one number';
            return null;
        }
        return $password;
    }

    private function assertEmailIsFree(string $email, ?int $ownId): void
    {
        $existing = $this->users->findByEmail($email);
        if ($existing !== null && (int) $existing['id'] !== $ownId) {
            throw ApiException::conflict('This e-mail address is already registered');
        }
    }

    /** camelCase keys and a real true/false for is_active. */
    private function toApi(array $user): array
    {
        $user = Format::camel($user);
        $user['isActive'] = (bool) $user['isActive'];
        return $user;
    }
}
