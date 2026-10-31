# CineTrack backend

Milestone 2 adds the **database and the DAO layer**. There are still no routes, services, authentication or TMDB calls (M3 and M4).

```
Fetch (frontend service) -> routes/ -> middleware/ -> services/ -> dao/ -> PDO / MySQL -> JSON
                                                                  ^^^^^ done in M2
```

| Folder        | Purpose                                                                  | Status |
|---------------|--------------------------------------------------------------------------|--------|
| `config/`     | `config.example.php` (committed), `config.php` (your real settings, **never committed**), `Database.php` (creates the PDO connection) | M2 done |
| `dao/`        | `BaseDao` + `UserDao`, `TitleDao`, `GenreDao`, `TitleGenreDao`, `WatchlistItemDao`, `ReviewDao` | M2 done |
| `tests/`      | `dao_test.php`: plain PHP check of the database and all DAOs              | M2 done |
| `routes/`     | FlightPHP route definitions                                              | planned M3 |
| `services/`   | Business rules and validation, the TMDB client; the only layer that calls DAOs | planned M3 |
| `middleware/` | JWT authentication, role authorization, request logging, error handling  | planned M4 |
| `logs/`       | Runtime logs. Contents are git-ignored                                   | planned M4 |
| `public/`     | Web-server entry point and the Swagger UI page                           | planned M3 |

## How the pieces work together

1. `config/config.php` holds the database settings (host, name, user, password).
2. `Database::connect()` reads it and creates **one** PDO connection (exception mode, real prepared statements, utf8mb4). If the connection fails it logs the real reason on the server and throws a generic message, so credentials never reach a user.
3. `BaseDao` receives that connection and provides the shared code: `run()` (prepare + execute), `fetchOne()`, `fetchAll()` and the generic `findAll`, `findById`, `create`, `update`, `delete`. Each child DAO only says which table it uses and which columns may be written, and adds its own queries (for example `ReviewDao::findByTitleId()`).
4. Values are never pasted into SQL text: they are passed as `?` parameters. Column names come from the DAO's own `$columns` list, never from the caller.

## Local setup

```bash
# 1. Create the database and the sample data (needs MySQL 8.0.16+ (or MariaDB 10.11, which is what was tested))
mysql -u root -p < database/cinetrack.sql

# 2. Create your own settings file (it is git-ignored)
cp backend/config/config.example.php backend/config/config.php
#    then open backend/config/config.php and set 'user' and 'password' for your MySQL account

# 3. Run the DAO check (must print "0 failed")
php backend/tests/dao_test.php
```

Optional: create a dedicated MySQL user instead of using root:
`CREATE USER 'cinetrack_dev'@'localhost' IDENTIFIED BY 'choose-a-password'; GRANT ALL ON cinetrack.* TO 'cinetrack_dev'@'localhost';`

PHP needs the `pdo_mysql` extension. Composer is **not** needed for M2: the DAO files load each other with `require_once`. `composer.json` still only declares FlightPHP (version constraint unverified; install and check it in M3).
