<?php
require_once __DIR__ . '/../config/Database.php';

/**
 * Shared database code for all DAO classes.
 *
 * A DAO (Data Access Object) is the only place that contains SQL for one table. Every query uses
 * PDO prepared statements: values are never pasted into the SQL text, they are passed separately.
 *
 * Child classes set the table name and list the columns that may be written ($columns).
 * Column names come from that list, never from the caller, so a caller cannot sneak in other columns.
 */
abstract class BaseDao
{
    protected PDO $db;
    protected string $table;
    protected string $primaryKey = 'id';
    /** Columns that create() and update() may write. */
    protected array $columns = [];
    /** Columns that findAll() and findById() return. A DAO can narrow this (UserDao hides the password hash). */
    protected string $selectColumns = '*';

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::connect();
    }

    // ---------- helpers for the child classes ----------

    /** Prepares and runs one SQL statement. Placeholders (?) are filled from $params. */
    protected function run(string $sql, array $params = []): PDOStatement
    {
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        return $statement;
    }

    /** First matching row, or null when there is none. */
    protected function fetchOne(string $sql, array $params = []): ?array
    {
        $row = $this->run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    /** All matching rows (an empty array when there are none). */
    protected function fetchAll(string $sql, array $params = []): array
    {
        return $this->run($sql, $params)->fetchAll();
    }

    // ---------- CRUD ----------

    /** Read all rows. */
    public function findAll(): array
    {
        return $this->fetchAll("SELECT {$this->selectColumns} FROM {$this->table} ORDER BY {$this->primaryKey}");
    }

    /** Read one row by its id, or null when it does not exist. */
    public function findById(int $id): ?array
    {
        return $this->fetchOne("SELECT {$this->selectColumns} FROM {$this->table} WHERE {$this->primaryKey} = ?", [$id]);
    }

    /** Insert a row and return its new id. $data is column => value. */
    public function create(array $data): int
    {
        $this->checkColumns($data);
        $names = array_keys($data);
        $placeholders = implode(', ', array_fill(0, count($names), '?'));
        $this->run(
            "INSERT INTO {$this->table} (" . implode(', ', $names) . ") VALUES ($placeholders)",
            array_values($data)
        );
        return (int) $this->db->lastInsertId();
    }

    /** Change some columns of one row. Returns true when the row exists. */
    public function update(int $id, array $data): bool
    {
        $this->checkColumns($data);
        $assignments = implode(', ', array_map(fn ($name) => "$name = ?", array_keys($data)));
        $statement = $this->run(
            "UPDATE {$this->table} SET $assignments WHERE {$this->primaryKey} = ?",
            [...array_values($data), $id]
        );
        return $statement->rowCount() > 0;
    }

    /** Delete one row. Returns true when a row was deleted. */
    public function delete(int $id): bool
    {
        return $this->run("DELETE FROM {$this->table} WHERE {$this->primaryKey} = ?", [$id])->rowCount() > 0;
    }

    /** Rejects empty data and any column that is not in $columns. */
    protected function checkColumns(array $data): void
    {
        if ($data === []) {
            throw new InvalidArgumentException('No data was given.');
        }
        foreach (array_keys($data) as $name) {
            if (!in_array($name, $this->columns, true)) {
                throw new InvalidArgumentException("Column '$name' is not allowed for table {$this->table}.");
            }
        }
    }
}
