import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import type { GameService } from '../game/service.ts';
import { ApiError } from './errors.ts';

const createBody = z.object({
  winningScore: z.number().optional(),
  opponent: z.enum(['human', 'bot']).optional(),
});
const actionBody = z.object({ expectedVersion: z.number().int().min(0).optional() });
const gameId = z.string().min(1).max(64);

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value ?? {});
  if (!r.success) throw new ApiError(400, 'VALIDATION_ERROR', r.error.issues[0].message);
  return r.data;
}

/** All routes here sit behind requireAuth, so `req.user` is always set. */
const userId = (req: Request) => req.user!.id;
const idParam = (req: Request) => parse(gameId, req.params.id);

export function gamesRouter(games: GameService): Router {
  const router = Router();

  router.post('/', (req, res) => {
    const body = parse(createBody, req.body);
    res.status(201).json({ game: games.create(userId(req), body) });
  });

  router.get('/:id', (req, res) => {
    res.json({ game: games.get(idParam(req), userId(req)) });
  });

  router.post('/:id/join', (req, res) => {
    res.json({ game: games.join(idParam(req), userId(req)) });
  });

  router.post('/:id/new', (req, res) => {
    const { expectedVersion } = parse(actionBody, req.body);
    res.status(201).json({ game: games.newGame(idParam(req), userId(req), expectedVersion) });
  });

  for (const [path, type] of [
    ['roll', 'ROLL'],
    ['hold', 'HOLD'],
  ] as const) {
    router.post(`/:id/${path}`, (req, res) => {
      const { expectedVersion } = parse(actionBody, req.body);
      res.json(games.act(idParam(req), userId(req), { type }, expectedVersion));
    });
  }

  return router;
}
