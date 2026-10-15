# AI Prompt Log

Every prompt sent to an AI tool during this project is recorded here **word for word**, together with how its output was reviewed and validated.
Process rules: see [PLAN.md §3](../PLAN.md#3-ai-usage-and-prompt-documentation-process).

## Entry template

```markdown
### P-### — <short title>
- **Date:** YYYY-MM-DD
- **Tool / model / effort:** e.g. Claude Code (Sonnet, low effort)
- **Phase / step:** e.g. Phase 1, step 2
- **Requirements:** e.g. R4, B5
- **Prompt (verbatim):**
  > ...
- **Context given:** files/attachments supplied with the prompt
- **Output summary:** what came back (files, commit SHA, no big code dumps)
- **Review:** ✅ accepted / ✏️ modified / ❌ rejected — and why
- **Validation:** exact test/command/manual check that proved it correct
- **Commit:** <sha> (commit body contains `AI: P-###`)
```

---

## Log

### P-001 — Project planning
- **Date:** 2026-10-15
- **Tool / model:** Claude Code desktop (Claude Opus 5.5)
- **Phase / step:** Phase 0, planning
- **Requirements:** all (R1–R8, B1–B7, F1–F4, X1–X6)
- **Prompt (verbatim):**
  > create a comprehensive plan for this task.
  > every step of this project should be explained and validated, every step and every ai prompt should be documented
- **Context given:** `roeto-home-assignment .pdf` (assignment brief, 3 pages)
- **Output summary:** `PLAN.md` (requirements breakdown with IDs, assumptions A1–A6, architecture, API design, 8 phases each with steps and validation gates, prompt-logging process, acceptance checklist, schedule, risks), plus this log file with its template.
- **Review:** _to fill in: did you change any decisions (stack, assumptions, scope of extras)?_
- **Validation:** _to fill in: check that every requirement in the PDF maps to an ID in PLAN.md §0 and to a row in §4._
- **Commit:** _to fill in_

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
- **Context given:** PLAN.md and docs/ai-prompts.md from P-001
- **Output summary:** Confirmed the folder exists. Created `roeto-dice-game/` inside it with `git init -b main` and a `.gitignore`, and moved PLAN.md and this log there. Added PLAN.md §3a (commit approval policy) and §3b (AI cost policy: model tiers, effort levels, token-saving habits). Added model/effort to the log template.
- **Review:** _to fill in_
- **Validation:** `git status` shows the repo on `main` with no commits yet; PLAN.md §3a/§3b exist.
- **Commit:** b2e0935

### P-003 — Start Phase 0 (substep-by-substep, Sonnet)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort — switched by the user via `/model`; verified with `get_session`)
- **Phase / step:** Phase 0, step 2
- **Requirements:** none (setup)
- **Prompt (verbatim):**
  > start, ask me before every substep
  > go, make sure i picked Sonnet, with effort set to Low.
- **Output summary:** Created the npm workspaces skeleton (`shared`, `server`, `client`), `tsconfig.base.json`, ESLint flat config, Prettier config; client generated with `npm create vite` (react-ts); dev tools installed (eslint, typescript-eslint, prettier, vitest, typescript).
- **Review:** _to fill in_
- **Validation:** `npm run lint`, `npm run typecheck` and `npm test` all pass (no tests yet; `--passWithNoTests`).
- **Commit:** b2e0935

### P-004 — Phase 0 substep 0.3 (docs skeleton)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 3
- **Requirements:** none (docs)
- **Prompt (verbatim):**
  > Yes, 0.3
- **Output summary:** Added `README.md` skeleton and `docs/decisions/0001-architecture.md`.
- **Review:** _to fill in_
- **Validation:** Files exist; ADR content matches PLAN.md §1.
- **Commit:** b2e0935

### P-005 — Phase 0 substep 0.4 (CI workflow)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 4
- **Requirements:** none (process)
- **Prompt (verbatim):**
  > Yes, 0.4
- **Output summary:** Added `.github/workflows/ci.yml` running `npm ci`, lint, typecheck and test on every push and PR (Node 22).
- **Review:** _to fill in_
- **Validation:** Same three commands pass locally; the workflow itself can only be checked once the repo is pushed to GitHub (no remote yet).
- **Commit:** b2e0935

### P-006 — Phase 0 substep 0.5 (.env.example)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 0, step 5
- **Requirements:** none (setup)
- **Prompt (verbatim):**
  > Yes, 0.5
- **Output summary:** Added `.env.example` with `PORT`, `DATABASE_URL`, `JWT_SECRET` (placeholder) and `CLIENT_ORIGIN`. `.env` is already in `.gitignore`.
- **Review:** _to fill in_
- **Validation:** `git check-ignore .env` confirms `.env` is ignored; no real secret in the file.
- **Commit:** b2e0935

### P-007 — Commit log SHA; Phase 1 step 1 (shared types)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 1
- **Requirements:** R1–R8, B3, B5 (types only)
- **Prompt (verbatim):**
  > Commit the log update with the message "docs: record phase 0 commit sha", then ask me before starting Phase 1 substep 1.
  > (follow-up answer) Yes, go ahead
- **Output summary:** Committed 7479a83. Added `shared/src/game.ts` (GameState, Action, GameError codes, Result, DiceRoller, GameEvent) and exported it from `shared/src/index.ts`.
- **Review:** _to fill in_
- **Validation:** `npm run typecheck` and `npm run lint` (below).
- **Commit:** 7266b51

### P-008 — Phase 1 step 2 (failing engine tests first)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 2
- **Requirements:** R1–R7, B5, A1, A2, X4
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added `server/src/game/engine.test.ts` (26 tests: createGame/R7, ROLL/R3, 6&6 + action lock/R4+X4, HOLD/R5+A2, winning/R6+A1, validation/B5) and a stub `engine.ts` whose functions throw "not implemented". API decided: `createGame(id, [A,B], winningScore?)` and `applyAction(state, action, actorId, dice, now?)`, both returning `Result`.
- **Review:** _to fill in_
- **Validation:** `npm test --workspace @dice/server` → 26 failed / 26 (expected: tests are red before implementation).
- **Commit:** 7266b51

### P-009 — Phase 1 step 3 (implement engine)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 3
- **Requirements:** R1–R7, B3, B5, X4
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Implemented `server/src/game/engine.ts`: `createGame` (winning score 10–1000, default 100) and pure `applyAction` (check order: game active → is a player → is their turn → not locked → ROLL/HOLD). 6&6 sets a 1500 ms lock. Winner keeps the turn marker; no further actions accepted. Input state is cloned, never mutated.
- **Review:** _to fill in_
- **Validation:** `npm test --workspace @dice/server` → 26 passed; lint and typecheck clean.
- **Commit:** b32373a

### P-010 — Phase 1 step 4 (property-based tests)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 4
- **Requirements:** R3–R6, B5
- **Prompt (verbatim):**
  > Yes, step 4. First commit the pending log SHA line with the message "docs: record engine commit sha" only after I approve; ask me about that at the end of step 4.
- **Output summary:** Added dev dependency `fast-check` and `server/src/game/engine.property.test.ts`: 1000 random games (winning score 10–200, up to 200 random actions from alice/bob/an outsider). Invariants: scores never negative; round score is 0 whenever the turn changes; version +1 per accepted action; total of global scores equals total of HOLD deltas; at most one WIN; a finished game accepts nothing; the winner has reached the winning score and nobody else has.
- **Review:** _to fill in. Self-found slip: first draft asserted on `r.value` inside the error branch (type error); changed to check the error code._
- **Validation:** `npm test --workspace @dice/server` → 27 passed; lint and typecheck clean.
- **Commit:** 77c5a27

### P-011 — Phase 1 step 5 (seeded game script)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, step 5
- **Requirements:** R1–R6 (manual check)
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Added `server/src/scripts/play-game.ts` (seeded mulberry32 dice, simple "hold at 15" player, prints every event) and the script `npm run play-game --workspace @dice/server -- [seed] [winningScore]`. No new dependencies: Node runs the TypeScript file directly; `allowImportingTsExtensions` added to `tsconfig.base.json`.
- **Review:** _to fill in: read the printed log and confirm it matches the rules._
- **Validation:** Ran with seed 7, winning score 30. Log read by hand: round scores add up, HOLD banks the round score and passes the turn, alice wins on the hold that reaches 40 ≥ 30, no actions after WIN. Lint and typecheck clean.
- **Commit:** _not committed yet_

### P-012 — Phase 1 validation gate
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 1, validation checklist
- **Requirements:** B3 (rules in one pure place)
- **Prompt (verbatim):**
  > Not yet
  > continue
- **Output summary:** Added dev dependency `@vitest/coverage-v8` and script `test:coverage` (fails below 100% lines/branches on `engine.ts`). Added an ESLint `no-restricted-imports` rule for `server/src/game/engine.ts` blocking express, prisma, fs, node:* and http(s).
- **Review:** _to fill in_
- **Validation:** Coverage: 100% statements/branches/functions/lines (29/29 branches). Negative test: temporarily adding `import fs from 'node:fs'` to the engine made ESLint fail; reverted (no diff on engine.ts). Property test ran 1000 games; seed-7 game log read by hand (P-011). Lint, typecheck and all 27 tests pass.
- **Commit:** _not committed yet_

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
  > SHA logging: "explain this" → then "(a) Fill SHAs at the end"
  > Delivery: "Local repo + README only"
  > E2E: "One smoke test"; Bot turn: "Inside the same request"
- **Output summary:** Committed Phase 1 remainder as 34fde56. Updated PLAN.md: commit once per phase; DB is built-in `node:sqlite` with a schema.sql file instead of Prisma; extras X1–X4 plus the event-history panel (no sound, no deploy); one Playwright smoke test; the bot turn runs in the same request; game start flow (WAITING exists only in the service; engine starts on join); Phase 0/1 checklists ticked; CI check deferred until you push.
- **Review:** _to fill in_
- **Validation:** `node:sqlite` checked on Node 26.11.1: a stale `UPDATE … WHERE version = ?` changes 0 rows. grep shows no remaining Prisma / sound / multi-test Playwright references in PLAN.md.
- **Commit:** Phase 2 commit

### P-014 — Phase 2 step 1 (SQL schema and database opener)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort; user switched via `/model`)
- **Phase / step:** Phase 2, step 1
- **Requirements:** B2, B4, X1, X2
- **Prompt (verbatim):**
  > Yes, start Phase 2 step 1.
- **Output summary:** Added `server/src/db/schema.sql` (users, games, game_players, game_events with CHECK constraints, foreign keys, case-insensitive unique usernames), `server/src/db/db.ts` (`openDb(path)` applies the schema, foreign keys on, WAL), and `db.test.ts` (5 tests).
- **Review:** _to fill in_
- **Validation:** 32 tests pass (27 engine + 5 db): schema idempotent, duplicate username (case-insensitive) rejected, bad status rejected, foreign key enforced, stale versioned update changes 0 rows. Lint clean.
- **Commit:** Phase 2 commit

### P-015 — Phase 2 step 2 (register and login)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 2
- **Requirements:** B1, B2
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added dependencies express 5, zod, bcryptjs, jsonwebtoken (+ supertest and types for dev). New files: `server/src/app.ts` (`createApp`), `http/auth.ts` (register/login, zod validation, bcrypt cost 10, JWT 24 h), `http/errors.ts` (`ApiError` + central handler returning `{error:{code,message}}`), `http/auth.test.ts` (13 tests). Deviation from plan: **bcryptjs** (pure JavaScript) instead of native bcrypt, to avoid a native build step on new Node versions.
- **Review:** _to fill in. Self-found slip: first draft used an invalid dummy hash for unknown users, so the "same work" claim was false (bcrypt returns instantly on a malformed hash); replaced with a real hash computed at startup._
- **Validation:** 45 tests pass: duplicate username (case-insensitive) → 409; weak/empty/invalid input → 400; malformed JSON → 400; stored value is a bcrypt hash and not the password; wrong password and unknown user return identical 401 bodies. Lint and typecheck clean.
- **Commit:** Phase 2 commit

### P-016 — Phase 2 step 3 (requireAuth middleware and /auth/me)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 3
- **Requirements:** B1, B6
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Added `server/src/http/requireAuth.ts` (reads Bearer token, verifies HS256 signature and expiry, loads the user from the database, sets `req.user`; every failure is 401 `UNAUTHENTICATED`) and `GET /api/auth/me`. Added `requireAuth.test.ts` (11 tests).
- **Review:** _to fill in_
- **Validation:** 56 tests pass. Rejected: missing token, malformed headers, expired token, wrong secret, `alg: none` token, valid token for a deleted user. Lint and typecheck clean.
- **Commit:** Phase 2 commit

### P-017 — Phase 2 step 4 (seed script)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 4
- **Requirements:** B2, X3 (bot user)
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** Added `server/src/db/seed.ts` (`seed(db, demoPassword)`: alice, bob and the bot; idempotent; bot gets a random thrown-away password), `scripts/seed.ts`, `seed.test.ts` (3 tests), scripts `npm run seed` / `npm run db:reset` for the server workspace. `.env.example` now uses `DATABASE_PATH` (no Prisma URL) and adds `DEMO_PASSWORD`. `.gitignore` also ignores SQLite `-wal`/`-shm` files.
- **Review:** _to fill in_
- **Validation:** 59 tests pass. By hand: with `.env` copied from `.env.example`, `db:reset` then `seed` printed "alice, bob, bot", and a second `seed` run also succeeded (idempotent); the temporary `.env` and `dev.db` were removed afterwards. Lint and typecheck clean.
- **Commit:** Phase 2 commit

### P-018 — Phase 2 step 5 (hardening and server entry)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 2, step 5 (plan item 6)
- **Requirements:** B1, B6
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Added `helmet`, `cors` (single allowed origin), `express-rate-limit` (login/register only, configurable) and a 10 kb body limit to `createApp`; added `server/src/index.ts` (starts the API from env) and `npm run start`. Added `hardening.test.ts` (5 tests). Error handler now maps oversized bodies to 413 `PAYLOAD_TOO_LARGE`.
- **Review:** _to fill in. Two issues found while validating, both fixed: (1) an oversized body returned 500 instead of 413 (real bug, caught by a test); (2) a live server run showed Node's built-in TypeScript mode rejects constructor parameter properties in `ApiError`, which Vitest had accepted. Rewrote the class and added `erasableSyntaxOnly` to `tsconfig.base.json` so typecheck catches this from now on. My first CORS test was also wrong (the header names the allowed origin; the browser does the blocking) and was corrected._
- **Validation:** 64 tests pass; lint and typecheck clean. Live check: started the real server with a temporary `.env`, seeded the DB, `POST /api/auth/login` as alice returned a token and `GET /api/auth/me` without a token returned 401. The temporary `.env` and `dev.db` were removed.
- **Commit:** Phase 2 commit

### P-019 — Phase 3 step 1 (GameService)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, step 1
- **Requirements:** B3, B4, B5, R7, X3 (bot game start)
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `GameView` to `shared/src/game.ts` (what the API returns: usernames, wins, `currentPlayerId`, `allowedActions`, `lockRemainingMs`, `version`; the client renders it and computes nothing). Added `server/src/game/dice.ts` (`secureDice` using `crypto.randomInt`) and `server/src/game/service.ts` with `create`, `join`, `get` and `act`. Each write runs in a `BEGIN IMMEDIATE` transaction, loads the game, calls the pure engine, saves with a conditional `UPDATE … WHERE version = ?`, and appends `game_events`. Engine error codes map to HTTP statuses (403/409/423/422/400). `newGame`, win counting and the HTTP routes are left for steps 2–5.
- **Review:** _to fill in_
- **Validation:** 80 tests pass (16 new in `service.test.ts`): waiting/started/bot games, bad winning scores, own/full/unknown game joins, outsider read and act blocked, roll and hold persisted with events, 6&6 lock with a fake clock, stale `expectedVersion` rejected without rolling dice, and a forced mid-transaction failure rolled back completely. Lint and typecheck clean.
- **Commit:** Phase 3 commit

### P-020 — Phase 3 step 2 (game HTTP routes)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, step 2
- **Requirements:** B3–B6, R7
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added `server/src/http/games.ts`: `POST /api/games`, `GET /api/games/:id`, `POST /api/games/:id/join`, `POST /api/games/:id/roll`, `POST /api/games/:id/hold`, all behind `requireAuth`, with zod-validated bodies and params. `createApp` now builds the `GameService` and accepts injectable `dice` and `now` (used by tests). Responses are `{ game }` or `{ game, events }`. `POST /:id/new` and the leaderboard are still to come.
- **Review:** _to fill in_
- **Validation:** 103 tests pass (23 new in `games.test.ts`, through real HTTP with supertest): every game route → 401 without a token; create/join; bot game; winning scores `0`, `-5`, `10001`, `12.5` → 400 `INVALID_WINNING_SCORE`, `"abc"` and bad opponent → 400 `VALIDATION_ERROR`; outsider read and act → 403 `NOT_A_PLAYER`; wrong player → 403 `NOT_YOUR_TURN`; hold with nothing → 422; 6&6 → 423 then success after the lock; stale `expectedVersion` → 409; finished game → 409 for both players and both actions. Lint and typecheck clean.
- **Commit:** Phase 3 commit

### P-021 — Phase 3 step 3 (membership review and "new game")
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, steps 3–4 of the plan (membership checks, `new` route)
- **Requirements:** R8, B5
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Reviewed membership checks: `get`, `act` and `newGame` all call `requireMember`; `join` is the only action open to a non-member, and only on a `WAITING` game. Added `GameService.newGame` and `POST /api/games/:id/new`: an in-progress game becomes `ABANDONED` (with an `ABANDON` event, no winner), a finished game stays finished, and a fresh game starts with the same players, seat order and winning score. Added `'ABANDON'` to the shared event type. PLAN.md assumption A3 updated with these details.
- **Review:** _to fill in_
- **Validation:** 109 tests pass (6 new): either player can restart; old game shows `ABANDONED` and rejects actions with 409; works during a 6&6 lock; finished game stays `FINISHED`; bot game restarts against the bot; outsider → 403, waiting game → 409, stale version → 409, second restart of the same game → 409; unauthenticated → 401. Lint and typecheck clean.
- **Commit:** Phase 3 commit

### P-022 — Phase 3 step 4 (win counting and leaderboard)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, steps 5–6 of the plan
- **Requirements:** X1, R6
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** `GameService.act` now adds one win to the winner inside the same transaction as the deciding hold. Added `GameService.leaderboard()` and `GET /api/leaderboard` (login required, most wins first, bot included and flagged).
- **Review:** _to fill in_
- **Validation:** 115 tests pass (6 new): leaderboard needs login; winner +1, loser +0; no extra win for actions after the game ends or for restarting; wins across several games rank correctly; an abandoned game gives nobody a win; and the plan's scripted game with brand-new users (register → create → join → play incl. a 6&6 → win) ends with `wins` = 1 for the winner. Lint clean.
- **Commit:** Phase 3 commit

### P-023 — Phase 3 step 5 (API docs, concurrency test, curl walkthrough)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 3, step 6 and validation
- **Requirements:** B4, B5
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Wrote `docs/api.md` (endpoint table, the `game` object, error codes, curl walkthrough). Added a test that fires two rolls at once with the same `expectedVersion`.
- **Review:** _to fill in_
- **Validation:** 116 tests pass; lint and typecheck clean. Concurrency test: exactly one 200 and one 409, and only one roll's dice were used. Walkthrough: extracted the bash block from `docs/api.md` and ran it unchanged against the real server (seeded temporary database): printed `IN_PROGRESS`, `NOT_YOUR_TURN`, a round score, the same score banked, `UNAUTHENTICATED`, `IN_PROGRESS`, `3` — twice, with the same pattern. The temporary `.env` and database were removed. Note: with random dice a 6&6 on the roll (1 in 36) would pass the turn and the hold line would print the previous score instead.
- **Commit:** Phase 3 commit

### P-024 — Phase 4 step 1 (client setup and typed API client)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, step 1
- **Requirements:** F1, F3, F4
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `@tanstack/react-query` to the client. Removed the Vite template demo (assets, CSS, demo `App.tsx`). Added `shared/src/api.ts` (response types shared by server and client), `client/src/api/client.ts` (one function per API call, bearer token passed in, errors turned into an `ApiError` with `status` and `code`), `client.test.ts` (5 tests), a Vite dev proxy from `/api` to `localhost:3000`, and a `QueryClientProvider` in `main.tsx`. `App.tsx` is a placeholder until step 2.
- **Review:** _to fill in_
- **Validation:** 116 server + 5 client tests pass; `tsc` typecheck and ESLint clean; `npm run build -w @dice/client` produces a bundle. The client tests check the Authorization header, JSON body, error mapping, a non-JSON error and a network failure.
- **Commit:** Phase 4 commit

### P-025 — Phase 4 step 2 (two-player login panels)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, step 2
- **Requirements:** F1, B7
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Added React Testing Library, user-event and jsdom as client dev dependencies; Vitest now runs the client in jsdom. New: `session.ts` (`useSessions`: two independent logins, "p1" and "p2", kept in React state and mirrored to sessionStorage inside try/catch), `AuthPanel.tsx` (login / register / log out, loading state, `role="alert"` error, labelled inputs), `App.tsx` (two panels side by side, one column on narrow screens), `index.css` (light and dark theme variables).
- **Review:** _to fill in_
- **Validation:** 6 new component tests (11 client tests in total, all pass): both forms shown; signing one player in leaves the other alone; the server's error message is shown on a failed login; register mode; log out; both logins survive a remount and "Both players are signed in." appears. Typecheck and ESLint clean. Not yet checked in a real browser (planned at the end of Phase 4).
- **Commit:** Phase 4 commit

### P-026 — Phase 4 step 3 (lobby)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, step 3
- **Requirements:** R7, R1, F3, F4
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Added `client/src/Lobby.tsx`: winning-score box, opponent choice (Player 2 or Bot) and a Start button. Start calls `createGame` with Player 1's token and, for a human opponent, `joinGame` with Player 2's token. `App.tsx` shows the lobby once Player 1 is signed in and keeps the started game in state (a one-line summary until the board arrives in step 4); logging out clears the game. Small lobby styles added.
- **Review:** _to fill in. Design choice: the client does not check the winning-score range (no `min`/`max`); the server's message is shown instead, so that rule lives in one place. An empty box sends nothing and the server default (100) applies. Known limit: if joining fails after creating, a waiting game is left behind on the server._
- **Validation:** 17 client tests pass (6 new in `Lobby.test.tsx`): hidden until Player 1 is in; create with P1's token then join with P2's token; typed score sent as a number; bot game = one call, no join, works without Player 2; Start disabled while a human opponent is missing; server error text shown and game not started. One test caught a real slip: `onSuccess` passed React Query's extra arguments on to the caller; fixed by wrapping. Typecheck and ESLint clean.
- **Commit:** Phase 4 commit

### P-027 — Phase 4 step 4 (game board)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, steps 4–7 of the plan (board, token routing, rendering rule, errors and pending states)
- **Requirements:** F2, F3, F4, X4 (message), B7
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** Added `client/src/Board.tsx` and wired it into `App.tsx`. It shows two player cards (total, wins, round score for the active player only, active highlight via `aria-current`), the last dice as Unicode faces, event messages (roll, double six, hold, win), Roll / Hold / New game / Change settings buttons, and an error banner. Buttons are enabled only from the server's `allowedActions`. Each action uses the token of the player the server names in `currentPlayerId`; New game uses any member's token. Requests send the game `version` and the buttons are disabled while a request is in flight. After a server error it re-reads the game. After a 6&6 it asks the server again once `lockRemainingMs` has passed. If the current player has no token on this page (the bot) it says "Waiting for …". Board styles added.
- **Review:** _to fill in. Not done here: the bot's moves (Phase 5), a roll animation, and the event-history panel (Phase 5)._
- **Validation:** 28 client tests pass (11 new in `Board.test.tsx`): scores and the single round score; buttons follow `allowedActions`, locked and finished states; roll uses alice's token and version 7 and renders the server answer; bob's token used when the server says it is his turn; BUST message; lock expiry triggers a re-read (fake timers); server error shown and state re-synced; New game; Change settings; waiting-for-bot. Typecheck, ESLint and production build pass. Rule scan of non-test client code (`=== 12`, score comparisons, arithmetic on scores, the number 6) found only one code comment.
- **Commit:** Phase 4 commit

### P-028 — Phase 4 step 5 (real-browser check and accessibility)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 4, validation
- **Requirements:** F1–F4, B7
- **Prompt (verbatim):**
  > Yes, step 5
- **Output summary:** Started the API (seeded temporary database) and the Vite dev server, and drove the app in the built-in browser. Fixed two accessibility problems found by an automated scan: low text contrast on buttons in dark mode (new `--on-accent` colour variable) and `aria-label` on a plain `div` for the score (now visually hidden text). Stopped both servers and removed the temporary `.env` and database afterwards.
- **Review:** _to fill in. Lighthouse itself was not run (it needs a separate download); the axe-core engine that Lighthouse's accessibility audit is built on was used instead, so there is no Lighthouse score to quote._
- **Validation:** Through the browser, against the real API via the Vite proxy: log in Player 1 (200) and Player 2; start a game to 10; played a whole game with real clicks (alice 11, bob 6): turns alternated, "🏆 alice wins!" shown, Roll/Hold disabled afterwards, alice's wins went 0 → 1, no error banner. axe-core (WCAG 2 A/AA + best practices): first run 1 serious violation (button contrast, 2 buttons) → fixed → 0 violations in dark mode and in light mode at 375 px wide, no horizontal scroll; one item "needs manual review" (colour contrast on the dice glyphs). 28 client + 116 server tests, typecheck, lint and the production build all pass after the fixes.
- **Commit:** Phase 4 commit

### P-029 — Phase 5 step 1 (bot strategy)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, step 2 of the plan (X3, strategy part)
- **Requirements:** X3
- **Prompt (verbatim):**
  > Yes, step 1
- **Output summary:** Added `server/src/game/bot.ts`: `chooseAction(state, botId)` returns `'ROLL'` or `'HOLD'` from the game state alone. Rules: roll when the round score is 0; hold if holding wins; hold at a round score of 20; hold at 30 instead when the opponent is within 20 of winning and ahead. It only picks a move; the engine still validates and applies it. Added `bot.test.ts`.
- **Review:** _to fill in. Note: the simulation opponent is deliberately simple (holds with a 50% chance each step), so the high win rate shows the bot is sensible, not that it is strong. The 20/30 thresholds are my choice, not tuned._
- **Validation:** 124 server tests pass (8 new): unit tests for every rule and both seats; a seeded simulation of 1000 bot-vs-random games, alternating who starts, where every move went through the real engine without a rejected move and every game finished. Bot win rate 94.0% (test requires > 60%). Lint and typecheck clean.
- **Commit:** Phase 5 commit

### P-030 — Phase 5 step 2 (bot plays inside the request)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, step 2 of the plan (X3, integration)
- **Requirements:** X3, B3, B5
- **Prompt (verbatim):**
  > Yes, step 2
- **Output summary:** Refactored `GameService.act` into `applyAndSave` (one validated move: engine, save, win count, events) plus `playBotTurns`: after the human's move, while the current player is the bot, `chooseAction` picks a move and it goes through `applyAndSave` like any other move, all inside the same transaction. The bot's moves are returned in `events`. The 6&6 pause is for the human's screen, so a bot move is applied at the time the pause ends rather than being rejected. A 500-move guard stops an endless loop. `docs/api.md` notes this.
- **Review:** _to fill in. Design consequence: after a human bust, the bot's following move clears the pause, so the UI must show the bust from the returned events, not from the lock._
- **Validation:** 131 server tests pass (7 new bot tests over HTTP with fixed dice): bot rolls 10, 20 and holds after the human holds; bot moves right after a human bust; bot bust hands back the turn with a pause; bot wins at 10, game ends, bot's win counted, human refused further moves; no bot dice used when the human wins (empty dice queue would throw); bot moves stored in the event log under the bot; outsiders cannot act. All 124 earlier tests still pass after the refactor. Lint and typecheck clean.
- **Commit:** Phase 5 commit

### P-031 — Phase 5 step 3 (UI: bot replay, double-six animation, history panel)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, steps 1, 3 and 4 of the plan (X3 UI, X4, X6)
- **Requirements:** X3, X4, X6, F2, F4
- **Prompt (verbatim):**
  > Yes, step 3
- **Output summary:** Rewrote `client/src/Board.tsx`. When one request returns several moves (the bot answered), they are shown one at a time (800 ms apart) and the new scores appear after the last one; buttons stay off meanwhile. A double six shakes the dice and shows a red "Double six!" message (animation is switched off for users who prefer reduced motion). A History panel lists every move shown in the current game, newest first, and starts over for a new game. The message area now shows only the latest move. CSS added.
- **Review:** _to fill in. Known limits: history is kept in the browser, so a page reload clears it; during a replay the scores still show the old values until the end, because working out intermediate scores would put rules in the client._
- **Validation:** 31 client tests pass (3 new replay/history tests with fake timers: moves shown one by one with the bot's score unchanged and buttons off until the end, then the final state; history order and content; history cleared on New game; the BUST test also checks the shake class). Lint, typecheck and build clean. Live check against the real API in the browser: a bot game to 40: the bot's moves were replayed, history reached 13 entries, the bot won 41 to 31 and the header showed "🏆 bot wins!", no error banner. A double six did not happen in that run (random), so it is covered by the test only. Servers stopped and the temporary `.env` and database removed.
- **Commit:** Phase 5 commit

### P-032 — Phase 5 step 4 (leaderboard panel)
- **Date:** 2026-10-15
- **Tool / model / effort:** Claude Code desktop (Sonnet 5.5, low effort)
- **Phase / step:** Phase 5, step 3 of the plan (X1 in the UI)
- **Requirements:** X1
- **Prompt (verbatim):**
  > Yes, step 4
- **Output summary:** Added `client/src/Leaderboard.tsx` (table of wins in the order the server sends, bot marked) and showed it below the board whenever someone is signed in. It reads the table again when a game ends. Table styles added.
- **Review:** _to fill in_
- **Validation:** 34 client tests pass (3 new): rows and order from the server, token used, bot marked; refetch when the game's winner changes; error message shown. Typecheck, lint and build clean. Not re-checked in the browser (small, standard table; the axe scan from Phase 4 has not been repeated for it).
- **Commit:** Phase 5 commit
