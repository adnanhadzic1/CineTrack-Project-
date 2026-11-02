<?php
require_once __DIR__ . '/BaseDao.php';

/** Table `users`. The normal read methods never return password_hash. */
class UserDao extends BaseDao
{
    protected string $table = 'users';
    protected array $columns = ['name', 'email', 'password_hash', 'role', 'is_active'];
    protected string $selectColumns = 'id, name, email, role, is_active, created_at, updated_at';

    /** Find a user by e-mail (without the password hash). */
    public function findByEmail(string $email): ?array
    {
        return $this->fetchOne("SELECT {$this->selectColumns} FROM users WHERE email = ?", [$email]);
    }

    /** Only for the login check (M4): the one method that returns the hash. */
    public function findByEmailWithPasswordHash(string $email): ?array
    {
        return $this->fetchOne('SELECT * FROM users WHERE email = ?', [$email]);
    }

    /** Store a new password hash (made with password_hash(), never a plain password). */
    public function updatePasswordHash(int $id, string $passwordHash): bool
    {
        return $this->update($id, ['password_hash' => $passwordHash]);
    }
}
