/* eslint-disable @typescript-eslint/no-unused-vars -- stub, replaced in step 3 */
import type { Action, DiceRoller, GameEvent, GameState, Result } from '@dice/shared';

export interface ActionOutcome {
  state: GameState;
  events: GameEvent[];
}

// Stubs: implemented in step 3 (tests below are written first and must fail).
export function createGame(
  _id: string,
  _playerIds: [string, string],
  _winningScore?: number,
): Result<GameState> {
  throw new Error('not implemented');
}

export function applyAction(
  _state: GameState,
  _action: Action,
  _actorId: string,
  _dice: DiceRoller,
  _now?: number,
): Result<ActionOutcome> {
  throw new Error('not implemented');
}
