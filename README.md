# Roeto Dice Game

Two-player dice game. **All rules run in an authenticated backend API**; the React app only shows what the server returns and sends actions (roll, hold, new game).

**Rules:** roll two dice as often as you like and add them to the round score. A double six loses the round score and passes the turn. Hold banks the round score and passes the turn. First to the winning score (default 100, you can change it) wins. You can start a new game at any time.

## Quick start

Needs Node 22.18+ (runs TypeScript and SQLite built in) and npm.

```bash
npm install
npm run setup   # creates .env with a random JWT secret, seeds the demo users
npm run dev     # API on :3000, app on http://localhost:5173
```

Demo users: `alice` and `bob`, password `demo1234` (set in `.env`). Both players log in on the same page (Player 1 and Player 2 panels); pick **Bot** instead of Player 2 to play the AI.

## How it is built

```
React app ──/api──▶ Express API ──▶ pure game engine (rules)
 (no rules)         (auth, validation, transactions) ──▶ SQLite
```

- **`server/src/game/engine.ts`** holds every rule as a pure function, tested to 100% branch coverage plus 1000 random games. It cannot import Express, the database or `fs` (lint rule).
- **Auth:** username + password (bcrypt), 24 h JWT. The player is always taken from the token, never from the request body.
- **State:** games, scores, wins and an event log are in SQLite (`node:sqlite`, no extra install). Each game has a `version`; stale or double-sent requests are rejected.
- **Client:** shows the `game` object the server returns, including `allowedActions` and `lockRemainingMs`. It computes no scores or turns.
- Requirements, data model and the reasons behind each choice: [docs/design.md](docs/design.md). API reference with a curl walkthrough: [docs/api.md](docs/api.md).

## Assumptions

1. A win is checked only on Hold, not after each roll.
2. Hold with a round score of 0 is rejected.
3. Either player may start a new game at any time; an unfinished game is marked abandoned (no winner) and the new one keeps the players, order and winning score.
4. Winning score: whole number 10–1000.
5. Two users on one page = one login per player; the server checks that the token belongs to the player whose turn it is.
6. Only a double six ends a turn; a single six does nothing.

## Extras built

Win counts and leaderboard · data kept in SQLite · double-six pause (server-enforced, shown with a message and animation) · AI opponent that plays inside the same request, so it uses the same rules as a human · move history panel. Not built: sound, live updates across browsers, deployment.

## Tests

```bash
npm test                                   # 153 server + 49 client tests
npm run test:coverage -w @dice/server      # engine: 100% branches
npm run e2e                                # Playwright smoke test (uses installed Chrome)
npm run lint && npm run typecheck
npm run play-game -w @dice/server -- 7 30  # prints one seeded game, move by move
```

| Requirement | Proven by |
|---|---|
| Rules (roll, double six, hold, win, custom score) | engine unit + property tests, API tests, e2e |
| New game any time | API tests |
| Auth, only logged-in users play, only the current player acts | auth, security and games API tests |
| No game logic in the client | grep audit of the client for rule code (none found); client tests use server-made fixtures |
| Wins, persistence, double-six pause, bot | API tests, simulation of 1000 bot games, client tests |

## Known limits

Logins are stateless tokens, so a stolen token works until it expires (24 h) and there is no server-side logout. The API is plain HTTP for local use. Rate limiting covers login and register only. After a page reload the current game reopens from the server, but the move history list starts empty. The game is remembered per browser tab. The app does not poll, so two browsers do not update each other (the brief allows this).

## AI usage and process

Built phase by phase with Claude Code, with tests first for the rules and a clean-install check at the end of each phase. Several defects were found by validation rather than by reading code, for example an unsafe example JWT secret, an unreadable "API down" message and a double-click error.
