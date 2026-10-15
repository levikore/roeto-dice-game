import type { DatabaseSync } from 'node:sqlite';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { authRouter } from './http/auth.ts';
import { errorHandler } from './http/errors.ts';

export interface AppDeps {
  db: DatabaseSync;
  jwtSecret: string;
  /** The one browser origin allowed to call the API. */
  clientOrigin?: string;
  /** Limit for login/register attempts per IP. */
  authRateLimit?: { windowMs: number; max: number };
}

export function createApp(deps: AppDeps) {
  const { clientOrigin = 'http://localhost:5173', authRateLimit = { windowMs: 60_000, max: 30 } } =
    deps;
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '10kb' }));

  const limiter = rateLimit({
    ...authRateLimit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, try again later' },
      });
    },
  });
  app.use('/api/auth/login', limiter);
  app.use('/api/auth/register', limiter);

  app.use('/api/auth', authRouter(deps));
  app.use(errorHandler);
  return app;
}
