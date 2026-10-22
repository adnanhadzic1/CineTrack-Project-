# CineTrack

CineTrack is a personal movie and TV-series tracker: search for titles, keep a watchlist (planned / watching / completed), and rate and review what you have seen.

University project for **IT 2001 Web Programming**. Current state: **Milestone 1 – static frontend prototype**.

| | |
|---|---|
| Repository | _TBD – add the GitHub URL when the repository is created_ |
| Deployed app | _TBD – not deployed yet (planned for Milestone 5)_ |
| Swagger / API docs | _TBD – planned for Milestone 3_ |
| Test accounts | _TBD – real accounts exist from Milestone 4_ |

## Current milestone: M1

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
- **No backend or database.** `backend/` contains the planned folder structure and a config template only. FlightPHP is declared in `backend/composer.json` but is **not installed** (Packagist was not reachable when this was prepared), and the version constraint is unverified.
- No TMDB integration, API documentation, logging or deployment yet.
- Automated checks were run with Chromium only (Playwright). Safari and Firefox were not tested.

## Technology stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, vanilla JavaScript (ES modules), Fetch API (from M4) |
| Backend (planned) | PHP, FlightPHP (REST), PDO |
| Database (planned) | MySQL |
| Authentication (planned) | JWT, roles `admin` and `user` |
| External API (planned) | The Movie Database (TMDB), called only from the backend |
| Docs (planned) | OpenAPI + Swagger UI |

No frontend framework, bundler or Bootstrap is used in M1.

## Project structure

```
CineTrack/
├── frontend/
│   ├── index.html            single HTML page (the SPA shell)
│   ├── css/                  styles.css (theme, components), responsive.css (breakpoints)
│   └── js/
│       ├── app.js            entry point: picks a view for the current route
│       ├── router.js         tiny hash router
│       ├── state.js          in-memory demo state (replaced by the API in M4)
│       ├── data/mock-data.js the ONLY place with mock data (removed in M4)
│       ├── services/         api-service.js – future home of all backend calls
│       ├── views/            one file per screen
│       ├── components/       navigation, cards, modals, toasts, review form, …
│       └── utils/            small helpers (escaping, form validation)
├── backend/                  planned REST API (structure only in M1, see backend/README.md)
│   ├── routes/ services/ dao/ middleware/ config/ logs/ public/
├── database/erd/erd.md       draft ERD (Mermaid)
├── docs/                     PLAN.md, AI_LOG.md
├── AGENTS.md                 rules for AI assistants
└── README.md
```

The course document lists "views (HTML templates)" as a frontend folder. In this project the screens are rendered by the JavaScript files in `frontend/js/views/` into the single `index.html` shell, which is how the SPA avoids page reloads. `frontend/assets/` (images, icons) is created but empty, because M1 uses inline SVG icons and generated posters.

## Planned data model

Entities: **users**, **titles**, **genres**, **watchlist_items**, **reviews**, plus the junction table **title_genres**. See [`database/erd/erd.md`](database/erd/erd.md) for the diagram, keys, constraints and CRUD/ownership plan.

Roles: `user` (manages their own watchlist, reviews and profile) and `admin` (manages titles, genres, users and review moderation, but not other users' private watchlists).

## Planned external API

TMDB will power search and title details in Discover. The backend calls TMDB with a server-side token (never committed, never in the browser), with a timeout and a friendly fallback if TMDB is down. The backend endpoint arrives in M3 and the UI integration in M4. TMDB's attribution notice will be shown when it is used.

## Running the static frontend locally

ES modules do not work from `file://`, so serve the folder over HTTP. From the repository root:

```bash
cd frontend
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. Any other static server works too (for example `npx serve frontend`). No build step and no `npm install` are needed.

## Next steps

M2 database + DAOs → M3 services, routes, OpenAPI, TMDB endpoint → M4 authentication, middleware, logging, connected frontend → M5 MVC, validation, deployment. Details and deadlines: [`docs/PLAN.md`](docs/PLAN.md).
