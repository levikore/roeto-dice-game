import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ApiError } from './errors.ts';
import { requireAuth } from './requireAuth.ts';

const credentials = z.object({
  username: z
    .string()
    .regex(/^[A-Za-z0-9_]{3,20}$/, 'Username must be 3-20 letters, digits or underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
});

export interface AuthDeps {
  db: DatabaseSync;
  jwtSecret: string;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  wins: number;
}

const TOKEN_TTL = '24h';
// Compared against when the user does not exist, so timing doesn't reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export function authRouter({ db, jwtSecret }: AuthDeps): Router {
  const router = Router();
  const sign = (u: UserRow) => jwt.sign({ sub: u.id }, jwtSecret, { expiresIn: TOKEN_TTL });
  const publicUser = (u: UserRow) => ({ id: u.id, username: u.username, wins: u.wins });

  router.post('/register', (req, res) => {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', parsed.error.issues[0].message);
    }
    const { username, password } = parsed.data;
    const user: UserRow = {
      id: randomUUID(),
      username,
      password_hash: bcrypt.hashSync(password, 10),
      wins: 0,
    };
    try {
      db.prepare(
        'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)',
      ).run(user.id, user.username, user.password_hash, Date.now());
    } catch (e) {
      if (e instanceof Error && /UNIQUE/.test(e.message)) {
        throw new ApiError(409, 'USERNAME_TAKEN', 'That username is already taken');
      }
      throw e;
    }
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  });

  router.post('/login', (req, res) => {
    const parsed = credentials.safeParse(req.body);
    const bad = new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong username or password');
    if (!parsed.success) throw bad;
    const row = db
      .prepare('SELECT * FROM users WHERE username = ? AND is_bot = 0')
      .get(parsed.data.username) as UserRow | undefined;
    // Same error and similar work whether the user or the password is wrong.
    const hash = row?.password_hash ?? DUMMY_HASH;
    const match = bcrypt.compareSync(parsed.data.password, hash);
    if (!row || !match) throw bad;
    res.json({ token: sign(row), user: publicUser(row) });
  });

  router.get('/me', requireAuth(db, jwtSecret), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
