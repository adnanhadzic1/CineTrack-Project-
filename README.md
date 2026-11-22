
# CineTrack

CineTrack is a personal movie and TV-series tracker: search for titles, keep a watchlist (planned / watching / completed), and rate and review what you have seen.

University project for **IT 2001 Web Programming**. Current state: **Milestone 3 – services, REST API (FlightPHP), OpenAPI/Swagger and the TMDB external API** (on top of the Milestone 2 database and DAO layer and the Milestone 1 static frontend, which still uses mock data except for one "Search TMDB" panel on Discover).

| | |
|---|---|
| Repository | https://github.com/adnanhadzic1/CineTrack-Project-.git |
| Deployed app | Not deployed (planned for Milestone 5) |
| Swagger / API docs | Local only: <http://localhost:8001/docs/> while the backend runs (the specification is `backend/openapi.yaml`) |
| Test accounts | None (real accounts exist from Milestone 4; the M1 login accepts any input and checks nothing) |

## Current milestone: M3 (services, REST API, OpenAPI, TMDB)

M3 adds the business-logic services, the FlightPHP REST API with CRUD for all six entities, the OpenAPI specification with a Swagger UI page, and a TMDB service with a backend endpoint. See [Backend: services, REST API, OpenAPI and TMDB (M3)](#backend-services-rest-api-openapi-and-tmdb-m3). The only frontend change is a small "Search TMDB" panel at the bottom of Discover; the rest of the frontend is unchanged from M1 and still uses mock data (connecting it is M4).

### Frontend (from M1)

### What works now
- Single-page app with hash routing (`#/dashboard`, `#/discover`, …). Moving between pages does not reload the browser.
- Screens: Login, Register, Dashboard, Discover, Watchlist, Reviews, Profile, Admin panel.
- Discover: search, movie/TV filter, genre filter, sort, details modal, add to watchlist, plus buttons that preview the loading and error states.
- Watchlist: filter by status and type, change status, write a review, remove (with confirmation).
- Reviews: create, edit and delete with validation (one review per title).
- Profile: edit form with validation; account preferences shown as a disabled placeholder.
- Admin prototype (users, titles, genres, reviews tables with filters and actions), shown only when the sidebar "Preview role" is set to Admin.
- Responsive layout (desktop, tablet, phone with a slide-in menu), keyboard-accessible, visible focus.
- Draft ERD in [`database/erd/erd.md`](database/erd/erd.md) and a five-milestone plan in [`docs/PLAN.md`](docs/PLAN.md).

### Known limitations (honest list)
- **All data is mock data.** The 14 titles are fictional. Posters are generated colour panels, and ratings and descriptions are invented. Nothing comes from TMDB.
- **Nothing is saved.** Watchlist, review, profile and admin changes live in memory and disappear on refresh. Every success message says "demo only".
- **No real authentication.** Login and registration only validate the form. No account is created, no password or token is stored or sent, and nothing is written to localStorage, sessionStorage or cookies.
- **No real authorization.** The "Preview role" switch only shows or hides the admin screen. Anyone can switch it. In Milestone 4 the backend (JWT + role middleware) will enforce roles.
- **The frontend is connected to the backend in one place only:** the "Search TMDB" panel on Discover. Everything else (watchlist, reviews, profile, admin, login) still uses mock data until M4.
- **No authentication or authorization yet (M4).** The REST API is open: anyone who can reach it can read, change and delete everything. Do not expose it publicly. The status codes 401 and 403 are therefore never returned in M3.
- **The TMDB integration has not been tested against the real TMDB.** No real access token was available; it was tested only against a local FAKE TMDB server (see "External API (TMDB)" below).
- No request logging, centralized error middleware or deployment yet (M4 and M5).
- **Database tests were run on MariaDB 10.11, not on MySQL 8.** The schema uses standard InnoDB features that MySQL 8.0.16+ should also accept, but it was not run there. The M1 browser tests were limited as described next.
- **Browser testing was limited.** During development the app was clicked through by an automated Chromium script (Playwright). That script is **not part of this repository**, so it cannot be re-run from a clone. Firefox, Safari and real phones were not tested. See "Checking the project yourself" below.

## Technology stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, vanilla JavaScript (ES modules), Fetch API (from M4) |
| Backend | PHP 8.1+ with PDO (DAO layer), FlightPHP 3 REST routes, service classes (M3), cURL for TMDB |
| Database | MySQL (schema and sample data in `database/cinetrack.sql`, M2) |
| Authentication (planned) | JWT, roles `admin` and `user` |
| External API | The Movie Database (TMDB), called only from the backend (M3) |
| Docs | OpenAPI 3 (`backend/openapi.yaml`) + Swagger UI (M3) |

No frontend framework, bundler or Bootstrap is used. The only Composer package is FlightPHP.

## Project structure

```
CineTrack/
├── frontend/
│   ├── index.html            single HTML page (the SPA shell)
│   ├── css/                  styles.css (theme, components), responsive.css (breakpoints)
│   ├── views/                HTML templates (login.html, dashboard.html, …) and one <screen>-view.js per screen
│   ├── assets/               images/ and icons/ (placeholders in M1)
│   └── js/
│       ├── app.js            entry point: picks a view for the current route
│       ├── router.js         tiny hash router
│       ├── state.js          in-memory demo state (replaced by the API in M4)
│       ├── data/mock-data.js the ONLY place with mock data (removed in M4)
│       ├── services/         api-service.js – future home of all backend calls
│       ├── components/       navigation, cards, modals, toasts, review form, …
│       └── utils/            small helpers (escaping, form validation)
├── backend/                  see backend/README.md
│   ├── config/               config.example.php, Database.php (PDO connection); config.php is git-ignored
│   ├── dao/                  BaseDao + 6 DAO classes (M2)
│   ├── tests/                dao_test.php (M2)
│   └── routes/ services/ middleware/ logs/ public/   planned for M3-M4
├── database/
│   ├── cinetrack.sql         schema + fictional sample data (M2)
│   └── erd/erd.md            ERD (Mermaid)
├── docs/                     PLAN.md, AI_LOG.md
├── AGENTS.md                 rules for AI assistants
└── README.md
```

The course document lists "views (HTML templates)" as a frontend folder. `frontend/views/` now contains real HTML template files: `login.html`, `register.html`, `dashboard.html`, `discover.html`, `watchlist.html`, `reviews.html`, `profile.html`, `admin.html` and `admin-forbidden.html` (the page shown instead of the admin panel for a normal user). At start-up `js/services/template-service.js` loads them once with `fetch` (these are static frontend files, not backend calls). Each `<screen>-view.js` draws its template and then fills in the data and attaches event listeners, so navigation still never reloads the page. Lists, tables, cards and modal dialogs are still built by JavaScript from data, because their content depends on the state; only the page layouts live in the templates. Because templates are fetched, the app must be served over HTTP (it never worked from `file://` anyway). `frontend/assets/` (`images/`, `icons/`) holds only `.gitkeep` placeholder files so Git keeps the folders, because M1 uses inline SVG icons and generated posters.

## Database and DAO layer (M2)

**Tables** (InnoDB, utf8mb4): `users`, `titles`, `genres`, `title_genres` (junction table), `watchlist_items`, `reviews`. The diagram, constraints and delete rules are in [`database/erd/erd.md`](database/erd/erd.md); the SQL is in [`database/cinetrack.sql`](database/cinetrack.sql).

- A user has many watchlist items and many reviews; a title can be on many watchlists and have many reviews; titles and genres are many-to-many through `title_genres`.
- One watchlist entry and one review per user and title (unique keys); the same genre cannot be added twice to a title; `titles.tmdb_id` may be empty (`NULL`) and is unique together with `media_type`.
- Deleting a user, title or genre deletes the rows that depend on it (`ON DELETE CASCADE`); ratings must be 1 to 5 and progress 0 to 100 (CHECK).
- Passwords are stored only as bcrypt hashes. The sample data is fictional. The sample users share one **local demo** password written in the header of the SQL file; nobody can log in yet (authentication comes in M4).

**DAO classes** (`backend/dao/`): `BaseDao` (shared PDO code and generic `findAll`, `findById`, `create`, `update`, `delete`) and `UserDao`, `TitleDao`, `GenreDao`, `TitleGenreDao`, `WatchlistItemDao`, `ReviewDao`. All queries use prepared statements. `TitleGenreDao` has `add`, `exists`, `findByTitleId`, `findByGenreId`, `remove` and `replaceForTitle` instead of the single-id methods, because its primary key has two columns. More detail in [`backend/README.md`](backend/README.md).

### Set up and test the database (you need MySQL 8.0.16+ (or MariaDB 10.11, which is what was tested), and PHP 8.1+ with `pdo_mysql`)

```bash
mysql -u root -p < database/cinetrack.sql                         # 1. create database `cinetrack` with sample data
cp backend/config/config.example.php backend/config/config.php   # 2. your own settings (git-ignored, never commit it)
#    edit backend/config/config.php and fill in your MySQL user and password
php backend/tests/dao_test.php                                    # 3. run the DAO check; the last line must say "0 failed"
```

The import can be repeated: it drops and recreates the tables. The test script creates its own rows and removes them again.

## Backend: services, REST API, OpenAPI and TMDB (M3)

Request flow (authentication middleware is added in M4):

```
Frontend (fetch) -> FlightPHP route -> Service -> DAO -> MySQL -> JSON response
```

- **Routes** (`backend/routes/`, one file per entity) read the request, call a service and send JSON. No SQL, no rules.
- **Services** (`backend/services/`) hold the rules and are the only code that calls DAOs: required fields, types and lengths, rating 1 to 5, watchlist status, existing users/titles/genres, duplicates (409), missing records (404). `UserService` never returns password hashes and stores passwords with `password_hash()`. Small helpers: `Validator` (checks), `Format` (snake_case to camelCase), `ApiException` (an error with an HTTP status).
- **DAOs** (M2) run the prepared statements.
- Answers always look like `{"success":true,"data":...,"message":"..."}` or `{"success":false,"message":"...","errors":{"field":"problem"}}`. Unexpected errors give a generic 500 and are logged on the server only (no SQL, paths or stack traces in responses).

### Install, configure and start

```bash
cd backend && composer install && cd ..                          # 1. installs FlightPHP into backend/vendor
mysql -u root -p < database/cinetrack.sql                         # 2. database with sample data
cp backend/config/config.example.php backend/config/config.php   # 3. your settings (git-ignored): MySQL user/password, TMDB token
php -S localhost:8001 -t backend/public                           # 4. start the API
```

Then open <http://localhost:8001/> (health message) and <http://localhost:8001/docs/> (Swagger UI). The frontend is served separately (`cd frontend && python3 -m http.server 8000`, open <http://localhost:8000/>); the backend allows that origin through CORS (`app.allowed_origin` in the config). Use `localhost` (not `127.0.0.1`) in the browser so that Swagger's "Try it out" is same-origin.

Swagger UI loads its JavaScript from a CDN (`cdn.jsdelivr.net`), so the documentation page needs an internet connection. The specification itself is `backend/openapi.yaml`, also served at <http://localhost:8001/openapi>.

### Endpoints (all JSON; full details, schemas and examples in Swagger)

| Entity | Endpoints |
|--------|-----------|
| Users | `GET/POST /users`, `GET/PUT/DELETE /users/{id}` |
| Titles | `GET/POST /titles` (filters `search`, `type`, `genreId`), `GET/PUT/DELETE /titles/{id}` |
| Genres | `GET/POST /genres`, `GET/PUT/DELETE /genres/{id}` |
| Title genres (composite key) | `GET /title-genres?titleId=&genreId=`, `POST /title-genres`, `DELETE /title-genres/{titleId}/{genreId}`, `PUT /titles/{titleId}/genres` (replace all) |
| Watchlist items | `GET/POST /watchlist-items` (filters `userId`, `status`), `GET/PUT/DELETE /watchlist-items/{id}` |
| Reviews | `GET/POST /reviews` (filters `userId`, `titleId`), `GET/PUT/DELETE /reviews/{id}` |
| TMDB | `GET /external/titles/search?query=&type=&page=`, `GET /external/titles/{movie\|tv}/{tmdbId}` |

Status codes used: 200, 201, 400 (invalid input), 404, 405 (wrong method), 409 (duplicate), 500, and for TMDB problems 502, 503, 504. 401 and 403 are not used in M3 (no authentication yet).

### External API (TMDB)

1. Create a free account at <https://www.themoviedb.org/>, open Settings, API, and copy your **API Read Access Token**.
2. Paste it into `backend/config/config.php` as `tmdb.api_read_token`. The file is git-ignored. Never put the token in the frontend, in `config.example.php` or in a commit.
3. Restart the backend and test: `curl "http://localhost:8001/external/titles/search?query=matrix"`, or use the "Search TMDB" panel on Discover.

Without a token the endpoints answer `503` ("not configured") and the Discover panel shows an error state, never invented results. TMDB timeouts give 504, a refused connection or rate limit 503, and a bad or failed TMDB answer 502. The TMDB attribution text is shown under the panel; check TMDB's current attribution rules yourself before the final submission.

**Honest status:** the TMDB code was tested only against a local FAKE TMDB server (`backend/tests/fake_tmdb.php`). It has **not** been run against the real TMDB, because no token was available while it was written. Step 3 above is the test you must do yourself.

### Automatic tests

```bash
php backend/tests/dao_test.php     # M2: 87 checks on the DAO layer
php backend/tests/api_test.php     # M3: 133 checks on the REST API, services and TmdbService (starts its own temporary servers on ports 18001 and 18099)
```

Both need the database and `backend/config/config.php`. The API test only uses the fake TMDB server and removes the rows it creates.

## Roles (planned)

`user` (manages their own watchlist, reviews and profile) and `admin` (manages titles, genres, users and review moderation, but not other users' private watchlists). The `role` column exists in the database since M2 and can be set through `/users` in M3, but nothing enforces roles yet; JWT and role middleware are planned for M4.

## Running the static frontend locally

ES modules do not work from `file://`, so serve the folder over HTTP. From the repository root:

```bash
cd frontend
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Any other static server works too (for example `npx serve frontend`). No build step and no `npm install` are needed.

## Next steps

M2 database + DAOs (done) → M3 services, routes, OpenAPI, TMDB endpoint (done, see the limits above) → M4 authentication, middleware, logging, connected frontend → M5 MVC, validation, deployment. Details and deadlines: [`docs/PLAN.md`](docs/PLAN.md).

## Checking the project yourself

Syntax check of every JavaScript file (needs Node.js), run from the project root:

```bash
find frontend/js frontend/views -name '*.js' -exec node --check {} \;
```

No output means no syntax errors. Then start the app (`cd frontend && python3 -m http.server 8000`, open http://localhost:8000/) and check by hand:

- Every sidebar screen opens without a page reload and the browser console stays free of errors.
- Watchlist: change a status (completed to watching must not keep 100%), remove a title, write a review.
- Log out and log in again: the role selector must be back on User.
- Resize the window to tablet and phone width: no horizontal scrolling, the menu button opens the drawer.

## AI assistance

This project was built with AI assistance (Claude, via Claude Code). What was generated, the prompts, the mistakes found and the checks performed are recorded honestly in [`docs/AI_LOG.md`](docs/AI_LOG.md). Project rules for AI assistants are in [`AGENTS.md`](AGENTS.md).

## Reflections (Milestone 1)

- **What worked:** a hash router, one in-memory state module and one file per screen kept the SPA small and easy to follow. Keeping all mock data in a single file makes it clear what must be replaced by the API in M4.
- **What is weak:** nothing is saved, there is no real authentication or authorization, and the admin screen is only hidden by a visual role switch. The tests I could run were a browser script that is not in this repository, so there is no automated test suite yet.
- **Trade-offs:** the course lists `views` as HTML templates; here the views are JavaScript modules that render HTML into one `index.html`. Titles can have no TMDB id in the draft ERD so that admin-added titles are possible.
- **For M3 onward:** FlightPHP must actually be installed and its version verified, services must sit between routes and DAOs, and the frontend test script should become a repeatable test setup. The DAO test script (`backend/tests/dao_test.php`) is already part of the repository.

## Reflections (Milestone 2)

- **What worked:** copying the ERD into SQL one-to-one, and letting the database enforce the rules (foreign keys, unique keys, CHECK) instead of only checking in PHP. A small `BaseDao` removes repeated code, and each DAO stays short.
- **Limits:** the DAOs trust their caller. Business rules (for example who may read which watchlist) are not implemented yet; they belong in the M3 services. The junction-table DAO does not fit the single-`id` base class cleanly, so it replaces three inherited methods.
- **Testing:** the test script runs against a real database, but only MariaDB 10.11 was available when it was written; run it once on your own MySQL.

## Reflections (Milestone 3)

- **What worked:** one service per entity with a shared `Validator` kept the rules in one place and the routes tiny. Tests that send real HTTP requests found problems that reading the code did not (see the cases in [`docs/AI_LOG.md`](docs/AI_LOG.md)).
- **Limits:** the API has no authentication, so it must not be exposed; the TMDB integration is untested against the real TMDB; Swagger UI needs a CDN; FlightPHP was installed in the development sandbox from GitHub because Packagist was unreachable there, so run `composer install` on your machine and tell me if it fails.
- **For M4:** add JWT login and the authentication/role middleware in front of these routes, request logging and central error handling, and connect the rest of the frontend (the filters by `userId` must then come from the token, not from the query string).
