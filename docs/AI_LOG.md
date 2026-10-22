# AI usage log

One section per milestone. The student is responsible for understanding and being able to explain all code.

## Milestone 1 – Setup, static frontend, ERD

### AI tool and purpose

- **Tool:** Claude (Claude Code, model Claude Sonnet 5.5).
- **Used for:** planning the five milestones; generating the project structure, the static SPA (HTML/CSS/JS), mock data, the draft ERD and the documentation; writing and running a browser test script.

### Main prompts and tasks

1. A long "master prompt" asking Claude to act as engineer/architect/designer/QA, read the university requirements document, plan all five milestones, and **implement only Milestone 1**, without inventing backend, authentication, API or deployment claims.
2. A follow-up prompt asking Claude to finish the M1 documentation, audit the work against the official requirements document, handle the FlightPHP installation problem honestly, and prepare the `milestone1` commit without starting M2.

### What the AI produced

| Area | Files |
|------|-------|
| Repository setup | `.gitignore`, folder structure, `backend/composer.json`, `backend/config/config.example.php`, per-folder READMEs |
| SPA core | `frontend/index.html`, `css/styles.css`, `css/responsive.css`, `js/app.js`, `js/router.js`, `js/state.js` |
| Mock data and API foundation | `js/data/mock-data.js`, `js/services/api-service.js` (disabled, throws on use) |
| Screens | `js/views/*.js` (login, register, dashboard, discover, watchlist, reviews, profile, admin) |
| Components and helpers | `js/components/*.js`, `js/utils/*.js` |
| Planning and docs | `database/erd/erd.md`, `docs/PLAN.md`, `README.md`, `AGENTS.md`, this file |

### How the results were reviewed and tested

Performed by Claude in its sandbox (not by the student):

- `node --check` on all 24 JavaScript files.
- A Playwright (Chromium) script that exercised navigation without reload, dashboard counts, search, filters, sorting, modals, watchlist actions, review validation, profile validation, admin actions, login and register validation, the mobile drawer, horizontal-overflow checks at three viewport sizes, and the browser console. Result of the latest run is in the final report of the session.
- Screenshots of the dashboard, discover, admin and the phone modal were viewed.

**Student review (to be completed by the student):**

- [ ] Run the app locally and click through every screen.
- [ ] Read through `state.js`, `router.js`, `app.js` and one view until you can explain them without help.
- [ ] Be able to explain why the ERD has the junction table and the unique constraints.

### Cases where the AI made a mistake or produced poor code

> The course requires **at least two genuine cases** per milestone. The cases below really happened and were found **by the AI itself during its own review/testing**, not by the student. Before submission the student should add at least two cases from their **own** review (for example while running the app, reading the code or being questioned), and must not claim the cases below as personal discoveries.

**Case A – duplicate import (found by the AI, before running the code)**
- *What was wrong:* when writing `title-modal.js`, the AI imported `confirmDialog` from `modal.js` in a second, separate import statement. Importing the same name twice in one module is a syntax error and would have broken the whole details modal.
- *How it was noticed:* the AI re-read the file right after writing it.
- *Fix:* merged it into one import (`import { openModal, confirmDialog } from './modal.js'`). `node --check` passed afterwards.

**Case B – cancelling a removal left the user without a dialog (found by the AI, in design review)**
- *What was wrong:* in the title details modal, "Remove" opens a confirmation dialog. Opening a dialog closes the current one, so pressing Cancel would have left the user with no modal at all, which is confusing.
- *How it was noticed:* the AI traced the modal open/close logic while writing the component.
- *Fix:* when the confirmation is cancelled the details modal is reopened. The browser test covers confirming and cancelling removal from the watchlist page, but **the cancel-then-reopen path in the details modal was not covered by an automated test**.

**Case C – the test suite initially reported failures that were test mistakes (found by the AI)**
- *What was wrong:* the first browser-test run showed 92/96 and then 95/96 checks passing. The failures were wrong test assumptions (a check that ran before the page was drawn, an expected error count that was wrong, and not waiting for the 0.2 s mobile-drawer animation). None were application bugs.
- *How it was noticed:* the AI inspected each failure, and reproduced the drawer case separately to confirm the drawer really opened.
- *Fix:* the tests were corrected to wait for the right element and to expect two login errors. Lesson recorded: a failing check needs investigation, and so does a passing one.

**Student cases (to be added by the student before submission):**

| # | What was wrong | How I noticed it | How I fixed it |
|---|----------------|------------------|----------------|
| 1 | _fill in from your own review_ | | |
| 2 | _fill in from your own review_ | | |

### Limitations of this AI-assisted work to be aware of

- Packagist was unreachable from the AI's sandbox, so FlightPHP was **not** installed and the version in `composer.json` is unverified.
- Tests ran in Chromium only. No Firefox, Safari or real-device testing was done.
- TMDB's current attribution rules were not checked in M1, because no TMDB data is used yet.
