import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GameView } from '@dice/shared'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api/client.ts'
import Board from './Board.tsx'
import type { Sessions } from './session.ts'

vi.mock('./api/client.ts', async (orig) => ({
  ...(await orig<typeof import('./api/client.ts')>()),
  api: { roll: vi.fn(), hold: vi.fn(), getGame: vi.fn(), newGame: vi.fn() },
}))

const sessions: Sessions = {
  p1: { token: 'tok-a', user: { id: 'a', username: 'alice', wins: 0 } },
  p2: { token: 'tok-b', user: { id: 'b', username: 'bob', wins: 2 } },
}
const mk = (o: Partial<GameView> = {}): GameView => ({
  id: 'g1',
  status: 'IN_PROGRESS',
  winningScore: 100,
  players: [
    { userId: 'a', username: 'alice', globalScore: 20, wins: 0 },
    { userId: 'b', username: 'bob', globalScore: 35, wins: 2 },
  ],
  currentPlayerId: 'a',
  roundScore: 9,
  winnerId: null,
  allowedActions: ['ROLL', 'HOLD'],
  lockRemainingMs: 0,
  version: 7,
  ...o,
})

function Host({ start, onLeave = () => {} }: { start: GameView; onLeave?: () => void }) {
  const [game, setGame] = useState(start)
  return <Board game={game} sessions={sessions} onGame={setGame} onLeave={onLeave} />
}
const show = (start: GameView, onLeave?: () => void) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <Host start={start} onLeave={onLeave} />
    </QueryClientProvider>,
  )
const btn = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  vi.useRealTimers()
})

describe('Board rendering', () => {
  it('shows both players, scores, wins, and the round score for the active player only', () => {
    show(mk())
    expect(screen.getByText('First to 100')).toBeTruthy()
    expect(screen.getByText('alice total score').parentElement?.textContent).toMatch(/20$/)
    expect(screen.getByText('bob total score').parentElement?.textContent).toMatch(/35$/)
    expect(screen.getByText('Wins: 2')).toBeTruthy()
    expect(screen.getAllByText(/Round:/)).toHaveLength(1)
    expect(screen.getByText('Round: 9')).toBeTruthy()
  })

  it('enables buttons exactly as allowedActions says', () => {
    show(mk({ allowedActions: ['ROLL'], roundScore: 0 }))
    expect(btn('Roll').disabled).toBe(false)
    expect(btn('Hold').disabled).toBe(true)
  })

  it('disables Roll and Hold while locked and after the game ends, and names the winner', () => {
    const { unmount } = show(mk({ allowedActions: [], lockRemainingMs: 1200 }))
    expect(btn('Roll').disabled).toBe(true)
    expect(btn('Hold').disabled).toBe(true)
    unmount()
    show(mk({ status: 'FINISHED', allowedActions: [], winnerId: 'b', currentPlayerId: null }))
    expect(screen.getByText('🏆 bob wins!')).toBeTruthy()
    expect(btn('Roll').disabled).toBe(true)
    expect(btn('New game').disabled).toBe(false)
  })
})

describe('Board actions', () => {
  it("rolls with the current player's token and version, then renders the server's answer", async () => {
    vi.mocked(api.roll).mockResolvedValue({
      game: mk({ roundScore: 16, version: 8 }),
      events: [{ type: 'ROLL', userId: 'a', dice: [3, 4], scoreDelta: 7 }],
    })
    show(mk())
    await userEvent.click(btn('Roll'))
    expect(api.roll).toHaveBeenCalledWith('tok-a', 'g1', 7)
    expect(await screen.findByText('Round: 16')).toBeTruthy()
    expect(screen.getByText('alice rolled 3 + 4 (+7)')).toBeTruthy()
  })

  it('uses the other player\'s token when the server says it is their turn', async () => {
    vi.mocked(api.hold).mockResolvedValue({ game: mk(), events: [] })
    show(mk({ currentPlayerId: 'b' }))
    await userEvent.click(btn('Hold'))
    expect(api.hold).toHaveBeenCalledWith('tok-b', 'g1', 7)
  })

  it('shows the double-six message from a BUST event', async () => {
    vi.mocked(api.roll).mockResolvedValue({
      game: mk({ roundScore: 0, currentPlayerId: 'b', allowedActions: [], lockRemainingMs: 1500, version: 8 }),
      events: [{ type: 'BUST', userId: 'a', dice: [6, 6], scoreDelta: -9 }],
    })
    show(mk())
    await userEvent.click(btn('Roll'))
    expect(await screen.findByText('💥 Double six! alice loses the round score')).toBeTruthy()
    expect(btn('Roll').disabled).toBe(true)
  })

  it('asks the server again when the lock time is up', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.getGame).mockResolvedValue({ game: mk({ allowedActions: ['ROLL'], roundScore: 0 }) })
    show(mk({ allowedActions: [], lockRemainingMs: 1500, roundScore: 0 }))
    expect(api.getGame).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1500)
    await waitFor(() => expect(api.getGame).toHaveBeenCalledWith('tok-a', 'g1'))
    await waitFor(() => expect(btn('Roll').disabled).toBe(false))
  })

  it('shows the server error and re-syncs the game', async () => {
    vi.mocked(api.roll).mockRejectedValue(new ApiError(409, 'STALE_VERSION', 'The game changed; reload and try again'))
    vi.mocked(api.getGame).mockResolvedValue({ game: mk({ version: 9, roundScore: 12 }) })
    show(mk())
    await userEvent.click(btn('Roll'))
    expect((await screen.findByRole('alert')).textContent).toBe('The game changed; reload and try again')
    expect(await screen.findByText('Round: 12')).toBeTruthy()
  })

  it('starts a new game with a member token and shows it', async () => {
    vi.mocked(api.newGame).mockResolvedValue({ game: mk({ id: 'g2', roundScore: 0, version: 0, allowedActions: ['ROLL'] }) })
    show(mk())
    await userEvent.click(btn('New game'))
    expect(api.newGame).toHaveBeenCalledWith('tok-a', 'g1', 7)
    expect(await screen.findByText('Round: 0')).toBeTruthy()
  })

  it('leaves for the lobby on Change settings', async () => {
    const onLeave = vi.fn()
    show(mk(), onLeave)
    await userEvent.click(btn('Change settings'))
    expect(onLeave).toHaveBeenCalled()
  })

  it('says it is waiting when the current player has no token here (the bot)', () => {
    show(mk({ currentPlayerId: 'bot-id', players: [
      { userId: 'a', username: 'alice', globalScore: 0, wins: 0 },
      { userId: 'bot-id', username: 'bot', globalScore: 0, wins: 0 },
    ] }))
    expect(screen.getByText('Waiting for bot…')).toBeTruthy()
    expect(btn('Roll').disabled).toBe(true)
  })
})
