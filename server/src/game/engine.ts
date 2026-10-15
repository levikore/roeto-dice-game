import type { Action, DiceRoller, GameError, GameEvent, GameState, Result } from '@dice/shared';

export interface ActionOutcome {
  state: GameState;
  events: GameEvent[];
}

export const DEFAULT_WINNING_SCORE = 100;
export const MIN_WINNING_SCORE = 10;
export const MAX_WINNING_SCORE = 1000;
export const BUST_LOCK_MS = 1500;

const fail = (code: GameError['code'], message: string): Result<never> => ({
  ok: false,
  error: { code, message },
});

export function createGame(
  id: string,
  playerIds: [string, string],
  winningScore: number = DEFAULT_WINNING_SCORE,
): Result<GameState> {
  if (
    !Number.isInteger(winningScore) ||
    winningScore < MIN_WINNING_SCORE ||
    winningScore > MAX_WINNING_SCORE
  ) {
    return fail(
      'INVALID_WINNING_SCORE',
      `Winning score must be a whole number from ${MIN_WINNING_SCORE} to ${MAX_WINNING_SCORE}`,
    );
  }
  return {
    ok: true,
    value: {
      id,
      status: 'IN_PROGRESS',
      winningScore,
      players: playerIds.map((userId) => ({ userId, globalScore: 0 })),
      currentPlayerIndex: 0,
      roundScore: 0,
      version: 0,
    },
  };
}

/** Pure rules engine: validates the action and returns the next state plus events. */
export function applyAction(
  state: GameState,
  action: Action,
  actorId: string,
  dice: DiceRoller,
  now: number = Date.now(),
): Result<ActionOutcome> {
  if (state.status !== 'IN_PROGRESS') return fail('GAME_NOT_ACTIVE', 'This game is not active');

  const seat = state.players.findIndex((p) => p.userId === actorId);
  if (seat === -1) return fail('NOT_A_PLAYER', 'You are not a player in this game');
  if (seat !== state.currentPlayerIndex) return fail('NOT_YOUR_TURN', 'It is not your turn');
  if (state.lockedUntil !== undefined && now < state.lockedUntil) {
    return fail('ACTIONS_LOCKED', 'Actions are locked for a moment');
  }

  const next: GameState = structuredClone(state);
  next.version += 1;
  delete next.lockedUntil;
  const other = (seat === 0 ? 1 : 0) as 0 | 1;

  if (action.type === 'ROLL') {
    const roll = dice.roll();
    const [d1, d2] = roll;
    if (d1 === 6 && d2 === 6) {
      next.roundScore = 0;
      next.currentPlayerIndex = other;
      next.lockedUntil = now + BUST_LOCK_MS;
      return {
        ok: true,
        value: {
          state: next,
          events: [{ type: 'BUST', userId: actorId, dice: roll, scoreDelta: -state.roundScore }],
        },
      };
    }
    next.roundScore += d1 + d2;
    return {
      ok: true,
      value: {
        state: next,
        events: [{ type: 'ROLL', userId: actorId, dice: roll, scoreDelta: d1 + d2 }],
      },
    };
  }

  // HOLD
  if (state.roundScore === 0) return fail('NOTHING_TO_HOLD', 'Roll at least once before holding');
  const banked = state.roundScore;
  next.players[seat].globalScore += banked;
  next.roundScore = 0;
  const events: GameEvent[] = [{ type: 'HOLD', userId: actorId, scoreDelta: banked }];
  if (next.players[seat].globalScore >= state.winningScore) {
    next.status = 'FINISHED';
    next.winnerId = actorId;
    events.push({ type: 'WIN', userId: actorId, scoreDelta: 0 });
  } else {
    next.currentPlayerIndex = other;
  }
  return { ok: true, value: { state: next, events } };
}
