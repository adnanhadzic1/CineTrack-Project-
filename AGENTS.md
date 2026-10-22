# AGENTS.md – instructions for AI coding assistants

Read this file before changing anything. Update it whenever the architecture changes (it must be updated in every milestone).

## Project purpose

CineTrack is a movie and TV-series tracking single-page app, built individually for the university course **IT 2001 Web Programming**. The student must be able to explain every line during a defense **without AI tools**, so prefer simple, readable code over clever code.

Current milestone: **M1** (static frontend, ERD, docs). Later milestones are planned in `docs/PLAN.md`. **Only implement the milestone you were asked to implement.**

## Mandatory technology stack (do not change silently)

- Frontend: HTML5, CSS3, vanilla JavaScript (ES modules). Bootstrap is allowed but unused so far. No React/Vue/Angular, no bundler.
- Backend: PHP with **FlightPHP** for all REST routes.
- Database: **MySQL**, accessed only through **PDO** with prepared statements.
- Auth: **JWT**, roles `admin` and `user`.
- External API: **TMDB**, called only from the backend.
- API docs: OpenAPI + Swagger UI.

Do not add dependencies unless they are needed. Explain any new dependency to the student first.

## Architecture boundaries

Final request flow:

```
view → frontend service → fetch → FlightPHP route → middleware → service → DAO → PDO/MySQL → JSON → UI update
```

- **Strict separation.** The frontend is HTML/CSS/JS only. The backend is PHP returning JSON only. Never put PHP in frontend files or generate HTML in PHP.
- **Routes** (`backend/routes/`): parse the request, call a service, return JSON with the right status code. No SQL, no business rules.
- **Middleware** (`backend/middleware/`): authentication (401), role authorization (403), request logging, error handling. Reusable and registered in FlightPHP, never copied into routes.
- **Services** (`backend/services/`): business rules and validation. The **only** layer that calls DAOs. The TMDB client lives here too.
- **DAOs** (`backend/dao/`): database access only, through a `BaseDao`. Prepared statements always.
- **Frontend services** (`frontend/js/services/`): the **only** frontend files that call the backend. Views and components must not call `fetch`.
- Admin permissions do not include reading other users' private watchlists. Watchlist and review queries are always filtered by the user id from the verified JWT, never by a client-supplied user id.

## Folder structure

See the tree in `README.md`. Backend folders (`routes`, `services`, `dao`, `middleware`, `config`, `logs`, `public`) exist from M1 but are empty of code until M2–M4. `database/erd/erd.md` is the ERD; `docs/` holds `PLAN.md` and `AI_LOG.md`.

## Naming conventions

- JS: `camelCase` for variables and functions, `PascalCase` for classes, `kebab-case.js` file names. View files are `<screen>-view.js` and export `render<Screen>View(container, route)`.
- PHP: `PascalCase` classes, one class per file named after the class (`UserDao.php`, `UserService.php`), `camelCase` methods.
- MySQL: `snake_case`, plural table names (`users`, `watchlist_items`), `id` primary keys, `<table_singular>_id` foreign keys.
- REST: plural nouns (`/titles`, `/watchlist-items`), standard verbs, JSON in and out.
- Git branches: `milestone1` … `milestone5`.

## Coding standards

- Keep files small and single-purpose. Comment *why*, not *what*. Beginner-friendly code beats abstraction.
- Escape every dynamic value placed in HTML (`esc()` in `frontend/js/utils/dom.js`). Never put raw user input into `innerHTML`.
- Accessibility: labelled form fields, visible focus, keyboard-operable controls, sufficient contrast, `aria-*` where needed.
- Responsive: desktop, tablet and phone layouts must keep working. Breakpoints are in `responsive.css`.
- No large files of copy-pasted code. Do not create empty files just to fill the structure.

## Security rules

- **Never commit secrets**: DB credentials, JWT secret, TMDB token. They go in `backend/config/config.php` (git-ignored). Commit only `config.example.php` with placeholders.
- `logs/` contents and `vendor/` are git-ignored.
- Passwords: hash with `password_hash()`; never store or log plaintext. Never store passwords, tokens or secrets in `localStorage` in prototype code.
- All SQL through PDO prepared statements.
- Authorization is decided by the backend. A frontend role flag or hidden button is only a visual hint, and the M1 "Preview role" switch must never be treated as security.
- Error responses must not leak stack traces, SQL or file paths. Log details server-side.
- TMDB token stays on the server. The browser never calls TMDB directly.

## Data honesty rules (important)

- **Never present fake or mock data as real.** Mock data lives only in `frontend/js/data/mock-data.js` and the UI labels it as mock/demo. Do not invent TMDB responses, ratings, posters, URLs, test accounts or deployment links.
- Simulated actions must say they are demo-only and must not claim data was saved.
- A failed external API call must show an error state, never an empty result.
- Never claim a repository, push, collaborator invite, pull request, deployment or test run exists or passed unless it was actually done and verified.
- From M4 no static or hard-coded data may remain in the frontend.

## Git and milestone rules

- One branch per milestone: `milestone1` … `milestone5`. Commit that milestone's work only on its branch.
- Before the deadline: open a pull request and add the GitHub user `ibu-web-programming2001` as collaborator **and** reviewer (the collaborator invite must be sent well before the deadline; weekend-before requests are not accepted).
- **Never merge a milestone branch into `main`.** The reviewer merges. Start the next milestone branch only after the previous one is merged.
- Use meaningful commit messages. Review the staged files before every commit. Never force-push or rewrite history.
- `AGENTS.md` and `docs/AI_LOG.md` must be updated in every milestone (−0.25 points otherwise).
- Submitting the topic and repository link through the LMS form is a manual step for the student.

## Testing expectations

- Run `node --check` on changed JS files and exercise the app in a real browser (console must stay clean) before declaring work done.
- For backend work: test each endpoint, including the 400, 401, 403, 404 and 500 paths.
- Report only checks that were actually run, and say what was not verified.

## Instructions to future AI assistants

1. Inspect the repository and read `docs/PLAN.md` first. Preserve existing work; do not delete or overwrite files without being asked.
2. Do not start the next milestone on your own.
3. Explain what you built in plain language, and help the student prepare to explain it.
4. Record your work in `docs/AI_LOG.md`, including real mistakes you made. Never fabricate mistakes or claim the student fixed something they did not.
5. Update this file when you change the architecture.
