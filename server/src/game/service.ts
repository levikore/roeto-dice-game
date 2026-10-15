import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type {
  Action,
  ActionType,
  DiceRoller,
  GameError,
  GameEvent,
  GameState,
  GameStatus,
  GameView,
} from '@dice/shared';
import { ApiError } from '../http/errors.ts';
import { chooseAction } from './bot.ts';
import { applyAction, createGame as engineCreate, DEFAULT_WINNING_SCORE } from './engine.ts';

export interface GameServiceDeps {
  db: DatabaseSync;
  dice: DiceRoller;
  now?: () => number;
}

export interface ActionResult {
  game: GameView;
  events: GameEvent[];
}

const HTTP_FOR_ENGINE_ERROR: Record<GameError['code'], number> = {
  NOT_A_PLAYER: 403,
  NOT_YOUR_TURN: 403,
  GAME_NOT_ACTIVE: 409,
  ACTIONS_LOCKED: 423,
  NOTHING_TO_HOLD: 422,
  INVALID_WINNING_SCORE: 400,
};

interface GameRow {
  id: string;
  status: GameStatus;
  winning_score: number;
  current_player_index: 0 | 1;
  round_score: number;
  version: number;
  winner_id: string | null;
  locked_until: number | null;
}

interface PlayerRow {
  user_id: string;
  username: string;
  wins: number;
  is_bot: number;
  global_score: number;
}

const MAX_BOT_MOVES = 500;

export function createGameService({ db, dice, now = Date.now }: GameServiceDeps) {
  const notFound = () => new ApiError(404, 'GAME_NOT_FOUND', 'Game not found');

  function transaction<T>(fn: () => T): T {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  }

  function loadRow(gameId: string): GameRow {
    const row = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as GameRow | undefined;
    if (!row) throw notFound();
    return row;
  }

  function loadPlayers(gameId: string): PlayerRow[] {
    return db
      .prepare(
        `SELECT gp.user_id, u.username, u.wins, u.is_bot, gp.global_score
           FROM game_players gp JOIN users u ON u.id = gp.user_id
          WHERE gp.game_id = ? ORDER BY gp.seat`,
      )
      .all(gameId) as unknown as PlayerRow[];
  }

  function toState(row: GameRow, players: PlayerRow[]): GameState {
    return {
      id: row.id,
      status: row.status,
      winningScore: row.winning_score,
      players: players.map((p) => ({ userId: p.user_id, globalScore: p.global_score })),
      currentPlayerIndex: row.current_player_index,
      roundScore: row.round_score,
      winnerId: row.winner_id ?? undefined,
      lockedUntil: row.locked_until ?? undefined,
      version: row.version,
    };
  }

  function toView(row: GameRow, players: PlayerRow[], at: number): GameView {
    const lockRemainingMs = Math.max(0, (row.locked_until ?? 0) - at);
    const active = row.status === 'IN_PROGRESS' && players.length === 2 && lockRemainingMs === 0;
    const allowedActions: ActionType[] = active
      ? row.round_score > 0
        ? ['ROLL', 'HOLD']
        : ['ROLL']
      : [];
    return {
      id: row.id,
      status: row.status,
      winningScore: row.winning_score,
      players: players.map((p) => ({
        userId: p.user_id,
        username: p.username,
        globalScore: p.global_score,
        wins: p.wins,
      })),
      currentPlayerId:
        row.status === 'IN_PROGRESS' ? (players[row.current_player_index]?.user_id ?? null) : null,
      roundScore: row.round_score,
      winnerId: row.winner_id,
      allowedActions,
      lockRemainingMs,
      version: row.version,
    };
  }

  function view(gameId: string): GameView {
    return toView(loadRow(gameId), loadPlayers(gameId), now());
  }

  function requireMember(players: PlayerRow[], userId: string) {
    if (!players.some((p) => p.user_id === userId)) {
      throw new ApiError(403, 'NOT_A_PLAYER', 'You are not a player in this game');
    }
  }

  function insertGame(
    id: string,
    status: GameStatus,
    winningScore: number,
    playerIds: string[],
  ): void {
    const t = now();
    db.prepare(
      'INSERT INTO games (id, status, winning_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, status, winningScore, t, t);
    const addPlayer = db.prepare(
      'INSERT INTO game_players (game_id, seat, user_id) VALUES (?, ?, ?)',
    );
    playerIds.forEach((userId, seat) => addPlayer.run(id, seat, userId));
  }

  /** Validates one move with the engine and saves the new state and its events. */
  function applyAndSave(
    gameId: string,
    userId: string,
    action: Action,
    at: number,
    expectedVersion?: number,
  ): GameEvent[] {
    const row = loadRow(gameId);
    const players = loadPlayers(gameId);
    requireMember(players, userId);
    if (expectedVersion !== undefined && expectedVersion !== row.version) throw staleVersion();

    const result = applyAction(toState(row, players), action, userId, dice, at);
    if (!result.ok) throw engineError(result.error);
    const { state, events } = result.value;

    const changed = db
      .prepare(
        `UPDATE games SET status = ?, current_player_index = ?, round_score = ?, winner_id = ?,
                          locked_until = ?, version = ?, updated_at = ?
          WHERE id = ? AND version = ?`,
      )
      .run(
        state.status,
        state.currentPlayerIndex,
        state.roundScore,
        state.winnerId ?? null,
        state.lockedUntil ?? null,
        state.version,
        now(),
        gameId,
        row.version,
      ).changes;
    if (changed !== 1) throw staleVersion();

    // The win is counted in the same transaction as the move that decided it.
    if (state.status === 'FINISHED' && state.winnerId) {
      db.prepare('UPDATE users SET wins = wins + 1 WHERE id = ?').run(state.winnerId);
    }

    const setScore = db.prepare(
      'UPDATE game_players SET global_score = ? WHERE game_id = ? AND user_id = ?',
    );
    for (const p of state.players) setScore.run(p.globalScore, gameId, p.userId);

    const addEvent = db.prepare(
      `INSERT INTO game_events (game_id, user_id, type, die1, die2, score_delta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const e of events) {
      addEvent.run(
        gameId,
        e.userId,
        e.type,
        e.dice?.[0] ?? null,
        e.dice?.[1] ?? null,
        e.scoreDelta,
        now(),
      );
    }
    return events;
  }

  /**
   * While it is the bot's turn, let it choose a move and apply it through the same engine path
   * as any player. The 6&6 pause is for the human's screen, so the bot moves at the time the
   * pause ends instead of being rejected.
   */
  function playBotTurns(gameId: string): GameEvent[] {
    const events: GameEvent[] = [];
    for (let i = 0; i < MAX_BOT_MOVES; i++) {
      const row = loadRow(gameId);
      const players = loadPlayers(gameId);
      if (row.status !== 'IN_PROGRESS' || players.length < 2) return events;
      const current = players[row.current_player_index];
      if (!current.is_bot) return events;
      const type = chooseAction(toState(row, players), current.user_id);
      const at = Math.max(now(), row.locked_until ?? 0);
      events.push(...applyAndSave(gameId, current.user_id, { type }, at));
    }
    throw new ApiError(500, 'BOT_STUCK', 'The bot took too many moves');
  }

  return {
    /** Creates a game. Against a human it waits for `join`; against the bot it starts at once. */
    create(userId: string, opts: { winningScore?: number; opponent?: 'human' | 'bot' }): GameView {
      const winningScore = opts.winningScore ?? DEFAULT_WINNING_SCORE;
      const id = randomUUID();
      return transaction(() => {
        if (opts.opponent === 'bot') {
          const bot = db.prepare('SELECT id FROM users WHERE is_bot = 1 LIMIT 1').get() as
            { id: string } | undefined;
          if (!bot) throw new ApiError(503, 'BOT_UNAVAILABLE', 'The bot player is not set up');
          const created = engineCreate(id, [userId, bot.id], winningScore);
          if (!created.ok) throw engineError(created.error);
          insertGame(id, 'IN_PROGRESS', winningScore, [userId, bot.id]);
        } else {
          // Validate the winning score with the same rules the engine uses.
          const check = engineCreate(id, [userId, userId], winningScore);
          if (!check.ok) throw engineError(check.error);
          insertGame(id, 'WAITING', winningScore, [userId]);
        }
        return view(id);
      });
    },

    /** The second player joins a waiting game; the engine then starts it. */
    join(gameId: string, userId: string): GameView {
      return transaction(() => {
        const row = loadRow(gameId);
        const players = loadPlayers(gameId);
        if (row.status !== 'WAITING') {
          throw new ApiError(409, 'GAME_NOT_JOINABLE', 'This game is not waiting for a player');
        }
        if (players.some((p) => p.user_id === userId)) {
          throw new ApiError(409, 'ALREADY_IN_GAME', 'You are already in this game');
        }
        const created = engineCreate(gameId, [players[0].user_id, userId], row.winning_score);
        if (!created.ok) throw engineError(created.error);
        const changed = db
          .prepare(
            `UPDATE games SET status = 'IN_PROGRESS', version = version + 1, updated_at = ?
              WHERE id = ? AND version = ? AND status = 'WAITING'`,
          )
          .run(now(), gameId, row.version).changes;
        if (changed !== 1) throw staleVersion();
        db.prepare('INSERT INTO game_players (game_id, seat, user_id) VALUES (?, 1, ?)').run(
          gameId,
          userId,
        );
        return view(gameId);
      });
    },

    /** Only the game's players may read it. */
    get(gameId: string, userId: string): GameView {
      const row = loadRow(gameId);
      const players = loadPlayers(gameId);
      requireMember(players, userId);
      return toView(row, players, now());
    },

    /**
     * Roll or hold. `expectedVersion` (optional) rejects requests made from an outdated view.
     * If the turn then passes to the bot, the bot plays its whole turn in the same transaction.
     */
    act(gameId: string, userId: string, action: Action, expectedVersion?: number): ActionResult {
      return transaction(() => {
        const events = applyAndSave(gameId, userId, action, now(), expectedVersion);
        events.push(...playBotTurns(gameId));
        return { game: view(gameId), events };
      });
    },

    /**
     * Starts a fresh game with the same players and winning score (R8). A game in progress
     * is marked ABANDONED (nobody wins it); a finished game is left as it is.
     */
    newGame(gameId: string, userId: string, expectedVersion?: number): GameView {
      return transaction(() => {
        const row = loadRow(gameId);
        const players = loadPlayers(gameId);
        requireMember(players, userId);
        if (expectedVersion !== undefined && expectedVersion !== row.version) throw staleVersion();
        if (row.status !== 'IN_PROGRESS' && row.status !== 'FINISHED') {
          throw new ApiError(409, 'GAME_NOT_ACTIVE', 'There is no game to restart here');
        }
        const ids = players.map((p) => p.user_id);
        const fresh = engineCreate(randomUUID(), [ids[0], ids[1]], row.winning_score);
        if (!fresh.ok) throw engineError(fresh.error);

        if (row.status === 'IN_PROGRESS') {
          const changed = db
            .prepare(
              `UPDATE games SET status = 'ABANDONED', locked_until = NULL, version = version + 1, updated_at = ?
                WHERE id = ? AND version = ?`,
            )
            .run(now(), gameId, row.version).changes;
          if (changed !== 1) throw staleVersion();
          db.prepare(
            `INSERT INTO game_events (game_id, user_id, type, score_delta, created_at) VALUES (?, ?, 'ABANDON', 0, ?)`,
          ).run(gameId, userId, now());
        }
        insertGame(fresh.value.id, 'IN_PROGRESS', row.winning_score, ids);
        return view(fresh.value.id);
      });
    },

    /** Wins per user, most wins first. */
    leaderboard(): { userId: string; username: string; wins: number; isBot: boolean }[] {
      const rows = db
        .prepare(
          'SELECT id, username, wins, is_bot FROM users ORDER BY wins DESC, username COLLATE NOCASE',
        )
        .all() as { id: string; username: string; wins: number; is_bot: number }[];
      return rows.map((r) => ({
        userId: r.id,
        username: r.username,
        wins: r.wins,
        isBot: r.is_bot === 1,
      }));
    },
  };
}

export type GameService = ReturnType<typeof createGameService>;

function engineError(error: GameError): ApiError {
  return new ApiError(HTTP_FOR_ENGINE_ERROR[error.code], error.code, error.message);
}

function staleVersion(): ApiError {
  return new ApiError(409, 'STALE_VERSION', 'The game changed; reload and try again');
}
