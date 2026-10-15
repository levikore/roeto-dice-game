import type { ActionType, GameState } from '@dice/shared';

/** Hold once the round score reaches this. */
export const HOLD_AT = 20;
/** Push a little harder when the opponent is about to win. */
export const DESPERATE_HOLD_AT = 30;
const OPPONENT_CLOSE = 20;

/**
 * Decides the bot's next move from the game state alone. It only chooses an action;
 * the engine still validates and applies it like any other player's move.
 */
export function chooseAction(state: GameState, botId: string): ActionType {
  const me = state.players.find((p) => p.userId === botId);
  const opponent = state.players.find((p) => p.userId !== botId);
  if (!me || !opponent) return 'ROLL';

  if (state.roundScore === 0) return 'ROLL'; // nothing to bank yet
  if (me.globalScore + state.roundScore >= state.winningScore) return 'HOLD'; // holding wins

  const opponentCloseToWinning =
    opponent.globalScore >= state.winningScore - OPPONENT_CLOSE &&
    opponent.globalScore > me.globalScore;
  const target = opponentCloseToWinning ? DESPERATE_HOLD_AT : HOLD_AT;
  return state.roundScore >= target ? 'HOLD' : 'ROLL';
}
