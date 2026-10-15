import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { openDb } from './db/db.ts';
import { seededDice } from './game/dice.ts';

const config = loadConfig(process.env);
const db = openDb(config.databasePath);

// DICE_SEED makes the dice repeatable, for end-to-end tests only.
if (config.diceSeed !== undefined)
  console.warn(`TEST MODE: dice are seeded with ${config.diceSeed}`);
const app = createApp({
  db,
  jwtSecret: config.jwtSecret,
  clientOrigin: config.clientOrigin,
  dice: config.diceSeed !== undefined ? seededDice(config.diceSeed) : undefined,
});
app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
