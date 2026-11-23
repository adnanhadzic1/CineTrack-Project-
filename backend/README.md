# CineTrack backend

Milestone 2 added the **database and the DAO layer**. Milestone 3 adds the **services, the FlightPHP REST API, the OpenAPI/Swagger documentation and the TMDB service**. Authentication and middleware come in M4.

```
Fetch (frontend service) -> routes/ -> middleware/ -> services/ -> dao/ -> PDO / MySQL -> JSON
                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^ M3 (middleware: M4)      ^^^^^ M2
```

| Folder        | Purpose                                                                  | Status |
|---------------|--------------------------------------------------------------------------|--------|
| `config/`     | `config.example.php` (committed), `config.php` (your real settings, **never committed**), `Config.php` (reads it), `Database.php` (creates the PDO connection) | done |
| `dao/`        | `BaseDao` + `UserDao`, `TitleDao`, `GenreDao`, `TitleGenreDao`, `WatchlistItemDao`, `ReviewDao` | M2 done |
| `tests/`      | `dao_test.php` (M2) and `api_test.php` + `fake_tmdb.php` (M3): plain PHP checks | done |
| `routes/`     | FlightPHP routes, one file per entity plus `external.php` and `helpers.php` | M3 done |
| `services/`   | One service per entity (`UserService` … `ReviewService`), `TmdbService`, and the helpers `Validator`, `Format`, `ApiException`; the only layer that calls DAOs | M3 done |
| `bootstrap.php` | Loads Composer's autoloader, the config, the database class and all services | M3 done |
| `middleware/` | JWT authentication, role authorization, request logging, error handling  | planned M4 |
| `logs/`       | Runtime logs. Contents are git-ignored                                   | planned M4 |
| `public/`     | `index.php` (entry point: CORS, JSON errors, routes) and `docs/index.html` (Swagger UI) | M3 done |
| `openapi.yaml` | The OpenAPI 3 specification of every endpoint                           | M3 done |

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

PHP needs the `pdo_mysql` and `curl` extensions.

## M3: install and start the API

```bash
cd backend && composer install      # FlightPHP into backend/vendor (git-ignored)
cd ..
php -S localhost:8001 -t backend/public
```

- Swagger UI: <http://localhost:8001/docs/> (loads the real `backend/openapi.yaml` through `/openapi`; the page needs internet for its CDN files).
- TMDB: put your token in `backend/config/config.php` under `tmdb.api_read_token` (see the project README).
- API test: `php backend/tests/api_test.php` (must end with "0 failed").

## How one request travels (M3)

Example `POST /reviews` with `{"userId":1,"titleId":3,"rating":4,"body":"Good"}`:

1. `public/index.php` receives it and loads `routes/reviews.php`.
2. The route calls `jsonBody()` and passes the array to `ReviewService::create()`.
3. The service checks the fields (`Validator`), checks that user and title exist and that this user has not reviewed this title yet, then calls `ReviewDao::create()`. Problems become an `ApiException` (400, 404 or 409).
4. The DAO runs a prepared `INSERT` and the service reads the new row back.
5. The route answers `201` with `{"success":true,"data":{...},"message":"..."}`. An `ApiException` is turned into the error JSON by the error handler in `public/index.php`; any other exception becomes a generic 500 (the real reason goes to the server log only).

Notes: the URL `/openapi` has no `.yaml` ending on purpose (PHP's built-in server would answer such URLs with its own HTML 404 page). The Composer lock file is not committed because Packagist could not be reached where the project was developed; `composer install` creates it on your machine.
