import { createApp } from './app.ts';
import { openDb } from './db/db.ts';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
  throw new Error('Set JWT_SECRET (at least 16 characters), e.g. by copying .env.example to .env');
}
const port = Number(process.env.PORT ?? 3000);
const db = openDb(process.env.DATABASE_PATH ?? './dev.db');
const app = createApp({ db, jwtSecret, clientOrigin: process.env.CLIENT_ORIGIN });
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
