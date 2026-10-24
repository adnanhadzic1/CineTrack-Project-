# CineTrack backend (not implemented yet)

Milestone 1 is a static frontend, so this folder only contains the **planned structure**.
Each sub-folder has one job in the final request flow:

```
Fetch (frontend service) -> routes/ -> middleware/ -> services/ -> dao/ -> PDO / MySQL -> JSON
```

| Folder        | Purpose                                                                  | Planned in |
|---------------|--------------------------------------------------------------------------|------------|
| `routes/`     | FlightPHP route definitions: read the request, call a service, return JSON | M3         |
| `services/`   | Business rules and validation. The only layer that calls DAOs; also the TMDB client | M3 |
| `dao/`        | `BaseDao` + one DAO per entity. PDO with prepared statements             | M2         |
| `middleware/` | JWT authentication, role authorization, request logging, error handling  | M4         |
| `config/`     | `config.example.php` (committed). `config.php` with real secrets is **not** committed | M2 |
| `logs/`       | `info.log` and `error.log` written at runtime. Contents are git-ignored  | M4         |
| `public/`     | Web-server entry point (`index.php`) and the Swagger UI page             | M3         |

`composer.json` only *declares* FlightPHP. The version constraint was written by hand in M1
(Packagist was not reachable from the build sandbox), so verify it with `composer install`
when you start M2/M3. `vendor/` is git-ignored.
