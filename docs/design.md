# Design

What the brief asks for, how the code answers it, and why each choice was made. Constants named here live in the file shown in the last column.

## 1. Requirements

| ID | From the brief | Where it is handled |
|---|---|---|
| R1–R6 | Two players, rolls add to a round score, a double six loses it and passes the turn, Hold banks it and passes the turn, first to the winning score wins | `server/src/game/engine.ts` |
| R7 | Winning score is configurable, default 100 | `engine.ts` (`createGame`), lobby in `client/src/Lobby.tsx` |
| R8 | A new game can start at any time | `GameService.newGame`, `POST /api/games/:id/new` |
| B1–B6 | Backend with authentication; it manages players, enforces the rules, holds game state and validates every action; only logged-in users play | `server/src/http/*`, `server/src/game/service.ts` |
| B7 | Users are simulated on one page, no live updates between browsers | two login panels in `client/src/App.tsx` |
| F1–F4 | React app that logs in, shows state, calls the API for every action, and holds no game logic | `client/src/*` |
| X1 | Win counts | `users.wins`, `GET /api/leaderboard` |
| X2 | Persistence | SQLite file, `server/src/db/` |
| X3 | AI opponent | `server/src/game/bot.ts`, `GameService.playBotTurns` |
| X4 | Pause and message on a double six | `BUST_LOCK_MS` in the engine, shake and message in `Board.tsx` |
| X5 | Sound | not built |

Assumptions about rules the brief leaves open are in the README.

## 2. Architecture

```
React app ──/api──▶ Express API ──▶ pure game engine (rules)
 (no rules)         (auth, validation, transactions) ──▶ SQLite
```

- **Engine:** `applyAction(state, action, actorId, dice, now?)` returns the new state and the events, or an error code. It does no I/O; dice and the clock are passed in. A lint rule stops it importing Express, the database or `fs`.
- **Service:** loads the game inside a transaction, calls the engine, saves the result, appends the events, and counts a win in the same transaction.
- **Routes:** check the token, validate the input, call the service, return the `game` object.
- **Client:** renders the `game` object. Buttons come from `allowedActions`; the pause comes from `lockRemainingMs`. It computes no scores and no turns.

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript, npm workspaces (`shared`, `server`, `client`) | One install; the API types are shared by server and client |
| API | Node 22.18+ and Express 5, Zod for input | Familiar to reviewers; one schema is both the check and the type |
| Database | built-in `node:sqlite` | No dependency or build step. One machine is enough for the brief. A stale write changes 0 rows, which the version check relies on |
| Passwords | `bcryptjs`, cost 10 | Pure JavaScript, so no native build on a new Node. Slower than native bcrypt, which does not matter here |
| Sessions | JWT (HS256, 24 h) in an `Authorization: Bearer` header | Stateless, so there is no session table. The cost: a token cannot be revoked before it expires |
| Client | React 19, Vite, TanStack Query | Server state without hand-written fetch state |
| Tests | Vitest, Supertest, React Testing Library, one Playwright smoke test | Rules, API and screens each tested at their own level; one end-to-end run proves they connect |

## 3. Data

| Table | Holds |
|---|---|
| `users` | id, username (unique, any letter case), password hash, wins, bot flag |
| `games` | status (`WAITING`, `IN_PROGRESS`, `FINISHED`, `ABANDONED`), winning score, whose turn, round score, `version`, winner, pause end time |
| `game_players` | the two seats and each player's total score |
| `game_events` | every roll, hold, bust, win and abandon, in order |

## 4. Decisions and why

| Decision | Why | Where |
|---|---|---|
| Rules as a pure function with injected dice and clock | Every rule is testable without a server; tests use fixed dice; 100% branch coverage plus 1000 random games | `engine.ts`, `dice.ts` |
| Engine checks run in a fixed order: game active, is a player, is their turn, not paused, then the action | A finished or waiting game answers "not active" whoever asks | `engine.ts` |
| Winning score 10–1000, default 100 | The brief fixes only the default. Below 10 a game ends in a turn or two; above 1000 it is pointless. Rejecting the rest stops nonsense input | `MIN_WINNING_SCORE`, `MAX_WINNING_SCORE` in `engine.ts` |
| The double-six pause is 1500 ms and enforced by the server | Long enough to read the message and see the dice shake; a client cannot skip it | `BUST_LOCK_MS` in `engine.ts` |
| Each game has a `version`; requests may send `expectedVersion` | A double click or an out-of-date screen is rejected (409) instead of applied twice | `service.ts`, conditional `UPDATE` |
| The player is taken only from the token | A request body cannot claim to be someone else; tested with tamper attempts | `requireAuth.ts` |
| The bot plays its whole turn inside the human's request, through the same engine | One round trip, one transaction, no bot logic in the client, and the bot cannot break a rule. The response carries all its moves and the screen replays them 800 ms apart | `playBotTurns` in `service.ts`, `REPLAY_MS` in `Board.tsx` |
| Bot holds at 20, or at 30 when the opponent is close to winning and ahead | A simple rule that can be explained and tested | `bot.ts` |
| Username 3–20 letters, digits or underscores; password 6–72 characters | Safe characters only. bcrypt ignores everything past 72 bytes. 6 is a minimum suited to a demo | `http/auth.ts` |
| Same error for a wrong password and an unknown user, with a dummy hash compared in the second case | Does not reveal which usernames exist, including by response time | `http/auth.ts` |
| 30 login or register attempts per minute per IP; 10 kb body limit | Slows password guessing; bodies in this API are tiny. Game routes need a token, so they are not limited | `app.ts` |
| The API refuses to start with a missing, short or example `JWT_SECRET` | The example value is public, so anyone could forge logins with it | `config.ts` |
| One error shape with a stable code, and different statuses for different faults | 403 not your turn, 409 conflict, 422 nothing to hold, 423 paused. The client shows the server's message | `http/errors.ts`, `docs/api.md` |
| Logins and the current game id are kept in `sessionStorage` | Per tab, and gone when the tab closes, so one tab never picks up another's game. After a reload the game is read again from the server | `session.ts`, `savedGame.ts` |
| No polling or live updates | The brief says they are not needed; two browsers do not follow one game | README, known limits |

## 5. Not covered

CI has never run (no remote). Tokens cannot be revoked. The API is plain HTTP for local use. See the README for the full list.
