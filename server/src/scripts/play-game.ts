// Plays one full seeded game through the engine and prints the event log.
// Usage: npm run play-game --workspace @dice/server -- [seed] [winningScore]
import type { DiceRoller, GameEvent } from '@dice/shared';
import { seededDice } from '../game/dice.ts';
import { applyAction, createGame } from '../game/engine.ts';

const seed = Number(process.argv[2] ?? 1);
const winningScore = Number(process.argv[3] ?? 30);

const dice: DiceRoller = seededDice(seed);

const created = createGame('demo', ['alice', 'bob'], winningScore);
if (!created.ok) throw new Error(created.error.message);
let state = created.value;
let now = 0;
const log: GameEvent[] = [];

console.log(`seed=${seed} winningScore=${winningScore}`);
while (state.status === 'IN_PROGRESS') {
  const actor = state.players[state.currentPlayerIndex].userId;
  // simple player: hold once the round score reaches 15
  const type = state.roundScore >= 15 ? 'HOLD' : 'ROLL';
  now += 2000;
  const r = applyAction(state, { type }, actor, dice, now);
  if (!r.ok) throw new Error(`${actor} ${type}: ${r.error.code}`);
  state = r.value.state;
  for (const e of r.value.events) {
    log.push(e);
    const d = e.dice ? ` [${e.dice.join(',')}]` : '';
    const g = state.players.map((p) => `${p.userId}=${p.globalScore}`).join(' ');
    console.log(
      `${e.type.padEnd(4)} ${e.userId.padEnd(5)}${d.padEnd(6)} Δ${e.scoreDelta}  round=${state.roundScore}  ${g}`,
    );
  }
}
console.log(`winner=${state.winnerId} events=${log.length} version=${state.version}`);
