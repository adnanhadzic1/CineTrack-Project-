# AI usage log

One section per milestone. The student is responsible for understanding and being able to explain all code.

## Milestone 1 – Setup, static frontend, ERD

### AI tool and purpose

- **Tool:** Claude (Claude Code, model Claude Sonnet 5.5).
- **Used for:** planning the five milestones; generating the project structure, the static SPA (HTML/CSS/JS), mock data, the draft ERD and the documentation; writing and running a browser test script.

### Main prompts and tasks

1. A long "master prompt" asking Claude to act as engineer/architect/designer/QA, read the university requirements document, plan all five milestones, and **implement only Milestone 1**, without inventing backend, authentication, API or deployment claims.
2. A follow-up prompt asking Claude to finish the M1 documentation, audit the work against the official requirements document, handle the FlightPHP installation problem honestly, and prepare the `milestone1` commit without starting M2.

3. A request to make the app viewable locally, verify it visually and prepare the repository, without inventing a GitHub URL, API keys or AI mistakes.
4. A two-phase request: first a read-only audit (code, CSS, design, accessibility, documentation), then approval to implement chosen fixes in groups (copy, bugs, readability, restrained CSS), with rules such as no commit, no merging of stat cards, no serif font.
5. Requests to finish the remaining safe items in one pass, to build a ZIP of the project, and to check the structure and ERD against the official requirements document.

Tool: only Claude (Claude Code) was used for generation. No other AI tool is recorded in the available evidence.

### What the AI produced

| Area | Files |
|------|-------|
| Repository setup | `.gitignore`, folder structure, `backend/composer.json`, `backend/config/config.example.php`, per-folder READMEs |
| SPA core | `frontend/index.html`, `css/styles.css`, `css/responsive.css`, `js/app.js`, `js/router.js`, `js/state.js` |
| Mock data and API foundation | `js/data/mock-data.js`, `js/services/api-service.js` (disabled, throws on use) |
| Screens | `views/*.html` and `views/*-view.js` (see the follow-ups below) (login, register, dashboard, discover, watchlist, reviews, profile, admin) |
| Components and helpers | `js/components/*.js`, `js/utils/*.js` |
| Planning and docs | `database/erd/erd.md`, `docs/PLAN.md`, `README.md`, `AGENTS.md`, this file |

### How the results were reviewed and tested

Performed by Claude in its sandbox (not by the student):

- `node --check` on all JavaScript files (24 at first, 25 after `template-service.js` was added).
- A Playwright (Chromium) script that exercised navigation without reload, dashboard counts, search, filters, sorting, modals, watchlist actions, review validation, profile validation, admin actions, login and register validation, the mobile drawer, horizontal-overflow checks at three viewport sizes, and the browser console. This script lived only in the AI's temporary sandbox and **is not in the repository**, so the student cannot re-run it from a clone. Its results are not reproduced here.
- Screenshots of the dashboard, discover, admin and the phone modal were viewed.

**Student review:**

- The student reported in chat that they ran the app manually and checked its main functions, and that these worked normally. No defects were reported. (This is the student's own statement; Claude did not witness it.)
- Not recorded as done: a documented line-by-line reading of `state.js`, `router.js`, `app.js` and a view, and preparation to explain the ERD junction table and unique constraints. These remain for the student before the defense; they are not claimed as done.

### Cases where the AI made a mistake or produced poor code

> The course asks for at least two genuine cases per milestone. Nine cases are listed and all really happened. Cases A to G were found by Claude itself while reviewing or testing its own output; they are not the student's discoveries. Cases H and I were noticed by the student in Claude's reports (the conversation history supports this) and corrected by Claude.

**Case A – duplicate import (found by the AI, before running the code)**
- *What was wrong:* when writing `title-modal.js`, the AI imported `confirmDialog` from `modal.js` in a second, separate import statement. Importing the same name twice in one module is a syntax error and would have broken the whole details modal.
- *How it was noticed:* the AI re-read the file right after writing it.
- *Fix:* merged it into one import (`import { openModal, confirmDialog } from './modal.js'`). `node --check` passed afterwards.

**Case B – cancelling a removal left the user without a dialog (found by the AI, in design review)**
- *What was wrong:* in the title details modal, "Remove" opens a confirmation dialog. Opening a dialog closes the current one, so pressing Cancel would have left the user with no modal at all, which is confusing.
- *How it was noticed:* the AI traced the modal open/close logic while writing the component.
- *Fix:* when the confirmation is cancelled the details modal is reopened. The path was checked later in the browser script, but that script is not in the repository, so the student should check it by hand (open a title from the watchlist, Remove, Cancel).

**Case C – the test suite initially reported failures that were test mistakes (found by the AI)**
- *What was wrong:* the first browser-test run showed 92/96 and then 95/96 checks passing. The failures were wrong test assumptions (a check that ran before the page was drawn, an expected error count that was wrong, and not waiting for the 0.2 s mobile-drawer animation). None were application bugs.
- *How it was noticed:* the AI inspected each failure, and reproduced the drawer case separately to confirm the drawer really opened.
- *Fix:* the tests were corrected to wait for the right element and to expect two login errors. Lesson recorded: a failing check needs investigation, and so does a passing one.

**Case D – watchlist progress stayed at 100% (found by the AI in a later audit)**
- *What was wrong:* changing a title from Completed back to Watching kept the old 100% progress, and Planned to Watching showed "0% watched".
- *Fix:* `setWatchStatus` in `state.js` now remembers the previous status and resets progress when going from Completed to Watching. Views show "No progress logged yet" when nothing is logged. Re-checked in the browser.

**Case E – role preview survived logout (found by the AI in a later audit)**
- *What was wrong:* after choosing Admin in the role preview and logging out, the next session still showed Admin.
- *Fix:* `app.js` resets the preview role to User when an auth screen is shown.

**Case F – login/register panel was offset, and a keydown listener piled up (found by the AI in a later audit)**
- *What was wrong:* the app-wide `#main` padding also applied to the login/register layout, shifting the left panel. Separately, the mobile menu added a new Escape-key listener on every render.
- *Fix:* the padding rule is scoped to `.app-main #main`; `navigation.js` registers one keydown listener and only swaps its handler.

**Case G – an AI "improvement" that broke the layout (found by the AI, reverted)**
- *What was wrong:* `nowrap` on admin table names made the table wider than its wrapper and clipped the Delete button.
- *Fix:* the change was fully reverted and replaced by a check that every column fits without inner scrolling.

**Case H – the `views (HTML templates)` requirement was documented as an open question instead of being met (noticed by the student, corrected by Claude)**
1. *Requested:* the course document says the frontend folders are "css, js, views (HTML templates), static assets".
2. *What the AI did differently:* the first version put the screens in `frontend/js/views/` as JavaScript only. When Claude later audited the structure, it moved the files to `frontend/views/` and marked the HTML-template wording as "NEEDS MY INPUT" (a question for the instructor) rather than resolving it.
3. *How it was noticed:* the student read the report and wrote that the problem should be solved, "not only recorded as an ambiguity".
4. *Correction requested:* make the project meet the literal requirement without breaking the SPA, without duplicate or unused files.
5. *What changed:* nine real `.html` templates in `frontend/views/`, a `template-service.js` that loads them, and the eight view modules now draw them (details in the section "HTML templates for the views").
6. *How it was checked:* 127-check browser script unchanged and passing; every template requested from the server and used by a view; 9 routes at three widths with no console errors, failed requests or overflow; a blocked template shows an error message.

**Case I – developer/milestone wording and look-alike blocks in the user interface (noticed by the student, corrected by Claude)**
1. *Requested:* a finished-looking prototype for users.
2. *What the AI did differently:* it left explanatory notes aimed at the developer inside the screens (for example the role-preview text mentioning a later milestone, "mock data" notices, a disclosure box about future admin access), and several dashboard blocks looked alike.
3. *How it was noticed:* after Claude's audit report the student listed these two problems to investigate (repeated card styling, milestone/developer text in the UI).
4. *Correction requested:* find and plan the removal of that text, keep the dashboard design, do not merge the stat cards.
5. *What changed:* the notices and the disclosure box were removed or shortened, wording was made user-facing (technical notes stay in README, comments and AI_LOG), and the stat cards were kept separate.
6. *How it was checked:* a text search of the UI sources for milestone, backend, TMDB, JWT and mock wording (clean outside comments and the mock data file), and the browser script.

**What the student reported:** after running the app manually, the student said the main functions work normally. No other student-found bug is recorded, and cases A to G were found by Claude, not by the student.

### Limitations of this AI-assisted work to be aware of

- Packagist was unreachable from the AI's sandbox, so FlightPHP was **not** installed and the version in `composer.json` is unverified.
- Browser tests ran in Chromium only, and the script is not in the repository. No Firefox, Safari or real-device testing was done.
- TMDB's current attribution rules were not checked in M1, because no TMDB data is used yet.

### Follow-up audit and cleanup (after the first M1 commit)

At the student's request Claude audited the finished M1 and, in the working tree (not yet committed), made these changes: removed milestone/developer wording from the user interface, fixed the bugs in cases D to F, replaced nested ternaries in the login and register validation with if / else if, removed unused helpers (`qs`, `qsa`, `debounce`) from `utils/dom.js`, raised the contrast of form-field borders and empty rating stars, and corrected an inaccurate contrast comment in `styles.css`. The student should read the diff (`git diff`) before committing.

### Structure and ERD alignment (second follow-up)

- **`frontend/views/`:** the course document lists a `views` folder among the frontend folders. Claude first moved the eight view modules from `frontend/js/views/` to `frontend/views/`. That folder then held only JavaScript, which does not literally match "views (HTML templates)". See the next section for the fix.
- **`titles.tmdb_id`:** the ERD said NOT NULL, but the mock titles and titles created in the admin prototype have `tmdbId: null`. Claude changed the ERD so `tmdb_id` is nullable (NULL means the title was added by an admin; MySQL allows several NULLs in the unique index on `tmdb_id, media_type`). No SQL was written; the real schema belongs to M2.
- These were found and changed by Claude when checking the structure against the requirements document, not by the student.
- The student's code-reading review (see "Student review" above) is not recorded as done.


### HTML templates for the views (fourth follow-up)

At the student's request to satisfy the wording "views (HTML templates)" literally instead of documenting it as an open question, Claude added nine real HTML files to `frontend/views/` (`login`, `register`, `dashboard`, `discover`, `watchlist`, `reviews`, `profile`, `admin`, `admin-forbidden`) and `js/services/template-service.js`, which loads them once at start-up and fills `data-icon`, `data-bind` and `data-slot` placeholders. The eight view modules now draw their page layout from the template instead of a long template string; lists, tables, cards and modals are still built in JavaScript. `app.js` waits for the templates before starting the router and shows a message if one cannot be loaded. Also added: a `.slot { display: contents; }` CSS rule; `AGENTS.md` now describes the templates and states that `template-service.js` is the only non-backend `fetch`. The helper `passwordFieldHtml` in `utils/forms.js` became unused and was removed.
- **Checks run by Claude after this change:** `node --check` on all JS files; all relative imports resolve; every template is referenced by a view; the 127-check browser script (unchanged) passed; all 9 routes at 1280, 820 and 390 px with no console errors, no failed requests, no horizontal overflow, and no page reload while navigating; a forced 404 on `login.html` shows the error message; screenshots of dashboard, discover and profile were looked at.
- **Not verified:** whether the instructor accepts HTML files fetched at run time as "views (HTML templates)" (this is the closest literal match, but his opinion was not asked); Firefox, Safari and real phones.
- This change was made by Claude, not by the student.

### Compliance audit against the requirements document (third follow-up)

Claude re-read `Project Requirements Milestones and Deadlines.docx` (Milestone 1 section) and checked the repository. The "Lab 01" instructions were **not available** in this environment and were not read. Checks run by Claude: `node --check` on all 24 JS files; a script confirming all 94 relative imports resolve; `index.html` references exist; `composer.json` is valid JSON and `config.example.php` has no PHP syntax errors; no secrets found by a pattern search; the ERD Mermaid block parses (mermaid 10.9.1) and its 6 entities, 6 relationships and 6 foreign keys agree; all 9 routes were opened at 1280, 820 and 390 px with no console errors, failed requests or horizontal overflow; the 127-check browser script passed (temporary script, not in the repository). The only change was a documentation note in `database/erd/erd.md` mapping mock-data field names to ERD column names.

### Submission status of this log

Complete from the evidence available: tools, prompts, outputs, checks, nine cases (seven found by Claude, two noticed by the student and corrected by Claude), limitations. Not claimed: any bug found by the student by reading code, a student code review, or tests run by the student other than the manual run they reported.

---

## Milestone 2 – Database and DAO layer

### AI tool and purpose

- **Tool:** Claude (Claude Code, model Claude Sonnet 5.5) again. No other AI tool is recorded.
- **Used for:** the MySQL schema and sample data, the PDO connection class, `BaseDao` and six DAO classes, a plain PHP test script, and the documentation updates.

### Main prompts and tasks

1. A long M2 prompt listing the official requirements (database, at least five entities, SQL export with sample data, DAO layer with a reusable base class, PDO, prepared statements, credentials in a git-ignored config file), the architecture limits (no routes, services, JWT, TMDB or frontend integration), the tests to run and the documentation to update. It also required that the work should start only after M1 was merged.
2. A change of decision by the student: do **not** wait for the M1 pull request. Connect to the student's GitHub repository, check that `origin/milestone1` contains the complete M1, and create `milestone2` from it. Keep the code simple enough for a beginner to explain, do not merge pull requests, do not force-push.

### Git starting point

The repository `https://github.com/adnanhadzic1/CineTrack-Project-` was cloned read-only. `origin/main` was at `4d3e30a` ("Initial commit") and `origin/milestone1` at `23bb3d5` ("Merge remote main history into milestone1"). Its files were compared with the finished M1 working tree from the earlier sessions: the only difference was one README line (the repository URL). `milestone2` was created from `origin/milestone1` (`23bb3d5`). The M1 branch and its pull request were not touched. Claude had no GitHub login in its environment, so it could not push; see the final report of the session for what the student has to do.

### What the AI produced

| Area | Files |
|------|-------|
| Database | `database/cinetrack.sql` (6 tables, keys, constraints, indexes, fictional sample data taken from the frontend mock data) |
| PDO connection | `backend/config/Database.php`, `backend/config/config.example.php` (placeholders only) |
| DAO layer | `backend/dao/BaseDao.php`, `UserDao.php`, `TitleDao.php`, `GenreDao.php`, `TitleGenreDao.php`, `WatchlistItemDao.php`, `ReviewDao.php` |
| Test | `backend/tests/dao_test.php` |
| Docs | `README.md`, `AGENTS.md`, `docs/PLAN.md`, `database/erd/erd.md`, `backend/README.md`, `backend/dao/README.md`, this file |

The only change to the ERD is a note that lists MySQL details (unsigned ids, string lengths, constraint names); no entity or relationship was changed. Sample data was generated from `frontend/js/data/mock-data.js` by a throw-away script (not in the repository); the five sample users got bcrypt hashes of one local demo password that is written in the SQL header.

### How the results were reviewed and tested

Performed by Claude in its sandbox, not by the student:

- `php -l` on every PHP file (no syntax errors).
- A real database: MariaDB 10.11 was installed in the sandbox (MySQL itself was not available). `database/cinetrack.sql` was imported into a fresh database and imported a second time (re-import works).
- `php backend/tests/dao_test.php` against that database: **87 checks passed, 0 failed**, run twice (once on the first import, once after dropping the database and importing again). The script checks: the six tables and InnoDB; six foreign keys, all `ON DELETE CASCADE`; five unique indexes; sample data counts; bcrypt hashes; create, read by id, read by filter or relationship, update and delete for every DAO; rejected duplicates (e-mail, genre name, TMDB id with media type, watchlist entry, review, genre twice on a title); rejected invalid foreign keys, ENUM values and CHECK values (rating, progress); several titles without `tmdb_id` allowed; quotes, `%`, backslashes, Unicode and an SQL-injection-like text stored as plain text; unknown or injected column names rejected; no `password_hash` in normal user reads; cascade deletes for genre, title and user; the transaction in `replaceForTitle` rolls back on an error; test rows removed at the end; a failed login to the database gives a generic message without the password, user name or host.
- **Not verified:** MySQL 8 itself (only MariaDB 10.11), MySQL versions older than 8.0.16, Windows, and PHP versions other than 8.3.6.
- **Not part of M2 and therefore not done:** anything outside the DAO layer (no routes, services, authentication, TMDB or frontend connection). The M1 frontend tests were not re-run for M2 because no frontend file was changed.

**Student review (to be done by the student):** run the three commands in the README on your own MySQL, read `BaseDao.php` and one DAO until you can explain `run()`, `$columns` and why values are passed as `?` parameters, and be able to explain why `TitleGenreDao` overrides three inherited methods. These steps are not recorded as done.

### Cases where the AI made a mistake or produced poor code

All three cases below really happened during this milestone. They were found by Claude itself while running its own test script or reviewing its own code; the student did not find them.

**Case J – the first test script clashed with the DAO's own transaction (found by running the test)**
1. *Requested:* tests that leave the sample data unchanged.
2. *What the AI did:* it wrapped the whole test script in one outer transaction that is rolled back at the end, and also wrote `TitleGenreDao::replaceForTitle()` with its own `beginTransaction()`.
3. *How it was detected:* the first run stopped with `PDOException: There is already an active transaction` at the first call of `replaceForTitle()`.
4. *Fix:* the outer transaction was dropped. The script now removes the rows it created (several are removed by the cascade checks, the rest explicitly) and finishes with a check that the sample data counts are back to 5 users, 14 titles, 12 genres, 12 watchlist items, 6 reviews and 25 genre links. The DAO stayed simple, and the test of the rollback in `replaceForTitle` became a real test of that transaction.
5. *Checked by:* rerunning the script (87 passed).

**Case K – a wrong expectation in the test about PDO attributes (found by running the test)**
1. *What was wrong:* a check wrote `getAttribute(PDO::ATTR_EMULATE_PREPARES) === false`, but PDO returns the integer `0`, so the check failed although the connection was configured correctly.
2. *How it was detected:* 86 of 87 checks passed; the failing one was investigated by printing the real values (`int(0)` and `int(2)`).
3. *Fix:* the test now compares `(int) ... === 0`. The connection code was not changed, and the check was not removed or weakened: it still fails if emulated prepares were turned on.

**Case L – the junction table inherited methods that cannot work (found in self-review, then covered by a test)**
1. *What was wrong:* `TitleGenreDao` extends `BaseDao`, whose `findAll()`, `findById()`, `update()` and `delete()` assume a single `id` column. `title_genres` has none (its key is `title_id` plus `genre_id`), so the inherited `findAll()` would have produced a SQL error and the other three would have been misleading.
2. *How it was detected:* while re-reading the class before running the tests.
3. *Fix:* `findAll()` was overridden with an explicit `ORDER BY title_id, genre_id`; `findById`, `update` and `delete` now throw a `LogicException` that names the right method (`findByTitleId`, `replaceForTitle`, `remove`). Tests cover both.

### Limitations of this AI-assisted work to be aware of

- Tests ran on MariaDB 10.11 only, not on MySQL.
- Claude could not push to GitHub (no login in its environment), so branch `milestone2` exists only in the working copy it used, until the student pushes it.
- The DAOs are generic and trust their caller: validation and business rules belong in the M3 services.
- FlightPHP is still not installed and its version in `composer.json` is still unverified.
