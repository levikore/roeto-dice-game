// Usage: npm run seed --workspace @dice/server
import { openDb } from '../db/db.ts';
import { seed } from '../db/seed.ts';

const path = process.env.DATABASE_PATH ?? './dev.db';
const password = process.env.DEMO_PASSWORD;
if (!password || password.length < 6) {
  throw new Error(
    'Set DEMO_PASSWORD (at least 6 characters), e.g. by copying .env.example to .env',
  );
}
const db = openDb(path);
seed(db, password);
const names = (
  db.prepare('SELECT username FROM users ORDER BY username').all() as { username: string }[]
).map((u) => u.username);
console.log(`Seeded ${path}: ${names.join(', ')}`);
