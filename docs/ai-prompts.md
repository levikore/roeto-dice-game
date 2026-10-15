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
