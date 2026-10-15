# API reference

Base URL: `http://localhost:3000`. All bodies are JSON. Every route except `register` and `login` needs the header `Authorization: Bearer <token>`.

Every error has the same shape: `{ "error": { "code": "...", "message": "..." } }`.

## Endpoints

| Method | Path | Body | Success | Purpose |
|--------|------|------|---------|---------|
| POST | `/api/auth/register` | `{ username, password }` | 201 `{ token, user }` | Create a user (username 3–20 letters/digits/underscore, password 6–72 chars) |
| POST | `/api/auth/login` | `{ username, password }` | 200 `{ token, user }` | Get a 24-hour token |
| GET | `/api/auth/me` | – | 200 `{ user }` | Current user and win count |
| POST | `/api/games` | `{ winningScore?, opponent? }` | 201 `{ game }` | Create a game. `winningScore` is a whole number 10–1000 (default 100). `opponent` is `"human"` (default, waits for `join`) or `"bot"` (starts at once) |
| POST | `/api/games/:id/join` | – | 200 `{ game }` | Second player joins a waiting game; it then starts, creator first |
| GET | `/api/games/:id` | – | 200 `{ game }` | Read a game (players only) |
| POST | `/api/games/:id/roll` | `{ expectedVersion? }` | 200 `{ game, events }` | Roll two dice (current player only) |
| POST | `/api/games/:id/hold` | `{ expectedVersion? }` | 200 `{ game, events }` | Bank the round score and pass the turn |
| POST | `/api/games/:id/new` | `{ expectedVersion? }` | 201 `{ game }` | Abandon a game in progress (or leave a finished one) and start a fresh game with the same players and winning score |
| GET | `/api/leaderboard` | – | 200 `{ leaderboard }` | Wins per user, most first |

`expectedVersion` is optional. If you send it and the game has moved on since you read it, the request fails with 409 `STALE_VERSION` and nothing changes. This stops double clicks and out-of-date screens.

## The `game` object

```json
{
  "id": "…", "status": "IN_PROGRESS",
  "winningScore": 100,
  "players": [{ "userId": "…", "username": "alice", "globalScore": 20, "wins": 1 }, { "…": "…" }],
  "currentPlayerId": "…",
  "roundScore": 9,
  "winnerId": null,
  "allowedActions": ["ROLL", "HOLD"],
  "lockRemainingMs": 0,
  "version": 7
}
```

`status` is `WAITING`, `IN_PROGRESS`, `FINISHED` or `ABANDONED`. `allowedActions` and `lockRemainingMs` are worked out by the server, so a client only has to show them. After a 6 & 6 the turn passes and actions are locked for 1500 ms.

`events` (roll/hold responses) lists what just happened: `{ type: ROLL | HOLD | BUST | WIN, userId, dice?, scoreDelta }`.

## Error codes

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Body or params are malformed |
| 400 | `INVALID_WINNING_SCORE` | Not a whole number from 10 to 1000 |
| 401 | `UNAUTHENTICATED` | Missing, bad or expired token |
| 401 | `INVALID_CREDENTIALS` | Wrong username or password (same message for both) |
| 403 | `NOT_A_PLAYER` | You are not in this game |
| 403 | `NOT_YOUR_TURN` | The other player is up |
| 404 | `GAME_NOT_FOUND` | No such game |
| 409 | `USERNAME_TAKEN` | Username exists (any letter case) |
| 409 | `GAME_NOT_ACTIVE` | Game is waiting, finished or abandoned |
| 409 | `GAME_NOT_JOINABLE` / `ALREADY_IN_GAME` | Cannot join this game |
| 409 | `STALE_VERSION` | The game changed since your `expectedVersion` |
| 413 | `PAYLOAD_TOO_LARGE` | Body over 10 kb |
| 422 | `NOTHING_TO_HOLD` | Hold with a round score of 0 |
| 423 | `ACTIONS_LOCKED` | Inside the pause after a 6 & 6 |
| 429 | `TOO_MANY_REQUESTS` | Login/register rate limit |
| 503 | `BOT_UNAVAILABLE` | Bot user missing (run the seed) |

## Walkthrough with curl

Start the API first (see the README), with the seeded users. Dice are random, so numbers will differ from run to run.

```bash
API=http://localhost:3000/api
json() { node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);console.log(eval("o."+process.argv[1]))})' "$1"; }

# 1. Log both players in
A=$(curl -s -X POST $API/auth/login -H 'content-type: application/json' -d '{"username":"alice","password":"demo1234"}' | json token)
B=$(curl -s -X POST $API/auth/login -H 'content-type: application/json' -d '{"username":"bob","password":"demo1234"}' | json token)

# 2. Alice creates a game to 50, bob joins
ID=$(curl -s -X POST $API/games -H "authorization: Bearer $A" -H 'content-type: application/json' -d '{"winningScore":50}' | json game.id)
curl -s -X POST $API/games/$ID/join -H "authorization: Bearer $B" | json game.status      # IN_PROGRESS

# 3. Bob tries to roll on alice's turn -> NOT_YOUR_TURN
curl -s -X POST $API/games/$ID/roll -H "authorization: Bearer $B" | json error.code

# 4. Alice rolls, then holds (a 6 & 6 would pass the turn instead)
curl -s -X POST $API/games/$ID/roll -H "authorization: Bearer $A" | json game.roundScore
curl -s -X POST $API/games/$ID/hold -H "authorization: Bearer $A" | json game.players[0].globalScore

# 5. No token -> UNAUTHENTICATED
curl -s $API/games/$ID | json error.code

# 6. Start a new game, check the leaderboard
curl -s -X POST $API/games/$ID/new -H "authorization: Bearer $A" | json game.status       # IN_PROGRESS
curl -s $API/leaderboard -H "authorization: Bearer $A" | json leaderboard.length
```
