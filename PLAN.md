# Roeto Home Assignment — Dice Game: Project Plan

> Two-player dice game. **All game logic lives in an authenticated backend API**; a React frontend only shows state and calls the API.
> Every phase below lists **what** is done, **why**, **how it is validated** (exit criteria), and **which AI prompts are logged**.
> All AI prompts go in [docs/ai-prompts.md](docs/ai-prompts.md) using the template defined there.

---

## 0. Requirements breakdown (from the brief)

Each requirement gets an ID. Every test, commit and prompt-log entry refers back to these IDs, so you can trace from requirement → code → test.

### Game rules
| ID | Requirement |
|----|-------------|
| R1 | 2 players, playing in turns/rounds |
| R2 | On their turn a player rolls 2 dice as many times as they want |
| R3 | Each roll adds (sum of both dice) to the **round score** |
| R4 | Rolling 6 & 6 → the round score is lost and the turn passes |
| R5 | Hold → round score added to **global score**, turn passes |
| R6 | First player to reach the winning score wins |
| R7 | Players can set the winning score (default 100) |
| R8 | A player can start a new game at any time |

### Backend
| ID | Requirement |
|----|-------------|
| B1 | API with authentication |
| B2 | Manages player identities |
| B3 | Enforces all game rules |
| B4 | Manages game state |
| B5 | Validates turns and actions (only the current player can act, only valid actions) |
| B6 | Only authenticated users can create and play games |
| B7 | Users are simulated on the same page (no realtime sync between browsers) |

### Frontend
| ID | Requirement |
|----|-------------|
| F1 | React app that authenticates the user(s) |
| F2 | Displays game state |
| F3 | Calls the API for every action (roll, hold, new game) |
| F4 | **No game logic in the frontend** |

### Optional extras (in priority order)
| ID | Extra | Plan |
|----|-------|------|
| X1 | Track wins per player | Yes — `wins` stored on the user |
| X2 | Persist data | Yes — SQLite database |
| X4 | Lock actions briefly and show a message on 6 & 6 | Yes — enforced by the server, animated in the UI |
| X3 | AI opponent | Yes, if time allows — the bot runs on the server |
| X5 | Sound effects | **Not built** (decided 2026-10-15 to save usage) |
| X6 | Creative additions | Event-history panel only (it reuses the existing event log) |

### Unclear rules: my reading (written down so reviewers can see the reasoning)
| # | Question | Decision |
|---|----------|----------|
| A1 | Is the win checked after every roll or only on Hold? | **Only on Hold.** Points count only once they are banked into the global score. |
| A2 | Can a player Hold with a round score of 0? | **No** → `422 NOTHING_TO_HOLD`. A 0-point hold is just a way to skip a turn. |
| A3 | Who can start a new game? | Either player in the game, at any time. The old game is marked `ABANDONED` and nobody wins it. A finished game is left as it is. The new game keeps the same players, seat order and winning score. Not allowed on a game still `WAITING` for its second player. |
| A4 | What winning scores are allowed? | Whole numbers from 10 to 1000, default 100. |
| A5 | How do two users "share the same page"? | Both players log in on one screen. The client keeps **one token per player** and sends the current player's token for each action. The server checks that the token's user is the player whose turn it is. |
| A6 | Does a single 6 do anything? | No. Only a 6 & 6 roll ends the turn. |

> ✅ **Validation:** if you can, send A1–A6 to the recruiter as a short clarification email (the brief invites questions). Otherwise, list them in the README under "Assumptions".

---

## 1. Architecture and tech choices

| Layer | Choice | Why |
|-------|--------|-----|
| Language | TypeScript everywhere | Types are shared between API and client; catches errors at compile time |
| Repo | npm workspaces monorepo: `server/`, `client/`, `shared/` | One clone, one install, shared API types |
| Backend | Node 22.13+ (developed on 26) + Express 5 | Common and easy for reviewers to read |
| Validation | Zod | One schema serves as both runtime validation and the TS type |
| Auth | Username + password, bcrypt hashing, JWT access token (Bearer) | Stateless, simple, and fits "multiple users on one page" |
| DB | SQLite via Node's built-in `node:sqlite` | No dependency and no code generation step. The brief needs only one machine with users simulated on one page (B7), so an embedded file database is enough. Covers X2. Checked on Node 26: a conditional `UPDATE … WHERE version = ?` changes 0 rows on a stale write, so the version check works. |
| Randomness | `crypto.randomInt` behind an injectable `DiceRoller` interface | Fair dice in production, fixed dice in tests |
| Frontend | React 19 + Vite + TanStack Query | Server state managed cleanly, no client-side game logic |
| Tests | Vitest (unit), Supertest (API), React Testing Library (UI), Playwright (one E2E smoke test) | Covers every layer |
| Quality | ESLint, Prettier, `tsc --noEmit`, GitHub Actions CI | Every commit is checked automatically |

### Main design rule: a pure game engine
```
server/src/game/engine.ts
  applyAction(state: GameState, action: Action, actorId: string, dice: DiceRoller): Result<GameState, GameError>
```
- No I/O and no framework code. All of R1–R8 is a pure function of (state, action).
- HTTP routes only handle **auth → load → engine → save → respond**.
- This makes the rules easy to unit-test and to show to reviewers.

### Domain model
```
User   { id, username, passwordHash, wins, isBot, createdAt }
Game   { id, status: WAITING | IN_PROGRESS | FINISHED | ABANDONED,
         winningScore, currentPlayerIndex, roundScore, version,
         winnerId?, lockedUntil?, createdAt, updatedAt }
GamePlayer { gameId, userId, seat (0|1), globalScore }
GameEvent  { id, gameId, userId, type: ROLL|HOLD|BUST|WIN|ABANDON, dice?, scoreDelta, createdAt }
```
- `version` → optimistic concurrency. The client sends `expectedVersion`; a stale request gets `409`. This stops a double-click from rolling twice.
- **Game start flow:** `POST /games` saves the game as `WAITING` with only the creator. `POST /games/:id/join` with the second player's token calls `createGame` in the engine and the game becomes `IN_PROGRESS`. So the engine never sees `WAITING`; that state exists only in the service layer. A bot game skips the join step.
- `GameEvent` → an audit log. It drives the history panel and makes any game replayable for debugging.

### API (REST, all JSON)
| Method | Path | Auth | Purpose | Requirements |
|--------|------|------|---------|--------------|
| POST | `/api/auth/register` | – | Create a user | B2 |
| POST | `/api/auth/login` | – | Get a JWT | B1 |
| GET  | `/api/auth/me` | ✔ | Current user and wins | B2, X1 |
| POST | `/api/games` | ✔ | Create a game `{ winningScore?, opponent: "human" \| "bot" }` | R7, B6, X3 |
| POST | `/api/games/:id/join` | ✔ | Second player joins | R1, B6 |
| GET  | `/api/games/:id` | ✔ (players only) | Game state | B4, F2 |
| POST | `/api/games/:id/roll` | ✔ (current player) | Roll | R2–R4, B5 |
| POST | `/api/games/:id/hold` | ✔ (current player) | Hold | R5, R6, B5 |
| POST | `/api/games/:id/new` | ✔ (either player) | Abandon this game and start a new one with the same players | R8 |
| GET  | `/api/leaderboard` | ✔ | Wins per user | X1 |

Every error uses one shape: `{ error: { code, message } }`. Codes include `UNAUTHENTICATED` (401), `NOT_A_PLAYER` (403), `NOT_YOUR_TURN` (403), `GAME_NOT_ACTIVE` (409), `STALE_VERSION` (409), `ACTIONS_LOCKED` (423), `NOTHING_TO_HOLD` (422) and `VALIDATION_ERROR` (400).

> ✅ **Validation for phase 1:** write an ADR, `docs/adr/0001-architecture.md`, that records these choices. Write `docs/api.md`, or an OpenAPI file, **before** coding. Check that every requirement ID in §0 maps to at least one endpoint or component.

---

## 2. Phases and steps

Each phase has: **Steps → Deliverables → Validation (Definition of Done) → Prompt log**.
Do not start the next phase until every Validation box in the current one is ticked.

### Phase 0 — Setup and process (≈1 h)
**Steps**
1. ✅ Local git repo created at `~/git_wa/job_interviews/roeto-dice-game` (branch `main`). Every commit needs the owner's approval (see §3a).
2. Set up the npm workspaces skeleton (`server`, `client`, `shared`) with TS, ESLint and Prettier.
3. Add `docs/ai-prompts.md` (the prompt log), `docs/decisions/` (ADRs) and a `README.md` skeleton.
4. ✅ Add a GitHub Actions workflow that runs `lint`, `typecheck` and `test` on every push and PR.
5. Add the `.env.example` file (`JWT_SECRET`, `DATABASE_URL`, `PORT`).

**Validation**
- [x] `npm install && npm run lint && npm run typecheck && npm test` passes on a clean clone (checked with `npm ci`).
- [ ] The CI run is green. _Deferred: the repo stays local, so CI runs only once you push it._
- [x] Prompt log entry #1 (the planning prompt) is in place.

---

### Phase 1 — Game engine, TDD (≈3 h) → R1–R8, B3, B5
**Steps**
1. Define the `GameState`, `Action`, `GameError` and `DiceRoller` types in `shared/`.
2. Write **failing tests first**, one `describe` block per rule:
   - R3: rolling (2,3) adds 5 to the round score.
   - R4: (6,6) sets the round score to 0, passes the turn and leaves the global score unchanged.
   - R5: Hold adds the round score to the global score, resets the round score and passes the turn.
   - R6: a Hold that reaches or passes the winning score sets the status to `FINISHED` and records the winner. After that, any action → `GAME_NOT_ACTIVE`.
   - R7: a custom winning score is respected; invalid values are rejected.
   - B5: an action by the non-current player → `NOT_YOUR_TURN`; an action by a non-player → `NOT_A_PLAYER`.
   - A2: Hold with a round score of 0 → `NOTHING_TO_HOLD`.
   - Edge cases: (6,5) and (5,6) are not busts; the turn order alternates correctly across many turns.
3. Implement `engine.ts` until every test passes.
4. Write a **property-based test** (fast-check) that checks invariants over random action sequences:
   - Scores are never negative; `roundScore` is 0 at the start of each turn.
   - The sum of global scores equals the sum of HOLD deltas in the event log.
   - At most one winner; no actions are accepted after `FINISHED`.
5. Write a small "seeded game" script that plays a full random game and prints the event log, for a manual check.

**Validation**
- [x] 100% branch coverage on `engine.ts` (`npm run test:coverage --workspace @dice/server`).
- [x] The property tests run 1,000+ random sequences with no failures.
- [x] Manually read one printed game log and confirm it matches the rules (seed 7, P-011).
- [x] The engine has no imports from Express, the database or `fs` (ESLint `no-restricted-imports` rule; checked that it fires).

---

### Phase 2 — Persistence and auth (≈3 h) → B1, B2, B6, X1, X2
**Steps**
1. Write `server/src/db/schema.sql` from the domain model. It is applied on startup with `CREATE TABLE IF NOT EXISTS`, so no migration tool is needed.
2. Build `POST /auth/register` and `/auth/login`. Passwords are hashed with bcrypt (cost 10). JWTs expire after 24 h and the secret comes from env.
3. Add `requireAuth` middleware that reads the Bearer token, checks the signature and expiry, and loads the user.
4. Write a seed script that creates demo users (`alice` / `bob`, demo passwords stored only in `.env.example` and the README) and the `bot` user.
5. Add a central error handler that returns the standard error shape; never return stack traces.
6. Add basic hardening: `helmet`, CORS limited to the client origin, and rate limiting on the auth routes.

**Validation (Supertest)**
- [x] Registering a duplicate username → 409. A weak or empty password → 400.
- [x] Login with a wrong password → 401, with an error message that doesn't say which field was wrong.
- [x] A protected route with no token, a bad token or an expired token → 401.
- [x] The DB holds a bcrypt hash, never the plain-text password (asserted in a test).
- [x] `npm run db:reset && npm run seed` works on a fresh clone.

---

### Phase 3 — Game API (≈3 h) → B3–B6, R7, R8
**Steps**
1. Write a `GameService` that loads the game in a DB transaction, calls the engine, saves the state and appends events, and checks `version`.
2. Add the routes listed in §1, with Zod-validated bodies and params.
3. Add membership checks: only the 2 players can read or act on a game.
4. Make `new` abandon the current game and create a new one with the same players and winning score.
5. When a Hold wins the game, increment the winner's `wins` in the same transaction.
6. Write the OpenAPI spec, or `docs/api.md` with curl examples.

**Validation (Supertest integration tests using a fixed `DiceRoller`)**
- [x] A full scripted game from register to win passes, and `wins` goes up by 1.
- [x] Player B tries to roll on player A's turn → 403 `NOT_YOUR_TURN`.
- [x] A third user reads or acts on the game → 403 `NOT_A_PLAYER`.
- [x] Two concurrent rolls with the same `expectedVersion` → exactly one succeeds and the other gets 409.
- [x] Bad `winningScore` values (`0`, `-5`, `"abc"`, `10001`) → 400.
- [x] Any action on a `FINISHED` or `ABANDONED` game → 409.
- [x] A manual curl walkthrough following `docs/api.md` works as written (the bash block was extracted and run unchanged).

---

### Phase 4 — Frontend (≈4 h) → F1–F4, B7
**Steps**
1. Set up Vite + React + TanStack Query, with an API client typed from `shared/`.
2. **Login screen:** two login/register panels side by side ("Player 1" and "Player 2"). Each panel keeps its own token in memory, with sessionStorage as an option.
3. **Lobby:** set the winning score (default 100), pick the opponent (Player 2 or Bot), and press **Start**. This creates the game with P1's token and joins it with P2's token.
4. **Game board:** two player cards showing name, global score, round score (active player only) and wins. Show dice faces, the active-player highlight, **Roll** / **Hold** / **New game** buttons and an event-history panel.
5. **Token routing:** each action uses the token of `game.currentPlayer`, so the server, not the UI, decides whose turn it is.
6. **Rendering rule:** the UI renders the server response exactly as it comes. No score maths, no 6&6 check and no win check in the client. Buttons are enabled based on fields the server returns (`allowedActions: ["ROLL","HOLD"]`, `lockedUntil`).
7. Show a toast for each error code, plus loading and disabled states while a request is in flight (this prevents double submits).
8. Make the layout responsive and accessible: keyboard-operable buttons, an `aria-live` region for roll results.

**Validation**
- [x] RTL tests: the board renders from a fixture response; buttons follow `allowedActions`; error toasts appear.
- [x] **No-logic audit:** a grep or ESLint rule finds no `6`/`=== 12`/`winningScore` comparisons in `client/src`, and this is checked in a code review.
- [x] Manual check: change a fixture so the server says it's P2's turn; the UI follows the server.
- [x] Accessibility: axe-core (the engine behind Lighthouse's accessibility audit) reports 0 violations in light and dark mode at 375 px and desktop widths. Lighthouse itself was not run.

---

### Phase 5 — Extras (≈3 h) → X1–X4, X6
1. **X4, the 6&6 lock (server-enforced):** on a bust, set `lockedUntil = now + 1500ms`. Actions during the lock → 423 `ACTIONS_LOCKED`. The UI shows a "💥 Double six! Round score lost" animation and disables the buttons until `lockedUntil`.
   *Validation:* an integration test checks that a roll during the lock → 423 and succeeds after the lock (using fake timers or an injected clock).
2. **X3, AI opponent (server-side):** a `bot` user with a strategy function. Hold if `roundScore ≥ 20`, or if holding would win, or if the opponent is close to winning and the bot is behind. When the turn passes to the bot, the server plays the whole bot turn **inside the same request** (decided 2026-10-15) and returns all its events. The UI replays them with a short delay so the turn is easy to follow.
   *Validation:* unit-test the strategy; simulate 1,000 bot-vs-random games and confirm the bot wins more than 50%; confirm the bot only acts through the same engine (no shortcuts).
3. **X1 leaderboard:** a `GET /leaderboard` endpoint and a small panel in the UI.
4. **X6:** the event-history panel.

---

### Phase 6 — End-to-end tests and hardening (≈2 h)
**Steps**
1. Write **one** Playwright smoke test (decided 2026-10-15 to save usage): log in both players → play to a low winning score (10) → the winner is shown and wins go up by 1. New-game and bot flows are covered by API tests instead.
   The tests use a `DICE_SEED` / test-mode env so the dice are predictable.
2. Run a security pass: check JWT secret handling, input validation on every route, no secrets in git (`gitleaks`), and `npm audit`.
3. Do an error UX pass: kill the server mid-game and confirm the UI shows a clear error.

**Validation**
- [ ] All E2E tests are green locally and in CI.
- [ ] `npm audit --omit=dev` shows no high or critical issues.
- [ ] Manual exploratory session: try to break the rules (double clicks, two tabs, editing a request in DevTools to send the other player's token) and confirm the server rejects each attempt.

---

### Phase 7 — Documentation and delivery (≈1.5 h)
**README must include**
- A one-line summary, screenshots/GIF, and the **quick start** (`npm i && npm run setup && npm run dev`).
- The architecture diagram (client ↔ API ↔ engine ↔ DB) and why the game engine is pure.
- The assumptions A1–A6.
- The requirement → code → test traceability table (from §0).
- The API reference link, and how to run each test layer.
- The extras that were built, and what I would do next (WebSockets for multi-device play, refresh tokens, Postgres).
- An **"AI usage"** section linking to `docs/ai-prompts.md`, with a summary of where AI helped and where I overrode it.

**Validation**
- [ ] A fresh clone in a new directory following only the README → the game runs in under 5 minutes.
- [ ] CI is green on `main`, and the git history is clean (conventional commits, one commit per phase).
- [ ] Final review against the checklist in §4.
- [ ] Deliver the local repo plus README. You push it to GitHub yourself; there is no deployed demo (decided 2026-10-15).

---

## 3. AI usage and prompt documentation process

**Rule: every prompt sent to an AI tool is logged, word for word, before its output is used.**

Workflow for each AI interaction:
1. **Log the prompt** in `docs/ai-prompts.md` with an ID (`P-###`), the date, the tool and model, the phase or step, and the requirement IDs it covers.
2. **Record the output summary.** For code, record the files and commit SHA; don't paste large code blocks.
3. **Record the review:** what was accepted, what was changed, and what was rejected, with the reason (for example, "AI put the 6&6 check in the client, which breaks F4, so I moved it to the engine").
4. **Record the validation:** the exact test or command that proved the output correct.
5. Commit the log update in the **same commit** as the AI-assisted code. Put `AI: P-012` in the commit body so each commit links to its log entry.
6. **Commit SHAs** (decided 2026-10-15): new entries say `Phase N commit`. One final docs commit before delivery fills in the real SHAs, using `git log --grep "P-0"`.

Rules for prompts themselves
- Give the AI the relevant requirement IDs and assumptions, so its output can be traced.
- Ask for tests **with** or **before** implementation.
- Don't let AI output skip the Validation gate of its phase.
- Never paste secrets or real credentials into a prompt.

### 3a. Git and commit policy
- The local repo is at `~/git_wa/job_interviews/roeto-dice-game`, branch `main`. There is no remote until submission.
- **No commit happens without the owner's explicit approval.** The AI proposes the message and the list of files, waits for a "yes", and only then commits. One approval covers one commit only.
- **One commit per phase** (decided 2026-10-15), not per step. Each phase ends with its validation checklist, then one commit request.
- Commits follow conventional-commit style (`feat:`, `test:`, `docs:` …). AI-assisted commits include `AI: P-###` in the body.

### 3b. AI cost policy (keep usage as low as possible)
**Use the cheapest model and lowest effort that can do each task well:**

| Tier | Model / effort | Used for |
|------|----------------|----------|
| Cheap | Haiku, low effort | Config files, scaffolding with generators, renaming, formatting, filling in docs/prompt-log entries, running tests and summarising results |
| Default | Sonnet, low–medium effort | Most implementation work: API routes, SQL schema, React components, writing tests from a clear spec |
| Expensive (rare) | Opus, medium effort | Only for: game engine design review, hard bugs that a cheaper model failed on twice, final code review before submission |

**Habits that cut token use:**
- **Start a fresh session for each phase.** Give it only `PLAN.md` and the files that phase needs, instead of the whole chat history.
- **Use generators, not AI, for boilerplate:** `npm create vite`, `prisma init`, `eslint --init`.
- **Point to files instead of pasting them.** Ask for diffs or small edits, not whole-file rewrites.
- **Keep command output short:** run tests with quiet reporters (`vitest run --reporter=dot`), and pipe long logs through `tail`.
- **Prefer text to images:** read the page as text (DOM/accessibility tree) instead of taking screenshots; take screenshots only for final visual checks.
- **No parallel sub-agents or extra sessions** unless a task really needs them.
- **Batch small fixes** into one prompt instead of many round trips.
- **Log the model and effort level** in every prompt-log entry, so the cost choices are documented too.

---

## 4. Final acceptance checklist

| Req | How it is proven |
|-----|------------------|
| R1–R6 | Engine unit tests + property tests + E2E (a) |
| R7 | Engine tests + API validation tests + lobby UI |
| R8 | API test for `/new` + E2E (b) |
| B1, B2, B6 | Auth integration tests |
| B3–B5 | Engine and API tests (`NOT_YOUR_TURN`, `NOT_A_PLAYER`, `STALE_VERSION`) |
| B7 | Two-panel login on one page; token routing |
| F1–F3 | RTL tests + E2E |
| F4 | No-logic audit (lint rule + review) |
| X1–X4, X6 | Extra-specific tests listed in Phase 5 |
| Docs | README fresh-clone test; prompt log complete (every AI commit links to a `P-###`) |

## 5. Schedule (≈20 h total)
| Day | Phases |
|-----|--------|
| 1 | 0, 1 (engine fully tested) |
| 2 | 2, 3 (API complete) |
| 3 | 4 (playable app) |
| 4 | 5, 6 (extras, E2E) |
| 5 | 7 (docs, polish, submit) |

## 6. Risks and how I handle them
| Risk | Mitigation |
|------|-----------|
| Game logic leaking into the client | The server returns `allowedActions`; lint rule; review checklist |
| Flaky tests from random dice | Injected `DiceRoller`; a seeded RNG in test mode |
| Double-click / race conditions | `version` check + disabled buttons while a request is in flight |
| Scope creep from the extras | The extras only start after Phase 4 validation passes; they are listed by priority |
| AI-generated code that is hard to trace | Mandatory prompt log + `AI: P-###` in commit bodies |
