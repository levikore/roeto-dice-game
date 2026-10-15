import type { DatabaseSync } from 'node:sqlite';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errors.ts';

export interface AuthUser {
  id: string;
  username: string;
  wins: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

const unauth = () => new ApiError(401, 'UNAUTHENTICATED', 'Please log in');

/** Reads `Authorization: Bearer <jwt>`, verifies it and loads the user from the database. */
export function requireAuth(db: DatabaseSync, jwtSecret: string): RequestHandler {
  const find = db.prepare('SELECT id, username, wins FROM users WHERE id = ?');
  return (req, _res, next) => {
    const match = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
    if (!match) throw unauth();
    let sub: unknown;
    try {
      sub = jwt.verify(match[1], jwtSecret, { algorithms: ['HS256'] }).sub;
    } catch {
      throw unauth(); // bad signature, malformed or expired
    }
    const user = typeof sub === 'string' ? (find.get(sub) as AuthUser | undefined) : undefined;
    if (!user) throw unauth(); // e.g. user was deleted after the token was issued
    req.user = user;
    next();
  };
}
