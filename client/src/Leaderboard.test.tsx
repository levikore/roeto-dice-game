import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from './api/client.ts';
import Leaderboard from './Leaderboard.tsx';

vi.mock('./api/client.ts', async (orig) => ({
  ...(await orig<typeof import('./api/client.ts')>()),
  api: { leaderboard: vi.fn() },
}));

const show = (refreshKey: string | null) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Leaderboard token="tok" refreshKey={refreshKey} />
  </QueryClientProvider>
);

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Leaderboard', () => {
  it('lists players in the order the server sends, marking the bot', async () => {
    vi.mocked(api.leaderboard).mockResolvedValue({
      leaderboard: [
        { userId: '1', username: 'alice', wins: 4, isBot: false },
        { userId: '2', username: 'bot', wins: 2, isBot: true },
      ],
    });
    render(show(null));
    const rows = await within(await screen.findByRole('table')).findAllByRole('row');
    expect(rows.map((r) => r.textContent)).toEqual(['#PlayerWins', '1alice4', '2bot (bot)2']);
    expect(api.leaderboard).toHaveBeenCalledWith('tok');
  });

  it('reads the table again when a game ends (refreshKey changes)', async () => {
    vi.mocked(api.leaderboard).mockResolvedValue({ leaderboard: [] });
    const { rerender } = render(show(null));
    await screen.findByRole('table');
    expect(api.leaderboard).toHaveBeenCalledTimes(1);
    rerender(show('winner-id'));
    await vi.waitFor(() => expect(api.leaderboard).toHaveBeenCalledTimes(2));
  });

  it('shows the error message when loading fails', async () => {
    vi.mocked(api.leaderboard).mockRejectedValue(
      new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server'),
    );
    render(show(null));
    expect((await screen.findByRole('alert')).textContent).toBe('Cannot reach the server');
  });
});
