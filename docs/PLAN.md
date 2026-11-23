# CineTrack – Five-Milestone Plan

Deadlines are from the official course document. Each is Monday 08:00 (milestone 5: Wednesday 08:00). Each milestone lives on its own branch, `milestoneN`, with a pull request opened before the deadline. **Never merge a milestone branch into `main`**: the reviewer does that.

| # | Deadline | Points | Branch | Theme |
|---|----------|--------|--------|-------|
| M1 | Mon 26 Oct 2026 | 2 | `milestone1` | Setup, static frontend, ERD |
| M2 | Mon 2 Nov 2026 | 2 | `milestone2` | MySQL schema and DAO layer |
| M3 | Mon 23 Nov 2026 | 4 | `milestone3` | Services, routes, OpenAPI, external API |
| M4 | Mon 21 Dec 2026 | 5 | `milestone4` | Auth, middleware, logging, connected frontend |
| M5 | Wed 6 Jan 2027 | 2 | `milestone5` | Frontend MVC, validation, deployment |

**Critical rule:** the frontend must be fully connected to the backend at M4. Otherwise M1–M4 score 0. The M1 mock data must therefore be completely removed in M4.

## Dependencies

```
M1 frontend + ERD ─► M2 schema + DAOs ─► M3 services + routes + TMDB ─► M4 auth + middleware + connect UI ─► M5 MVC + validation + deploy
```

- M2 needs the ERD from M1. M3 needs the DAOs from M2. M4 needs the routes from M3 and replaces mock data in the UI.
- Hosting should be investigated during M4, so M5 is not the first time anything is deployed.

## M1 – Setup, static frontend, ERD (this milestone)

Done: folder structure (including `frontend/views/` HTML templates); static SPA with login, register, dashboard, discover, watchlist, reviews, profile and admin screens, loaded through a template service; responsive layout; mock data; draft ERD (6 entities, `title_genres` junction table); README, AGENTS.md, AI_LOG.md.
Not done on purpose: any real backend, database, authentication or TMDB call.

## M2 – Database and DAO layer

Status: implemented on branch `milestone2` (started from the M1 branch `milestone1`, because the M1 pull request had not been merged yet).

- `database/cinetrack.sql`: schema from the ERD (6 tables, InnoDB, foreign keys with `ON DELETE CASCADE`, unique constraints, CHECK constraints, indexes) plus fictional sample data. It can be imported repeatedly.
- `backend/config/config.example.php` is committed; `config.php` with real credentials is git-ignored. `backend/config/Database.php` creates the shared PDO connection.
- `BaseDao` with generic CRUD using prepared statements, and one DAO per entity (users, titles, genres, title_genres, watchlist_items, reviews).
- `backend/tests/dao_test.php`: plain PHP check (schema, CRUD for every DAO, foreign keys, duplicates, special characters, cascades, connection errors).
- Decided to skip Composer for M2: the DAO files load each other with `require_once`. FlightPHP is installed in M3 (`flightphp/core` 3.19.5 verified in the sandbox; the student runs `composer install`).

## M3 – Services, REST routes, OpenAPI, TMDB (implemented on branch `milestone3`; review pending)

**Status:** all four parts are implemented and tested (see `docs/AI_LOG.md`). Not done and not possible in M3: live testing against the real TMDB (no token was available; only a fake TMDB server was used), 401/403 (no authentication until M4). Swagger UI loads its scripts from a CDN, which could not be reached from the development sandbox; the page was tested with the same pinned version served from a local npm copy.

- One service per entity with validation and business rules (for example: one review per user per title, rating 1–5, status values). Services are the only layer that calls DAOs.
- FlightPHP routes for CRUD on all entities, returning JSON and the status codes 200, 201, 400, 401, 403, 404 and 500.
- OpenAPI documentation for every endpoint, served through Swagger UI.
- `TmdbService` (server-side only, token from config, 5-second timeout, friendly fallback on failure) and a search/detail endpoint. Attribution requirements to be checked against TMDB's current terms.

## M4 – Authentication, middleware, logging, connected frontend

- Register/login with `password_hash`, JWT issue and verification.
- Middleware: authentication (401), role authorization (403), request logging, error handling.
- `backend/logs/info.log` and `error.log` with the line formats required by the course document.
- Replace every use of `mock-data.js`/`state.js` with calls through `frontend/js/services/`. Attach the JWT, redirect on 401, show a message on 403, and make the UI role-aware.
- Decide where the JWT lives on the client (see the security notes in AGENTS.md).
- Show the TMDB-powered search in Discover (a first "Search TMDB" panel already exists since M3; M4 should integrate it with the rest of the page).
- Put authentication in front of the M3 routes; take `userId` from the JWT, not from the request; restrict `/users` and admin actions by role.

## M5 – Frontend MVC, validation, deployment

- Strict MVC split: only service files call the backend; views never call `fetch`.
- Client-side and server-side validation of every form.
- Deploy frontend, backend and a hosted MySQL database; make the TMDB feature work in production.
- README: live URL, Swagger URL and test accounts for each role.

## Why this architecture is enough

Plain HTML/CSS/vanilla JS on the front, and FlightPHP + PDO + MySQL on the back, are the stack the course requires. The layered backend (route → middleware → service → DAO) maps one-to-one to the milestones, so each milestone adds one layer without rewriting the previous ones. There is no framework, build step or microservice to explain during the defense.

## Open items and risks

- Packagist was not reachable from the development sandbox, so in M3 FlightPHP 3.19.5 was installed from a GitHub clone through a local Composer path repository. No `composer.lock` is committed. The student must run `composer install` once and report any problem.
- The TMDB integration is untested against the real TMDB. The attribution text is shown, but TMDB's current attribution and logo rules were not verified; check them before M5.
- The M3 API is open (no authentication) until M4.
- The LMS topic/repository submission is a manual step for the student.
