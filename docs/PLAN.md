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

- Create `database/schema.sql` from the ERD, plus sample data and a SQL export.
- `backend/config/config.php` (git-ignored) holds DB credentials; `config.example.php` is committed.
- `composer install` for FlightPHP (needs network access to Packagist) and a PDO connection class.
- `BaseDao` with generic CRUD using prepared statements; one DAO per entity (users, titles, genres, title_genres, watchlist_items, reviews).
- Verify the DAOs with a small script or PHPUnit-style checks against the sample data.

## M3 – Services, REST routes, OpenAPI, TMDB

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
- Show the TMDB-powered search in Discover.

## M5 – Frontend MVC, validation, deployment

- Strict MVC split: only service files call the backend; views never call `fetch`.
- Client-side and server-side validation of every form.
- Deploy frontend, backend and a hosted MySQL database; make the TMDB feature work in production.
- README: live URL, Swagger URL and test accounts for each role.

## Why this architecture is enough

Plain HTML/CSS/vanilla JS on the front, and FlightPHP + PDO + MySQL on the back, are the stack the course requires. The layered backend (route → middleware → service → DAO) maps one-to-one to the milestones, so each milestone adds one layer without rewriting the previous ones. There is no framework, build step or microservice to explain during the defense.

## Open items and risks

- Packagist is not reachable from the sandbox used for M1, so FlightPHP has not been installed or verified. The `composer.json` constraint (`flightphp/core ^3.0`) was written by hand and must be confirmed in M2/M3.
- Confirm the TMDB attribution and logo rules before M3.
- The LMS topic/repository submission is a manual step for the student.
