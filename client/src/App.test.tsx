import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act as rtlAct, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameView } from '@dice/shared';
import { ApiError, api, notifyUnauthorized } from './api/client.ts';
import App from './App.tsx';

vi.mock('./api/client.ts', async (orig) => ({
  ...(await orig<typeof import('./api/client.ts')>()),
  api: {
    login: vi.fn(),
    register: vi.fn(),
    leaderboard: vi.fn(),
    getGame: vi.fn(),
    createGame: vi.fn(),
    joinGame: vi.fn(),
  },
}));

const renderApp = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <App />
    </QueryClientProvider>,
  );
const panel = (name: string) => within(screen.getByRole('region', { name }));

async function signIn(who: string, username: string) {
  const p = panel(who);
  await userEvent.type(p.getByLabelText('Username'), username);
  await userEvent.type(p.getByLabelText('Password'), 'secret1');
  await userEvent.click(p.getByRole('button', { name: 'Log in' }));
}

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(api.leaderboard).mockResolvedValue({ leaderboard: [] });
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('two-player sign in', () => {
  it('shows a login form for each player', () => {
    renderApp();
    expect(panel('Player 1').getByLabelText('Username')).toBeTruthy();
    expect(panel('Player 2').getByLabelText('Username')).toBeTruthy();
    expect(screen.getByText('Sign in Player 1 to start a game.')).toBeTruthy();
  });

  it('signs one player in without touching the other', async () => {
    vi.mocked(api.login).mockResolvedValue({
      token: 't1',
      user: { id: 'u1', username: 'alice', wins: 3 },
    });
    renderApp();
    await signIn('Player 1', 'alice');
    expect(await panel('Player 1').findByText('alice')).toBeTruthy();
    expect(panel('Player 1').getByText('Wins: 3')).toBeTruthy();
    expect(panel('Player 2').getByLabelText('Username')).toBeTruthy();
    expect(api.login).toHaveBeenCalledWith('alice', 'secret1');
  });

  it('shows the server error message on a failed login', async () => {
    vi.mocked(api.login).mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong username or password'),
    );
    renderApp();
    await signIn('Player 2', 'bob');
    expect((await panel('Player 2').findByRole('alert')).textContent).toBe(
      'Wrong username or password',
    );
    expect(panel('Player 2').getByLabelText('Username')).toBeTruthy();
  });

  it('registers a new account when switched to register mode', async () => {
    vi.mocked(api.register).mockResolvedValue({
      token: 't',
      user: { id: 'u', username: 'carol', wins: 0 },
    });
    renderApp();
    const p = panel('Player 1');
    await userEvent.click(p.getByRole('button', { name: 'Need an account? Register' }));
    await userEvent.type(p.getByLabelText('Username'), 'carol');
    await userEvent.type(p.getByLabelText('Password'), 'secret1');
    await userEvent.click(p.getByRole('button', { name: 'Create account' }));
    expect(await p.findByText('carol')).toBeTruthy();
    expect(api.register).toHaveBeenCalledWith('carol', 'secret1');
  });

  it('logs a player out', async () => {
    vi.mocked(api.login).mockResolvedValue({
      token: 't',
      user: { id: 'u', username: 'alice', wins: 0 },
    });
    renderApp();
    await signIn('Player 1', 'alice');
    await userEvent.click(await panel('Player 1').findByRole('button', { name: 'Log out' }));
    expect(panel('Player 1').getByLabelText('Username')).toBeTruthy();
  });

  it('keeps both logins after a reload (sessionStorage)', async () => {
    vi.mocked(api.login)
      .mockResolvedValueOnce({ token: 't1', user: { id: 'u1', username: 'alice', wins: 0 } })
      .mockResolvedValueOnce({ token: 't2', user: { id: 'u2', username: 'bob', wins: 0 } });
    const first = renderApp();
    await signIn('Player 1', 'alice');
    await panel('Player 1').findByText('alice');
    await signIn('Player 2', 'bob');
    await panel('Player 2').findByText('bob');
    first.unmount();
    renderApp();
    expect(panel('Player 1').getByText('alice')).toBeTruthy();
    expect(panel('Player 2').getByText('bob')).toBeTruthy();
  });

  it('signs a player out with a clear message when the server rejects their stored login', async () => {
    sessionStorage.setItem(
      'dice.sessions',
      JSON.stringify({
        p1: { token: 'old-1', user: { id: 'u1', username: 'alice', wins: 0 } },
        p2: { token: 'ok-2', user: { id: 'u2', username: 'bob', wins: 0 } },
      }),
    );
    renderApp();
    expect(panel('Player 1').getByText('alice')).toBeTruthy();
    await rtlAct(async () => notifyUnauthorized('old-1'));
    expect(await screen.findByText("alice's login expired. Please sign in again.")).toBeTruthy();
    expect(panel('Player 1').getByLabelText('Username')).toBeTruthy(); // login form is back
    expect(panel('Player 2').getByText('bob')).toBeTruthy(); // the other player is untouched
    expect(JSON.parse(sessionStorage.getItem('dice.sessions')!).p1).toBeNull();
  });
});

describe('reopening a game after a page reload', () => {
  const both = {
    p1: { token: 'tok-1', user: { id: 'u1', username: 'alice', wins: 0 } },
    p2: { token: 'tok-2', user: { id: 'u2', username: 'bob', wins: 0 } },
  };
  const game = (o: Partial<GameView> = {}): GameView => ({
    id: 'g1',
    status: 'IN_PROGRESS',
    winningScore: 100,
    players: [
      { userId: 'u1', username: 'alice', globalScore: 40, wins: 0 },
      { userId: 'u2', username: 'bob', globalScore: 25, wins: 0 },
    ],
    currentPlayerId: 'u1',
    roundScore: 7,
    winnerId: null,
    allowedActions: ['ROLL', 'HOLD'],
    lockRemainingMs: 0,
    version: 5,
    ...o,
  });
  const reload = (sessions: object | null = both, gameId: string | null = 'g1') => {
    if (sessions) sessionStorage.setItem('dice.sessions', JSON.stringify(sessions));
    if (gameId) sessionStorage.setItem('dice.gameId', gameId);
    return renderApp();
  };
  const boardVisible = () => screen.queryByRole('region', { name: 'Game' });
  const lobbyVisible = () => screen.queryByRole('region', { name: 'New game' });

  it('opens the same game again, with its scores, instead of the lobby', async () => {
    vi.mocked(api.getGame).mockResolvedValue({ game: game() });
    reload();
    expect(screen.getByText('Reopening your game…')).toBeTruthy();
    expect(lobbyVisible()).toBeNull(); // no flash of the lobby while loading
    expect(await screen.findByRole('region', { name: 'Game' })).toBeTruthy();
    expect(screen.getByText('Round: 7')).toBeTruthy();
    expect(api.getGame).toHaveBeenCalledWith('tok-1', 'g1');
    expect(lobbyVisible()).toBeNull();
  });

  it("tries Player 2's login when Player 1 is not in that game", async () => {
    vi.mocked(api.getGame)
      .mockRejectedValueOnce(new ApiError(403, 'NOT_A_PLAYER', 'You are not a player in this game'))
      .mockResolvedValueOnce({ game: game() });
    reload();
    expect(await screen.findByRole('region', { name: 'Game' })).toBeTruthy();
    expect(api.getGame).toHaveBeenNthCalledWith(2, 'tok-2', 'g1');
  });

  it('falls back to the lobby and forgets the game when it no longer exists', async () => {
    vi.mocked(api.getGame).mockRejectedValue(new ApiError(404, 'GAME_NOT_FOUND', 'Game not found'));
    reload();
    expect(await screen.findByRole('region', { name: 'New game' })).toBeTruthy();
    expect(boardVisible()).toBeNull();
    expect(sessionStorage.getItem('dice.gameId')).toBeNull();
  });

  it('does not reopen an abandoned game', async () => {
    vi.mocked(api.getGame).mockResolvedValue({ game: game({ status: 'ABANDONED' }) });
    reload();
    expect(await screen.findByRole('region', { name: 'New game' })).toBeTruthy();
    expect(boardVisible()).toBeNull();
    expect(sessionStorage.getItem('dice.gameId')).toBeNull();
  });

  it('reopens a finished game so the result is still visible', async () => {
    vi.mocked(api.getGame).mockResolvedValue({
      game: game({ status: 'FINISHED', winnerId: 'u1', currentPlayerId: null, allowedActions: [] }),
    });
    reload();
    expect(await screen.findByText('🏆 alice wins!')).toBeTruthy();
  });

  it('keeps the saved game and says so when the server is down', async () => {
    vi.mocked(api.getGame).mockRejectedValue(
      new ApiError(502, 'SERVER_UNAVAILABLE', 'The server is not responding.'),
    );
    reload();
    expect(await screen.findByText(/Could not reopen your game/)).toBeTruthy();
    expect(sessionStorage.getItem('dice.gameId')).toBe('g1');
  });

  it('asks the server nothing when nobody is signed in', async () => {
    reload(null);
    expect(await screen.findByText('Sign in Player 1 to start a game.')).toBeTruthy();
    expect(api.getGame).not.toHaveBeenCalled();
  });

  it('remembers a game when it starts, and forgets it on Change settings and on log out', async () => {
    vi.mocked(api.createGame).mockResolvedValue({ game: game({ id: 'g9', status: 'WAITING' }) });
    vi.mocked(api.joinGame).mockResolvedValue({ game: game({ id: 'g9' }) });
    reload(both, null);
    await userEvent.click(await screen.findByRole('button', { name: 'Start game' }));
    expect(await screen.findByRole('region', { name: 'Game' })).toBeTruthy();
    expect(sessionStorage.getItem('dice.gameId')).toBe('g9');

    await userEvent.click(screen.getByRole('button', { name: 'Change settings' }));
    expect(sessionStorage.getItem('dice.gameId')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Start game' }));
    await screen.findByRole('region', { name: 'Game' });
    expect(sessionStorage.getItem('dice.gameId')).toBe('g9');
    await userEvent.click(
      within(screen.getByRole('region', { name: 'Player 1' })).getByRole('button', {
        name: 'Log out',
      }),
    );
    expect(sessionStorage.getItem('dice.gameId')).toBeNull();
  });
});
