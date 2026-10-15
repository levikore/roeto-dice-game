export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';

export interface PlayerState {
  userId: string;
  globalScore: number;
}

export interface GameState {
  id: string;
  status: GameStatus;
  winningScore: number;
  players: PlayerState[]; // seat 0 and 1
  currentPlayerIndex: 0 | 1;
  roundScore: number;
  winnerId?: string;
  lockedUntil?: number; // epoch ms; actions rejected until then (6&6 pause)
  version: number;
}

export type ActionType = 'ROLL' | 'HOLD';

export interface Action {
  type: ActionType;
}

export type GameErrorCode =
  | 'NOT_A_PLAYER'
  | 'NOT_YOUR_TURN'
  | 'GAME_NOT_ACTIVE'
  | 'ACTIONS_LOCKED'
  | 'NOTHING_TO_HOLD'
  | 'INVALID_WINNING_SCORE';

export interface GameError {
  code: GameErrorCode;
  message: string;
}

export type Result<T, E = GameError> = { ok: true; value: T } | { ok: false; error: E };

export type DiceRoll = [number, number];

/** Injectable dice source: random in production, fixed in tests. */
export interface DiceRoller {
  roll(): DiceRoll;
}

export type GameEventType = 'ROLL' | 'HOLD' | 'BUST' | 'WIN' | 'ABANDON';

export interface GameEvent {
  type: GameEventType;
  userId: string;
  dice?: DiceRoll;
  scoreDelta: number;
}

/** What the API returns for a game. The client renders this and never computes rules. */
export interface GameView {
  id: string;
  status: GameStatus;
  winningScore: number;
  players: { userId: string; username: string; globalScore: number; wins: number }[];
  currentPlayerId: string | null;
  roundScore: number;
  winnerId: string | null;
  /** Actions the current player may take right now (empty while locked or finished). */
  allowedActions: ActionType[];
  /** Milliseconds until actions unlock after a 6&6 (0 when not locked). */
  lockRemainingMs: number;
  version: number;
}
