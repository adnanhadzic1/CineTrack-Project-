<?php
require_once __DIR__ . '/ApiException.php';
require_once __DIR__ . '/Validator.php';
require_once __DIR__ . '/Format.php';
require_once __DIR__ . '/../dao/GenreDao.php';

/** Business rules for genres: the name is required, at most 40 characters and unique. */
class GenreService
{
    private GenreDao $genres;

    public function __construct()
    {
        $this->genres = new GenreDao();
    }

    public function getAll(): array
    {
        return Format::camelList($this->genres->findAll());
    }

    public function getById(int $id): array
    {
        $genre = $this->genres->findById($id);
        if ($genre === null) {
            throw ApiException::notFound('Genre');
        }
        return Format::camel($genre);
    }

    public function create(array $data): array
    {
        $errors = [];
        $name = Validator::text($data, 'name', 1, 40, $errors);
        Validator::throwIfAny($errors);

        $this->assertNameIsFree($name, null);
        $id = $this->genres->create(['name' => $name]);
        return $this->getById($id);
    }

    public function update(int $id, array $data): array
    {
        $this->getById($id);   // 404 when the genre does not exist
        $errors = [];
        $name = Validator::text($data, 'name', 1, 40, $errors);
        Validator::throwIfAny($errors);

        $this->assertNameIsFree($name, $id);
        $this->genres->update($id, ['name' => $name]);
        return $this->getById($id);
    }

    /** Deleting a genre also removes its links to titles (ON DELETE CASCADE); the titles stay. */
    public function delete(int $id): void
    {
        $this->getById($id);
        $this->genres->delete($id);
    }

    /** Two genres may not have the same name. $ownId is the genre being edited (it may keep its own name). */
    private function assertNameIsFree(string $name, ?int $ownId): void
    {
        $existing = $this->genres->findByName($name);
        if ($existing !== null && (int) $existing['id'] !== $ownId) {
            throw ApiException::conflict('A genre with this name already exists');
        }
    }
}
