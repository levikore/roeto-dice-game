import type {
  ActionResponse,
  ApiErrorBody,
  AuthResponse,
  GameResponse,
  LeaderboardEntry,
  UserDto,
} from '@dice/shared';

const BASE = '/api';

/** An error returned by the API: a stable `code` plus a human-readable message. */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let unauthorizedHandler: ((token: string) => void) | null = null;

/** The app registers one handler: it is told when a stored token is no longer accepted. */
export function setUnauthorizedHandler(fn: ((token: string) => void) | null) {
  unauthorizedHandler = fn;
}

export function notifyUnauthorized(token: string) {
  unauthorizedHandler?.(token);
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server');
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    // A token the server no longer accepts (expired, or the server was reset) means "sign in again".
    if (res.status === 401 && err?.code === 'UNAUTHENTICATED' && opts.token) {
      notifyUnauthorized(opts.token);
    }
    if (!err && res.status >= 500) {
      // A proxy answered instead of the API (e.g. 502 while the API is down): not our JSON error shape.
      throw new ApiError(
        res.status,
        'SERVER_UNAVAILABLE',
        'The server is not responding. Please try again in a moment.',
      );
    }
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? 'Request failed');
  }
  return data as T;
}

/** Every call the UI makes. The client sends actions; the server decides what they do. */
export const api = {
  register: (username: string, password: string) =>
    request<AuthResponse>('POST', '/auth/register', { body: { username, password } }),
  login: (username: string, password: string) =>
    request<AuthResponse>('POST', '/auth/login', { body: { username, password } }),
  me: (token: string) => request<{ user: UserDto }>('GET', '/auth/me', { token }),

  createGame: (token: string, body: { winningScore?: number; opponent?: 'human' | 'bot' }) =>
    request<GameResponse>('POST', '/games', { token, body }),
  joinGame: (token: string, id: string) =>
    request<GameResponse>('POST', `/games/${id}/join`, { token }),
  getGame: (token: string, id: string) => request<GameResponse>('GET', `/games/${id}`, { token }),
  roll: (token: string, id: string, expectedVersion?: number) =>
    request<ActionResponse>('POST', `/games/${id}/roll`, { token, body: { expectedVersion } }),
  hold: (token: string, id: string, expectedVersion?: number) =>
    request<ActionResponse>('POST', `/games/${id}/hold`, { token, body: { expectedVersion } }),
  newGame: (token: string, id: string, expectedVersion?: number) =>
    request<GameResponse>('POST', `/games/${id}/new`, { token, body: { expectedVersion } }),

  leaderboard: (token: string) =>
    request<{ leaderboard: LeaderboardEntry[] }>('GET', '/leaderboard', { token }),
};
