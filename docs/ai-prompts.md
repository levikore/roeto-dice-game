# AI Prompt Log

The prompts that directed the building of this project, word for word, each with what came back, how it was checked, and the evidence that it worked. Only the prompts that directed the build are listed; numbers are as assigned, so they are not continuous. […] marks text left out of a quoted prompt.

---

### P-001 — Project planning
- **Date:** 2026-10-15
- **Tool / model:** Claude Code desktop (Claude Opus 5.5)
- **Phase / step:** Phase 0, planning
- **Requirements:** all (R1–R8, B1–B7, F1–F4, X1–X6)
- **Prompt (verbatim):**
  > create a comprehensive plan for this task.
  > every step of this project should be explained and validated, every step and every ai prompt should be documented
- **Context given:** `roeto-home-assignment .pdf` (assignment brief, 3 pages)
- **Output summary:** The project plan (requirements breakdown with IDs, assumptions A1–A6, architecture, API design, 8 phases each with steps and validation gates, prompt-logging process, acceptance checklist, schedule, risks).
- **Review:**
  - *Checked:* Read the PDF brief line by line and compared the plan with it: 8 rules, 7 backend points, 4 frontend points, 6 optional extras all have an ID in §0.
  - *Decision:* ✏️ Accepted as a starting plan, revised in P-013.
  - *Changed or found:* Prisma replaced by built-in `node:sqlite`; sound and deployment dropped; one commit per phase instead of per step; one Playwright smoke test instead of three; the bot plays inside the same request.
  - *Alternatives not used:* Prisma, better-sqlite3, a separate bot-step endpoint, a live demo deployment. Rejected for setup cost, native build risk, extra client logic and extra usage.
  - *Open / limits:* Six assumptions (A1–A6) were never confirmed with the recruiter; they are listed in the README.
- **Validation:** Checked against the PDF: its 8 rule bullets, 7 backend points, 4 frontend points and 6 extras map to R1–R8, B1–B7, F1–F4 and X1–X6 in the plan's requirements section, and each has a row in the plan's acceptance checklist (and the README table).
- **Commit:** 5c5115b

### P-002 — Project location, git repo, cost policy
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Claude Opus 5.5, low effort)
- **Phase / step:** Phase 0, steps 1 and 3
- **Requirements:** none (process)
- **Prompt (verbatim):**
  > this entire project should be created inside ~/git_wa/job_interviews.
  > make sure this directory exists.
  > create a local git repo, get my permission before every commit.
  > make sure that this project costs as little usage as possible, use methods like switching to cheaper ai models or to lower effort levels when necessary
- **Context given:** the plan from P-001
- **Output summary:** Confirmed the folder exists. Created `roeto-dice-game/` inside it with `git init -b main` and a `.gitignore`, and moved the plan there. Added to the plan a commit approval policy and an AI cost policy (: model tiers, effort levels, token-saving habits). Added model/effort to the log template.
- **Review:**
  - *Checked:* Confirmed the folder exists and the repo has no commits before approval; read the new policy sections of the plan.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Nothing changed here; §3a was later amended to one commit per phase (P-013).
  - *Alternatives not used:* Putting the project directly in `job_interviews/` instead of a subfolder: rejected so future interview projects do not mix.
  - *Open / limits:* The AI cannot change its own model; the owner has to switch it in the model menu.
- **Validation:** `git status` shows the repo on `main` with no commits yet; the two policy sections exist in the plan.
- **Commit:** 5c5115b

### P-003 — Start Phase 0 (substep-by-substep, Sonnet)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort — switched by the user via `/model`; verified with `get_session`)
- **Phase / step:** Phase 0, step 2
- **Requirements:** none (setup)
- **Prompt (verbatim):**
  > start, ask me before every substep
  > go, make sure i picked Sonnet, with effort set to Low.
- **Output summary:** Created the npm workspaces skeleton (`shared`, `server`, `client`), `tsconfig.base.json`, ESLint flat config, Prettier config; client generated with `npm create vite` (react-ts); dev tools installed (eslint, typescript-eslint, prettier, vitest, typescript).
- **Review:**
  - *Checked:* Ran lint, typecheck and tests on the skeleton; checked the model and effort with `get_session` before starting.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Fixed an ESLint warning about the module type by adding `"type": "module"` to the root package.json.
  - *Alternatives not used:* Generating the client by hand vs `npm create vite`: used the generator to save usage.
  - *Open / limits:* The Vite template left an `.oxlintrc.json` in the client that ESLint at the root does not use (removed in P-041).
- **Validation:** `npm run lint`, `npm run typecheck` and `npm test` all pass (no tests yet; `--passWithNoTests`).
- **Commit:** 5c5115b

### P-004 — Phase 0 substep 0.3 (docs skeleton)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 3
- **Requirements:** none (docs)
- **Prompt (verbatim):**
  > Yes, 0.3
- **Output summary:** Added `README.md` skeleton and an architecture decision record.
- **Review:**
  - *Checked:* Read the files; compared the decision record with the plan's architecture section.
  - *Decision:* ✅ Accepted as written.
  - *Changed or found:* None.
  - *Alternatives not used:* A longer README: rejected until Phase 7 so it describes a working app.
- **Validation:** Files exist; the decision record matches the plan's architecture section.
- **Commit:** 5c5115b

### P-005 — Phase 0 substep 0.4 (CI workflow)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 4
- **Requirements:** none (process)
- **Prompt (verbatim):**
  > Yes, 0.4
- **Output summary:** Added `.github/workflows/ci.yml` running `npm ci`, lint, typecheck and test on every push and PR (Node 22).
- **Review:**
  - *Checked:* Ran the same three commands the workflow runs (`npm ci`, lint, typecheck, test) from a clean install.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* Adding the e2e test and a coverage step to CI: deferred.
  - *Open / limits:* The workflow has never run on GitHub because the repo has no remote.
- **Validation:** Same three commands pass locally; the workflow itself can only be checked once the repo is pushed to GitHub (no remote yet).
- **Commit:** 5c5115b

### P-006 — Phase 0 substep 0.5 (.env.example)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 5
- **Requirements:** none (setup)
- **Prompt (verbatim):**
  > Yes, 0.5
- **Output summary:** Added `.env.example` with `PORT`, `DATABASE_URL`, `JWT_SECRET` (placeholder) and `CLIENT_ORIGIN`. `.env` is already in `.gitignore`.
- **Review:**
  - *Checked:* Checked that `.env` is git-ignored (`git check-ignore .env`) and that the example holds no real secret.
  - *Decision:* ✏️ Accepted, later changed.
  - *Changed or found:* `DATABASE_URL` became `DATABASE_PATH` (P-017); the API now refuses the placeholder secret (P-034).
  - *Alternatives not used:* Committing a default secret for convenience: rejected because it is public.
- **Validation:** `git check-ignore .env` confirms `.env` is ignored; no real secret in the file.
- **Commit:** 5c5115b

### P-007 — Phase 1 step 1 (shared types)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 1
- **Requirements:** R1–R8, B3, B5 (types only)
- **Prompt (verbatim):**
  > […] then ask me before starting Phase 1 substep 1.
  > (follow-up answer) Yes, go ahead
- **Output summary:** Added `shared/src/game.ts` (GameState, Action, GameError codes, Result, DiceRoller, GameEvent) and exported it from `shared/src/index.ts`.
- **Review:**
  - *Checked:* Typechecked the types; checked they match the planned domain model.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Types grew later: `GameView` (P-019), `ABANDON` event (P-021), `api.ts` (P-024).
  - *Alternatives not used:* Putting the types in the server package: rejected so the client can import the same definitions.
- **Validation:** `npm run typecheck` and `npm run lint` (below).
- **Commit:** e659dc1

### P-008 — Phase 1 step 2 (failing engine tests first)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 2
- **Requirements:** R1–R7, B5, A1, A2, X4
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added `server/src/game/engine.test.ts` (26 tests: createGame/R7, ROLL/R3, 6&6 + action lock/R4+X4, HOLD/R5+A2, winning/R6+A1, validation/B5) and a stub `engine.ts` whose functions throw "not implemented". API decided: `createGame(id, [A,B], winningScore?)` and `applyAction(state, action, actorId, dice, now?)`, both returning `Result`.
- **Review:**
  - *Checked:* Counted the tests against the plan's list of rules (26 tests); ran them to confirm they all fail before implementing.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* The first version failed lint and typecheck (`it.each` typing, unused stub arguments) while the step was first reported as clean; fixed and the status corrected in the same turn.
  - *Alternatives not used:* Writing implementation and tests together: rejected so each test is proven able to fail.
- **Validation:** `npm test --workspace @dice/server` → 26 failed / 26 (expected: tests are red before implementation).
- **Commit:** e659dc1

### P-009 — Phase 1 step 3 (implement engine)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 3
- **Requirements:** R1–R7, B3, B5, X4
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Implemented `server/src/game/engine.ts`: `createGame` (winning score 10–1000, default 100) and pure `applyAction` (check order: game active → is a player → is their turn → not locked → ROLL/HOLD). 6&6 sets a 1500 ms lock. Winner keeps the turn marker; no further actions accepted. Input state is cloned, never mutated.
- **Review:**
  - *Checked:* Read the implementation against each rule; ran the 26 tests, lint and typecheck.
  - *Decision:* ✅ Accepted unchanged: all tests passed on the first run.
  - *Changed or found:* None.
  - *Alternatives not used:* A class or state machine instead of a pure function: rejected because a pure function is easiest to test.
  - *Open / limits:* Order of checks (game active, is a player, is their turn, lock, action) is a design choice written into the tests.
- **Validation:** `npm test --workspace @dice/server` → 26 passed; lint and typecheck clean.
- **Commit:** 533e047

### P-010 — Phase 1 step 4 (property-based tests)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 4
- **Requirements:** R3–R6, B5
- **Prompt (verbatim):**
  > Yes, step 4. […]
- **Output summary:** Added dev dependency `fast-check` and `server/src/game/engine.property.test.ts`: 1000 random games (winning score 10–200, up to 200 random actions from alice/bob/an outsider). Invariants: scores never negative; round score is 0 whenever the turn changes; version +1 per accepted action; total of global scores equals total of HOLD deltas; at most one WIN; a finished game accepts nothing; the winner has reached the winning score and nobody else has.
- **Review:**
  - *Checked:* Ran 1000 random games; checked the invariants listed in the plan hold.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Self-found slip: the first draft asserted on `r.value` inside the error branch (type error); changed to check the error code.
  - *Alternatives not used:* Hand-written random loops instead of fast-check: rejected because fast-check shrinks failures.
- **Validation:** `npm test --workspace @dice/server` → 27 passed; lint and typecheck clean.
- **Commit:** fee6a73

### P-011 — Phase 1 step 5 (seeded game script)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 5
- **Requirements:** R1–R6 (manual check)
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Added `server/src/scripts/play-game.ts` (seeded mulberry32 dice, simple "hold at 15" player, prints every event) and the script `npm run play-game --workspace @dice/server -- [seed] [winningScore]`. No new dependencies: Node runs the TypeScript file directly; `allowImportingTsExtensions` added to `tsconfig.base.json`.
- **Review:**
  - *Checked:* Read the printed seed-7 game move by move against the rules.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Node's built-in TypeScript mode needed `allowImportingTsExtensions` in `tsconfig.base.json`.
  - *Alternatives not used:* Adding `tsx` as a dependency: rejected, Node runs the file directly.
- **Validation:** Ran with seed 7, winning score 30. Log read by hand: round scores add up, HOLD banks the round score and passes the turn, alice wins on the hold that reaches 40 ≥ 30, no actions after WIN. Lint and typecheck clean.
- **Commit:** aea98bd

### P-012 — Phase 1 validation gate
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, validation checklist
- **Requirements:** B3 (rules in one pure place)
- **Prompt (verbatim):**
  > Not yet
  > continue
- **Output summary:** Added dev dependency `@vitest/coverage-v8` and script `test:coverage` (fails below 100% lines/branches on `engine.ts`). Added an ESLint `no-restricted-imports` rule for `server/src/game/engine.ts` blocking express, prisma, fs, node:* and http(s).
- **Review:**
  - *Checked:* Ran coverage (100%, 29/29 branches); temporarily added `import fs from 'node:fs'` to the engine to prove the lint rule fires, then reverted.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* A separate package boundary for the engine: rejected as heavier than a lint rule.
- **Validation:** Coverage: 100% statements/branches/functions/lines (29/29 branches). Negative test: temporarily adding `import fs from 'node:fs'` to the engine made ESLint fail; reverted (no diff on engine.ts). Property test ran 1000 games; seed-7 game log read by hand (P-011). Lint, typecheck and all 27 tests pass.
- **Commit:** aea98bd

### P-013 — Commit Phase 1, commit per phase, re-validate plan, open decisions
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5 low for the commit; then the session ran on Opus 5.5 medium for the plan review)
- **Phase / step:** Between Phase 1 and Phase 2 (plan review)
- **Requirements:** X1–X6, B7 (scope decisions)
- **Prompt (verbatim):**
  > commit, from now on commit every phase not every step, validate your plan again.
  > lets decide questions your unsure about
- **Follow-up answers (verbatim, from the question cards):**
  > Database: "For the sake of the exercise, simulate the different users on the same page. No need for live updates between different browsers/machine — validate you choice" → then "Yes, node:sqlite"
  > Extras: "Win tracking + persistence, 6&6 lock + message, AI opponent (bot)"
  > Delivery: "Local repo + README only"
  > E2E: "One smoke test"; Bot turn: "Inside the same request"
- **Output summary:** Committed Phase 1 remainder as aea98bd. Updated the plan: commit once per phase; DB is built-in `node:sqlite` with a schema.sql file instead of Prisma; extras X1–X4 plus the event-history panel (no sound, no deploy); one Playwright smoke test; the bot turn runs in the same request; game start flow (WAITING exists only in the service; engine starts on join); Phase 0/1 checklists ticked; CI check deferred until you push.
- **Review:**
  - *Checked:* Re-read the plan against the code written so far; tested `node:sqlite` on Node 26 (a stale versioned update changes 0 rows).
  - *Decision:* ✅ Owner decisions recorded.
  - *Changed or found:* Decisions: `node:sqlite`; extras = wins and persistence, double-six pause, bot; one smoke E2E test; bot in the same request; local delivery. The plan was rewritten; Phase 0–1 checklists ticked.
  - *Alternatives not used:* Prisma and better-sqlite3 (see P-001).
  - *Open / limits:* The session briefly ran on Opus for this review; the owner switched it back to Sonnet / low.
- **Validation:** `node:sqlite` checked on Node 26.11.1: a stale `UPDATE … WHERE version = ?` changes 0 rows. grep shows no remaining Prisma / sound / multi-test Playwright references in the plan.
- **Commit:** 9634791

### P-014 — Phase 2 step 1 (SQL schema and database opener)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort; user switched via `/model`)
- **Phase / step:** Phase 2, step 1
- **Requirements:** B2, B4, X1, X2
- **Prompt (verbatim):**
  > Yes, start Phase 2 step 1.
- **Output summary:** Added `server/src/db/schema.sql` (users, games, game_players, game_events with CHECK constraints, foreign keys, case-insensitive unique usernames), `server/src/db/db.ts` (`openDb(path)` applies the schema, foreign keys on, WAL), and `db.test.ts` (5 tests).
- **Review:**
  - *Checked:* Ran the schema tests: idempotent, bad status rejected, foreign keys enforced, case-insensitive usernames, stale-version write changes 0 rows.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* A misplaced import at the bottom of the test file was moved to the top.
  - *Alternatives not used:* A migration tool: rejected, `CREATE TABLE IF NOT EXISTS` is enough for this size.
- **Validation:** 32 tests pass (27 engine + 5 db): schema idempotent, duplicate username (case-insensitive) rejected, bad status rejected, foreign key enforced, stale versioned update changes 0 rows. Lint clean.
- **Commit:** 9634791

### P-015 — Phase 2 step 2 (register and login)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 2
- **Requirements:** B1, B2
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added dependencies express 5, zod, bcryptjs, jsonwebtoken (+ supertest and types for dev). New files: `server/src/app.ts` (`createApp`), `http/auth.ts` (register/login, zod validation, bcrypt cost 10, JWT 24 h), `http/errors.ts` (`ApiError` + central handler returning `{error:{code,message}}`), `http/auth.test.ts` (13 tests). Deviation from plan: **bcryptjs** (pure JavaScript) instead of native bcrypt, to avoid a native build step on new Node versions.
- **Review:**
  - *Checked:* Read the register and login code; ran 13 tests; checked the stored value is a bcrypt hash.
  - *Decision:* ✏️ Accepted with a fix.
  - *Changed or found:* Self-found: the dummy hash for unknown users was invalid, so the "same work" claim was false (bcrypt returns instantly on a malformed hash); replaced with a real hash computed at startup. Deviation: `bcryptjs` (pure JavaScript) instead of native `bcrypt`.
  - *Alternatives not used:* Native bcrypt: rejected for native build risk on new Node versions.
- **Validation:** 45 tests pass: duplicate username (case-insensitive) → 409; weak/empty/invalid input → 400; malformed JSON → 400; stored value is a bcrypt hash and not the password; wrong password and unknown user return identical 401 bodies. Lint and typecheck clean.
- **Commit:** 9634791

### P-016 — Phase 2 step 3 (requireAuth middleware and /auth/me)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 3
- **Requirements:** B1, B6
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Added `server/src/http/requireAuth.ts` (reads Bearer token, verifies HS256 signature and expiry, loads the user from the database, sets `req.user`; every failure is 401 `UNAUTHENTICATED`) and `GET /api/auth/me`. Added `requireAuth.test.ts` (11 tests).
- **Review:**
  - *Checked:* Tested missing, malformed, expired, forged, `alg: none` and deleted-user tokens.
  - *Decision:* ✅ Accepted unchanged: all tests passed on the first run.
  - *Changed or found:* None.
  - *Alternatives not used:* Storing the whole user in the token: rejected, the user is loaded from the database each request.
  - *Open / limits:* Tokens cannot be revoked before expiry (listed in README known limits).
- **Validation:** 56 tests pass. Rejected: missing token, malformed headers, expired token, wrong secret, `alg: none` token, valid token for a deleted user. Lint and typecheck clean.
- **Commit:** 9634791

### P-017 — Phase 2 step 4 (seed script)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 4
- **Requirements:** B2, X3 (bot user)
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** Added `server/src/db/seed.ts` (`seed(db, demoPassword)`: alice, bob and the bot; idempotent; bot gets a random thrown-away password), `scripts/seed.ts`, `seed.test.ts` (3 tests), scripts `npm run seed` / `npm run db:reset` for the server workspace. `.env.example` now uses `DATABASE_PATH` (no Prisma URL) and adds `DEMO_PASSWORD`. `.gitignore` also ignores SQLite `-wal`/`-shm` files.
- **Review:**
  - *Checked:* Ran reset and seed twice by hand with a temporary `.env`; checked the bot cannot log in.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* `.env.example` now uses `DATABASE_PATH` and `DEMO_PASSWORD`; `.gitignore` also ignores SQLite `-wal` and `-shm` files.
  - *Alternatives not used:* Seeding demo users on every startup: rejected, it is an explicit command.
- **Validation:** 59 tests pass. By hand: with `.env` copied from `.env.example`, `db:reset` then `seed` printed "alice, bob, bot", and a second `seed` run also succeeded (idempotent); the temporary `.env` and `dev.db` were removed afterwards. Lint and typecheck clean.
- **Commit:** 9634791

### P-018 — Phase 2 step 5 (hardening and server entry)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 5 (plan item 6)
- **Requirements:** B1, B6
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Added `helmet`, `cors` (single allowed origin), `express-rate-limit` (login/register only, configurable) and a 10 kb body limit to `createApp`; added `server/src/index.ts` (starts the API from env) and `npm run start`. Added `hardening.test.ts` (5 tests). Error handler now maps oversized bodies to 413 `PAYLOAD_TOO_LARGE`.
- **Review:**
  - *Checked:* Ran the real server and called login and `/me` with curl; tested CORS, headers, body size and the rate limit.
  - *Decision:* ✏️ Accepted with two fixes.
  - *Changed or found:* (1) An oversized body returned 500; now 413 `PAYLOAD_TOO_LARGE` (caught by a test). (2) The live run showed Node's TypeScript mode rejects constructor parameter properties in `ApiError`, which Vitest had accepted; rewrote the class and added `erasableSyntaxOnly` so typecheck catches it. My first CORS test was wrong (the header names the allowed origin; the browser does the blocking) and was corrected.
  - *Alternatives not used:* Skipping the live run because tests passed: rejected, it found the second bug.
- **Validation:** 64 tests pass; lint and typecheck clean. Live check: started the real server with a temporary `.env`, seeded the DB, `POST /api/auth/login` as alice returned a token and `GET /api/auth/me` without a token returned 401. The temporary `.env` and `dev.db` were removed.
- **Commit:** 9634791

### P-019 — Phase 3 step 1 (GameService)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, step 1
- **Requirements:** B3, B4, B5, R7, X3 (bot game start)
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `GameView` to `shared/src/game.ts` (what the API returns: usernames, wins, `currentPlayerId`, `allowedActions`, `lockRemainingMs`, `version`; the client renders it and computes nothing). Added `server/src/game/dice.ts` (`secureDice` using `crypto.randomInt`) and `server/src/game/service.ts` with `create`, `join`, `get` and `act`. Each write runs in a `BEGIN IMMEDIATE` transaction, loads the game, calls the pure engine, saves with a conditional `UPDATE … WHERE version = ?`, and appends `game_events`. Engine error codes map to HTTP statuses (403/409/423/422/400). `newGame`, win counting and the HTTP routes are left for steps 2–5.
- **Review:**
  - *Checked:* Read the service against the engine; ran 16 tests including a forced mid-transaction failure that must roll back.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Refactored in P-030 (`applyAndSave`) when the bot arrived; all earlier tests still passed.
  - *Alternatives not used:* Letting the engine touch the database: rejected, the engine stays pure.
- **Validation:** 80 tests pass (16 new in `service.test.ts`): waiting/started/bot games, bad winning scores, own/full/unknown game joins, outsider read and act blocked, roll and hold persisted with events, 6&6 lock with a fake clock, stale `expectedVersion` rejected without rolling dice, and a forced mid-transaction failure rolled back completely. Lint and typecheck clean.
- **Commit:** 927e66e

### P-020 — Phase 3 step 2 (game HTTP routes)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, step 2
- **Requirements:** B3–B6, R7
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added `server/src/http/games.ts`: `POST /api/games`, `GET /api/games/:id`, `POST /api/games/:id/join`, `POST /api/games/:id/roll`, `POST /api/games/:id/hold`, all behind `requireAuth`, with zod-validated bodies and params. `createApp` now builds the `GameService` and accepts injectable `dice` and `now` (used by tests). Responses are `{ game }` or `{ game, events }`. `POST /:id/new` and the leaderboard are still to come.
- **Review:**
  - *Checked:* Ran 23 tests over real HTTP with supertest, including every route without a token.
  - *Decision:* ✅ Accepted unchanged: all tests passed on the first run.
  - *Changed or found:* None.
  - *Alternatives not used:* Validating the winning score range in zod as well: rejected so the rule lives only in the engine.
- **Validation:** 103 tests pass (23 new in `games.test.ts`, through real HTTP with supertest): every game route → 401 without a token; create/join; bot game; winning scores `0`, `-5`, `10001`, `12.5` → 400 `INVALID_WINNING_SCORE`, `"abc"` and bad opponent → 400 `VALIDATION_ERROR`; outsider read and act → 403 `NOT_A_PLAYER`; wrong player → 403 `NOT_YOUR_TURN`; hold with nothing → 422; 6&6 → 423 then success after the lock; stale `expectedVersion` → 409; finished game → 409 for both players and both actions. Lint and typecheck clean.
- **Commit:** 927e66e

### P-021 — Phase 3 step 3 (membership review and "new game")
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, steps 3–4 of the plan (membership checks, `new` route)
- **Requirements:** R8, B5
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Reviewed membership checks: `get`, `act` and `newGame` all call `requireMember`; `join` is the only action open to a non-member, and only on a `WAITING` game. Added `GameService.newGame` and `POST /api/games/:id/new`: an in-progress game becomes `ABANDONED` (with an `ABANDON` event, no winner), a finished game stays finished, and a fresh game starts with the same players, seat order and winning score. Added `'ABANDON'` to the shared event type. The plan's assumption A3 was updated with these details.
- **Review:**
  - *Checked:* Ran 6 tests: either player restarts, old game becomes ABANDONED, finished game stays FINISHED, outsiders and bad states rejected.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Assumption A3 in the plan updated with the exact behaviour (same players, order and winning score; not allowed on a waiting game).
  - *Alternatives not used:* Swapping who starts in the new game: rejected, extra rule not in the brief.
- **Validation:** 109 tests pass (6 new): either player can restart; old game shows `ABANDONED` and rejects actions with 409; works during a 6&6 lock; finished game stays `FINISHED`; bot game restarts against the bot; outsider → 403, waiting game → 409, stale version → 409, second restart of the same game → 409; unauthenticated → 401. Lint and typecheck clean.
- **Commit:** 927e66e

### P-022 — Phase 3 step 4 (win counting and leaderboard)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, steps 5–6 of the plan
- **Requirements:** X1, R6
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** `GameService.act` now adds one win to the winner inside the same transaction as the deciding hold. Added `GameService.leaderboard()` and `GET /api/leaderboard` (login required, most wins first, bot included and flagged).
- **Review:**
  - *Checked:* Ran 6 tests including the plan's scripted game with brand-new users; checked a win is counted once.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* Counting wins when a game is abandoned: rejected, nobody wins an abandoned game.
  - *Open / limits:* The bot appears on the leaderboard, marked as a bot.
- **Validation:** 115 tests pass (6 new): leaderboard needs login; winner +1, loser +0; no extra win for actions after the game ends or for restarting; wins across several games rank correctly; an abandoned game gives nobody a win; and the plan's scripted game with brand-new users (register → create → join → play incl. a 6&6 → win) ends with `wins` = 1 for the winner. Lint clean.
- **Commit:** 927e66e

### P-023 — Phase 3 step 5 (API docs, concurrency test, curl walkthrough)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, step 6 and validation
- **Requirements:** B4, B5
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Wrote `docs/api.md` (endpoint table, the `game` object, error codes, curl walkthrough). Added a test that fires two rolls at once with the same `expectedVersion`.
- **Review:**
  - *Checked:* Extracted the bash block from `docs/api.md` and ran it unchanged against a live server, twice.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* Hand-run curl commands: rejected, running the document itself proves it works.
  - *Open / limits:* With random dice a double six (1 in 36) changes one printed number.
- **Validation:** 116 tests pass; lint and typecheck clean. Concurrency test: exactly one 200 and one 409, and only one roll's dice were used. Walkthrough: extracted the bash block from `docs/api.md` and ran it unchanged against the real server (seeded temporary database): printed `IN_PROGRESS`, `NOT_YOUR_TURN`, a round score, the same score banked, `UNAUTHENTICATED`, `IN_PROGRESS`, `3` — twice, with the same pattern. The temporary `.env` and database were removed. Note: with random dice a 6&6 on the roll (1 in 36) would pass the turn and the hold line would print the previous score instead.
- **Commit:** 927e66e

### P-024 — Phase 4 step 1 (client setup and typed API client)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, step 1
- **Requirements:** F1, F3, F4
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `@tanstack/react-query` to the client. Removed the Vite template demo (assets, CSS, demo `App.tsx`). Added `shared/src/api.ts` (response types shared by server and client), `client/src/api/client.ts` (one function per API call, bearer token passed in, errors turned into an `ApiError` with `status` and `code`), `client.test.ts` (5 tests), a Vite dev proxy from `/api` to `localhost:3000`, and a `QueryClientProvider` in `main.tsx`. `App.tsx` is a placeholder until step 2.
- **Review:**
  - *Checked:* Ran client tests, typecheck, lint and the production build.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Removed the Vite template demo files.
  - *Alternatives not used:* Generating a typed client from an OpenAPI file: rejected as heavier than a hand-written typed wrapper.
- **Validation:** 116 server + 5 client tests pass; `tsc` typecheck and ESLint clean; `npm run build -w @dice/client` produces a bundle. The client tests check the Authorization header, JSON body, error mapping, a non-JSON error and a network failure.
- **Commit:** d2e0f72

### P-025 — Phase 4 step 2 (two-player login panels)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, step 2
- **Requirements:** F1, B7
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added React Testing Library, user-event and jsdom as client dev dependencies; Vitest now runs the client in jsdom. New: `session.ts` (`useSessions`: two independent logins, "p1" and "p2", kept in React state and mirrored to sessionStorage inside try/catch), `AuthPanel.tsx` (login / register / log out, loading state, `role="alert"` error, labelled inputs), `App.tsx` (two panels side by side, one column on narrow screens), `index.css` (light and dark theme variables).
- **Review:**
  - *Checked:* Ran 6 component tests; checked both logins survive a remount.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* A button contrast problem in dark mode was found later and fixed (P-028); expired-login handling added (P-035).
  - *Alternatives not used:* Storing tokens in localStorage: rejected, sessionStorage keeps logins per tab.
- **Validation:** 6 new component tests (11 client tests in total, all pass): both forms shown; signing one player in leaves the other alone; the server's error message is shown on a failed login; register mode; log out; both logins survive a remount and "Both players are signed in." appears. Typecheck and ESLint clean. Not yet checked in a real browser (planned at the end of Phase 4).
- **Commit:** d2e0f72

### P-026 — Phase 4 step 3 (lobby)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, step 3
- **Requirements:** R7, R1, F3, F4
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Added `client/src/Lobby.tsx`: winning-score box, opponent choice (Player 2 or Bot) and a Start button. Start calls `createGame` with Player 1's token and, for a human opponent, `joinGame` with Player 2's token. `App.tsx` shows the lobby once Player 1 is signed in and keeps the started game in state (a one-line summary until the board arrives in step 4); logging out clears the game. Small lobby styles added.
- **Review:**
  - *Checked:* Ran 6 lobby tests including the bot path and a server-rejected score.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Test caught a real slip: `onSuccess` passed React Query's extra arguments on to the caller; wrapped. Design choice: the client does not check the winning-score range; the server's message is shown, so the rule lives in one place.
  - *Alternatives not used:* `min` and `max` attributes on the input: rejected, they would duplicate a rule.
  - *Open / limits:* If joining fails after creating, a waiting game is left behind on the server.
- **Validation:** 17 client tests pass (6 new in `Lobby.test.tsx`): hidden until Player 1 is in; create with P1's token then join with P2's token; typed score sent as a number; bot game = one call, no join, works without Player 2; Start disabled while a human opponent is missing; server error text shown and game not started. One test caught a real slip: `onSuccess` passed React Query's extra arguments on to the caller; fixed by wrapping. Typecheck and ESLint clean.
- **Commit:** d2e0f72

### P-027 — Phase 4 step 4 (game board)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, steps 4–7 of the plan (board, token routing, rendering rule, errors and pending states)
- **Requirements:** F2, F3, F4, X4 (message), B7
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** Added `client/src/Board.tsx` and wired it into `App.tsx`. It shows two player cards (total, wins, round score for the active player only, active highlight via `aria-current`), the last dice as Unicode faces, event messages (roll, double six, hold, win), Roll / Hold / New game / Change settings buttons, and an error banner. Buttons are enabled only from the server's `allowedActions`. Each action uses the token of the player the server names in `currentPlayerId`; New game uses any member's token. Requests send the game `version` and the buttons are disabled while a request is in flight. After a server error it re-reads the game. After a 6&6 it asks the server again once `lockRemainingMs` has passed. If the current player has no token on this page (the bot) it says "Waiting for …". Board styles added.
- **Review:**
  - *Checked:* Ran 11 board tests; scanned the client code for rule logic (`=== 12`, score maths, the number 6): only a comment matched.
  - *Decision:* ✅ Accepted; extended in P-031 and P-035.
  - *Changed or found:* None at the time.
  - *Alternatives not used:* Computing allowed buttons in the client: rejected, they come from `allowedActions`.
- **Validation:** 28 client tests pass (11 new in `Board.test.tsx`): scores and the single round score; buttons follow `allowedActions`, locked and finished states; roll uses alice's token and version 7 and renders the server answer; bob's token used when the server says it is his turn; BUST message; lock expiry triggers a re-read (fake timers); server error shown and state re-synced; New game; Change settings; waiting-for-bot. Typecheck, ESLint and production build pass. Rule scan of non-test client code (`=== 12`, score comparisons, arithmetic on scores, the number 6) found only one code comment.
- **Commit:** d2e0f72

### P-028 — Phase 4 step 5 (real-browser check and accessibility)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, validation
- **Requirements:** F1–F4, B7
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Started the API (seeded temporary database) and the Vite dev server, and drove the app in the built-in browser. Fixed two accessibility problems found by an automated scan: low text contrast on buttons in dark mode (new `--on-accent` colour variable) and `aria-label` on a plain `div` for the score (now visually hidden text). Stopped both servers and removed the temporary `.env` and database afterwards.
- **Review:**
  - *Checked:* Played a whole game through the real app with the real API; ran an automated accessibility scan (axe-core) in light and dark mode at phone and desktop widths.
  - *Decision:* ✏️ Accepted with a fix.
  - *Changed or found:* The scan found low button contrast in dark mode and an `aria-label` on a plain `div`; fixed with a colour variable and visually hidden text.
  - *Alternatives not used:* Running Lighthouse: not done, it needs a separate download; axe-core is the engine behind its accessibility audit, so there is no Lighthouse score to quote.
- **Validation:** Through the browser, against the real API via the Vite proxy: log in Player 1 (200) and Player 2; start a game to 10; played a whole game with real clicks (alice 11, bob 6): turns alternated, "🏆 alice wins!" shown, Roll/Hold disabled afterwards, alice's wins went 0 → 1, no error banner. axe-core (WCAG 2 A/AA + best practices): first run 1 serious violation (button contrast, 2 buttons) → fixed → 0 violations in dark mode and in light mode at 375 px wide, no horizontal scroll; one item "needs manual review" (colour contrast on the dice glyphs). 28 client + 116 server tests, typecheck, lint and the production build all pass after the fixes.
- **Commit:** d2e0f72

### P-029 — Phase 5 step 1 (bot strategy)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, step 2 of the plan (X3, strategy part)
- **Requirements:** X3
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `server/src/game/bot.ts`: `chooseAction(state, botId)` returns `'ROLL'` or `'HOLD'` from the game state alone. Rules: roll when the round score is 0; hold if holding wins; hold at a round score of 20; hold at 30 instead when the opponent is within 20 of winning and ahead. It only picks a move; the engine still validates and applies it. Added `bot.test.ts`.
- **Review:**
  - *Checked:* Read each strategy rule; ran 1000 seeded games where every bot move went through the real engine.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* Looking ahead with probabilities: rejected as more complex than needed.
  - *Open / limits:* The 94% win rate is against a deliberately simple opponent that holds with a 50% chance each step.
- **Validation:** 124 server tests pass (8 new): unit tests for every rule and both seats; a seeded simulation of 1000 bot-vs-random games, alternating who starts, where every move went through the real engine without a rejected move and every game finished. Bot win rate 94.0% (test requires > 60%). Lint and typecheck clean.
- **Commit:** 0c9e624

### P-030 — Phase 5 step 2 (bot plays inside the request)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, step 2 of the plan (X3, integration)
- **Requirements:** X3, B3, B5
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Refactored `GameService.act` into `applyAndSave` (one validated move: engine, save, win count, events) plus `playBotTurns`: after the human's move, while the current player is the bot, `chooseAction` picks a move and it goes through `applyAndSave` like any other move, all inside the same transaction. The bot's moves are returned in `events`. The 6&6 pause is for the human's screen, so a bot move is applied at the time the pause ends rather than being rejected. A 500-move guard stops an endless loop. `docs/api.md` notes this.
- **Review:**
  - *Checked:* Ran 7 bot tests over HTTP with fixed dice, including a human bust followed by a bot move, and an empty dice queue to prove the bot does not roll when the human wins.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* A separate bot-step endpoint: rejected (see P-013).
  - *Open / limits:* After a human bust the bot's next move clears the pause, so the UI must show the bust from the returned events, not from the lock.
- **Validation:** 131 server tests pass (7 new bot tests over HTTP with fixed dice): bot rolls 10, 20 and holds after the human holds; bot moves right after a human bust; bot bust hands back the turn with a pause; bot wins at 10, game ends, bot's win counted, human refused further moves; no bot dice used when the human wins (empty dice queue would throw); bot moves stored in the event log under the bot; outsiders cannot act. All 124 earlier tests still pass after the refactor. Lint and typecheck clean.
- **Commit:** 0c9e624

### P-031 — Phase 5 step 3 (UI: bot replay, double-six animation, history panel)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, steps 1, 3 and 4 of the plan (X3 UI, X4, X6)
- **Requirements:** X3, X4, X6, F2, F4
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Rewrote `client/src/Board.tsx`. When one request returns several moves (the bot answered), they are shown one at a time (800 ms apart) and the new scores appear after the last one; buttons stay off meanwhile. A double six shakes the dice and shows a red "Double six!" message (animation is switched off for users who prefer reduced motion). A History panel lists every move shown in the current game, newest first, and starts over for a new game. The message area now shows only the latest move. CSS added.
- **Review:**
  - *Checked:* Ran 3 replay and history tests with fake timers; played a bot game to 40 in the real browser.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* Computing intermediate scores in the client during the replay: rejected, it would put rules in the client.
  - *Open / limits:* History is kept in the browser and resets on reload. A double six did not occur in the live run; covered by a test only.
- **Validation:** 31 client tests pass (3 new replay/history tests with fake timers: moves shown one by one with the bot's score unchanged and buttons off until the end, then the final state; history order and content; history cleared on New game; the BUST test also checks the shake class). Lint, typecheck and build clean. Live check against the real API in the browser: a bot game to 40: the bot's moves were replayed, history reached 13 entries, the bot won 41 to 31 and the header showed "🏆 bot wins!", no error banner. A double six did not happen in that run (random), so it is covered by the test only. Servers stopped and the temporary `.env` and database removed.
- **Commit:** 0c9e624

### P-032 — Phase 5 step 4 (leaderboard panel)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, step 3 of the plan (X1 in the UI)
- **Requirements:** X1
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** Added `client/src/Leaderboard.tsx` (table of wins in the order the server sends, bot marked) and showed it below the board whenever someone is signed in. It reads the table again when a game ends. Table styles added.
- **Review:**
  - *Checked:* Ran 3 leaderboard tests; typecheck, lint and build.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* None.
  - *Alternatives not used:* Polling the leaderboard: rejected, it reloads when a game ends.
  - *Open / limits:* Not re-checked in the browser or with the accessibility scan.
- **Validation:** 34 client tests pass (3 new): rows and order from the server, token used, bot marked; refetch when the game's winner changes; error message shown. Typecheck, lint and build clean. Not re-checked in the browser (small, standard table; the axe scan from Phase 4 has not been repeated for it).
- **Commit:** 0c9e624

### P-033 — Phase 6 step 1 (Playwright smoke test)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 6, step 1
- **Requirements:** R1–R6, B7, F1–F3, X1
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `@playwright/test` (the package only; **no browser was downloaded**, the test uses the Chrome already installed via `channel: 'chrome'`). Added `playwright.config.ts` (starts the API with a throwaway database, seeded users and seeded dice, plus the Vite client) and `e2e/smoke.spec.ts`; `npm run e2e` runs it. To make runs repeatable the API accepts `DICE_SEED` (prints "TEST MODE" and uses `seededDice`); `seededDice` lives in `server/src/game/dice.ts` with 3 new tests, and `play-game.ts` now reuses it.
- **Review:**
  - *Checked:* Ran the test twice; confirmed it uses the installed Chrome and downloads nothing.
  - *Decision:* ✏️ Accepted with a fix.
  - *Changed or found:* The first version hung for 60 s: it clicked Hold after the server had already disabled it and Playwright waits for the button to be enabled. Fixed by trying each click with a short timeout inside a loop.
  - *Alternatives not used:* Downloading Playwright's own browser: rejected to save time and disk.
  - *Open / limits:* Not in CI.
- **Validation:** `npm run e2e` passes (2.6 s) on two consecutive runs: log in alice and bob, start a game to 10, play with real clicks until "alice wins!", Roll and Hold disabled, leaderboard shows exactly one player with 1 win. 134 server and 34 client tests, lint and the type check of the e2e files pass. No `.env` or database file is left behind (`*.db` is git-ignored).
- **Commit:** aceae10

### P-034 — Phase 6 step 2 (security pass)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 6, step 2
- **Requirements:** B1, B5, B6
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Ran the checks below and fixed what they found. New `server/src/config.ts` (`loadConfig`): the API now refuses to start if `JWT_SECRET` is missing, shorter than 16 characters or still the public example value from `.env.example`, and checks `PORT` and `DICE_SEED`. Unknown `/api/...` paths now return the standard JSON error (404 `NOT_FOUND`) instead of an HTML page. New `config.test.ts` (12 tests) and `security.test.ts` (9 tamper and error tests).
- **Review:**
  - *Checked:* Ran `npm audit`, scanned the whole git history for secrets, read every route, ran 9 tamper tests and live header, CORS and rate-limit checks.
  - *Decision:* ✏️ Accepted with a fix.
  - *Changed or found:* Real finding: copying `.env.example` unchanged gave a valid-looking public secret, so anyone could forge logins; the API now refuses to start with it. Unknown `/api` paths now return the JSON error shape.
  - *Alternatives not used:* A secrets scanner (gitleaks): not installed; grep over the history used instead.
  - *Open / limits:* Known limits in the README: stateless tokens, plain HTTP, rate limit only on login and register.
- **Validation:** `npm audit` (all dependencies): 0 vulnerabilities. Secret scan of the whole git history (added lines): only the placeholder in `.env.example`; `.env` and `*.db` never committed (0 commits touch them). Route review: every route except register/login is behind `requireAuth`, and every body and id is validated. Tamper tests pass: SQL-injection strings in login, register and game ids; extra body fields cannot set dice, scores, status, ids, wins or bot flag; `__proto__` payload harmless; the identity always comes from the token; forced server fault returns a generic 500 with no internals. Live server: unchanged `.env.example` refused to start; helmet headers present; an `Origin: http://evil.test` preflight is answered only with the allowed origin; after 30 bad logins the 31st gets 429. 153 server tests, 34 client tests and the e2e test pass.
- **Commit:** aceae10

### P-035 — Phase 6 step 3 (error UX and exploratory session)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 6, steps 3 and the manual exploratory check
- **Requirements:** F3, B5, B6
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Drove the real app in the browser (API and Vite running, temporary seeded database), found four UX problems and fixed each with a test. (1) A stored login the server rejects (expired, or the server was reset) kept showing "Signed in" with "Please log in" errors; now the API client tells the app, that player is signed out and a notice says "alice's login expired. Please sign in again." (2) With the API stopped, the Vite proxy's 502 page produced the vague "Request failed"; now "The server is not responding. Please try again in a moment." (3) A double click on Roll sent two requests and showed a scary "game changed" error (the server correctly applied only one); the board now ignores a second click while one is in flight. (4) A stale screen (another tab moved the game) showed "reload and try again" after the screen had already refreshed; the message now says the screen was updated. Also added a "Try again" button to the leaderboard error state.
- **Review:**
  - *Checked:* Stopped and restarted the API mid-game in the browser; double-clicked; made a screen go stale by moving the game from outside; sent the other player's token.
  - *Decision:* ✅ Accepted; four UX problems found and fixed.
  - *Changed or found:* (1) A rejected stored login stayed shown as signed in. (2) The API-down proxy page gave "Request failed". (3) A double click showed a scary error. (4) The stale-screen message said "reload" after the screen had refreshed. Plus a "Try again" button on the leaderboard. Verified the double-click test fails without its guard.
  - *Alternatives not used:* Leaving it to the server's own protection: rejected, the server was correct but the screen was confusing.
- **Validation:** Live in the browser: stopped the API mid-game → clear message, buttons stay usable, restarted the API → the next Roll worked and the game continued from the saved state. Double click (before the fix): exactly one roll applied, second rejected by the server; after the fix: one request, no error. Stale screen: another "tab" rolled via the API, then Roll in the old screen → rejected with STALE_VERSION and the screen showed the new round. Bob's token rolling on alice's turn → `NOT_YOUR_TURN`. Verified the double-click test fails when the guard is removed. 153 server and 41 client tests and the e2e test pass; typecheck and lint clean. Servers stopped and temporary `.env`/databases removed.
- **Commit:** aceae10

### P-036 — Phase 7 step 1 (concise README and one-command setup)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 7, step 1
- **Requirements:** documentation, all
- **Prompt (verbatim):**
  > do it but make the readme consice
- **Output summary:** Replaced the README skeleton with a 69-line README: rules in three lines, quick start, demo users, architecture sketch, the six assumptions, extras built and not built, test commands, a short requirement-to-proof table, known limits, and the AI-usage note. To make the quick start real, added `scripts/setup.mjs` (creates `.env` with a random JWT secret, seeds the demo users) and `scripts/dev.mjs` (runs API and app together), exposed as `npm run setup` and `npm run dev`; ESLint now knows the Node globals for those scripts.
- **Review:**
  - *Checked:* Ran the quick start in a copy without `node_modules`: install, setup, dev, login through the proxy, stop.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Shortened the plan's traceability table to five rows to keep the README brief; the full list is in the design document.
  - *Alternatives not used:* A longer README: rejected at the owner's request to keep it concise.
- **Validation:** In a fresh copy without `node_modules`: `npm install`, `npm run setup` (created `.env`, no example secret left, seeded alice/bob/bot), `npm run dev` → the app answered 200 on :5173 and a login through the proxy returned a token; stopping the dev script stopped both servers. 153 server and 41 client tests, typecheck and lint pass. Counts and commands in the README were checked against the repo.
- **Commit:** fcb6ac3

### P-041 — Check the directory is clean and remove bloat
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** After Phase 7 (final clean-up)
- **Requirements:** none (hygiene)
- **Prompt (verbatim):**
  > validate that the directory is clean and lets make sure that there is no bload in the project
- **Output summary:** Checked git status, ignored files on disk, tracked file sizes, every package's dependencies and scripts, and whether each exported symbol is used. Removed Vite template leftovers: `client/.oxlintrc.json`, the `oxlint` dependency and the client `lint` script (the root ESLint already lints the client), `client/.gitignore` (the root one covers it), and the 9.5 KB Vite logo `favicon.svg` (replaced by a 315-byte dice icon). Deleted generated files on disk (`server/e2e.db*`, `server/coverage`, `client/dist`, `test-results`). Added `*.log` to `.gitignore`.
- **Review:**
  - *Checked:* All 76 tracked files by size; every dependency against its use; every exported constant and type had at least one user besides its definition; no unused server, shared or client source files found.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* Only template leftovers and regenerable build output were bloat. Left in place on purpose: the owner's own `.env` and `server/dev.db` (both git-ignored), the plan and the docs (requested deliverables), `package-lock.json` (184 KB, normal).
  - *Alternatives not used:* Installing a dead-code tool such as `depcheck`: skipped to avoid a download; checked by hand.
  - *Open / limits:* The `shared` package has a `test` script but no tests; harmless.
- **Validation:** After the removals: lint, typecheck, 153 server and 41 client tests, client build, e2e smoke test (passes) and `npm audit` (0 vulnerabilities) all pass. `git status` shows only the intended changes; ignored files left are `.env` and `server/dev.db`.
- **Commit:** b28e7a2

### P-042 — Reopen the current game after a page reload
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** After Phase 7 (fix of a gap found while validating an answer)
- **Requirements:** F2, B7
- **Prompt (verbatim):**
  > Reload loses the game. A page reload drops the current game from the screen, and the game can't be reopened. The README doesn't say so. I can fix that and correct the README line.
  >
  > shouldn't this be fixed?
- **Output summary:** Added `client/src/savedGame.ts` (remembers the id of the game on screen in sessionStorage, guarded with try/catch). `App.tsx` now, on load, asks the server for that game (`GET /api/games/:id`) with each signed-in player's token in turn, shows "Reopening your game…" instead of the lobby while it loads, and shows the board again. An abandoned game is not reopened; a missing game or one the players cannot open falls back to the lobby and the saved id is forgotten; if the server is down the id is kept and a message says so. Leaving a game (Change settings, log out, expired login) forgets it. README known limits corrected. No server change was needed.
- **Review:**
  - *Checked:* The gap was found by checking my own earlier answer against the code (`useState` held the game, only logins were saved). After the fix, read `App.tsx` again for races and found one design flaw before testing: clearing the saved id from an effect would also have cleared it when the server was down; replaced with explicit clearing where a player really leaves.
  - *Decision:* ✅ Accepted.
  - *Changed or found:* The owner asked for the fix; it also removes the README understatement ("move history resets" hid that the whole game vanished).
  - *Alternatives not used:* Saving the whole game state in the browser (rejected: the server is the source of truth and a stale copy could be wrong); a "your games" list or join-by-id screen (rejected: more UI than the brief needs, and it would not make a second browser follow a game without also polling).
  - *Open / limits:* The history list starts empty after a reload. The saved id is per browser tab. Two browsers still do not follow the same game.
- **Validation:** 8 new App tests (49 client tests in total): game reopens with its scores and no flash of the lobby; Player 2's login is tried when Player 1 is not in the game; 404 falls back to the lobby and forgets the id; an abandoned game is not reopened; a finished game shows its winner; server down keeps the id and shows a message; nothing is requested when nobody is signed in; the id is saved on start and forgotten on Change settings and log out. Proved the tests fail when the restore line is disabled. In the real browser: started a game to 50, rolled twice (round 11), reloaded: same cards, same round score, Roll enabled; one more Roll worked (11 to 22, no error); Change settings cleared the saved id and showed the lobby. 153 server tests, 49 client tests, lint, typecheck, build and the e2e test pass; dev servers stopped.
- **Commit:** f22a6d1
