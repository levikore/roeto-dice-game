import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GameView } from '@dice/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api/client.ts'
import Lobby from './Lobby.tsx'
import type { Sessions } from './session.ts'

vi.mock('./api/client.ts', async (orig) => ({
  ...(await orig<typeof import('./api/client.ts')>()),
  api: { createGame: vi.fn(), joinGame: vi.fn() },
}))

const user = (id: string, username: string) => ({ token: `tok-${id}`, user: { id, username, wins: 0 } })
const both: Sessions = { p1: user('1', 'alice'), p2: user('2', 'bob') }
const onlyP1: Sessions = { p1: user('1', 'alice'), p2: null }
const game = { id: 'g1', status: 'IN_PROGRESS', winningScore: 50, players: [] } as unknown as GameView

const renderLobby = (sessions: Sessions, onStarted = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <Lobby sessions={sessions} onStarted={onStarted} />
    </QueryClientProvider>,
  )
  return onStarted
}
const start = () => userEvent.click(screen.getByRole('button', { name: 'Start game' }))

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('Lobby', () => {
  it('renders nothing until Player 1 is signed in', () => {
    renderLobby({ p1: null, p2: null })
    expect(screen.queryByRole('region', { name: 'New game' })).toBeNull()
  })

  it('creates with P1 and joins with P2 using their own tokens; empty score is omitted', async () => {
    vi.mocked(api.createGame).mockResolvedValue({ game: { ...game, id: 'g1' } })
    vi.mocked(api.joinGame).mockResolvedValue({ game })
    const onStarted = renderLobby(both)
    await start()
    expect(api.createGame).toHaveBeenCalledWith('tok-1', { opponent: 'human' })
    expect(api.joinGame).toHaveBeenCalledWith('tok-2', 'g1')
    expect(onStarted).toHaveBeenCalledWith(game)
  })

  it('sends the typed winning score as a number', async () => {
    vi.mocked(api.createGame).mockResolvedValue({ game })
    vi.mocked(api.joinGame).mockResolvedValue({ game })
    renderLobby(both)
    await userEvent.type(screen.getByLabelText('Winning score'), '50')
    await start()
    expect(api.createGame).toHaveBeenCalledWith('tok-1', { winningScore: 50, opponent: 'human' })
  })

  it('starts a bot game with one call and no join, even without Player 2', async () => {
    vi.mocked(api.createGame).mockResolvedValue({ game })
    const onStarted = renderLobby(onlyP1)
    await userEvent.click(screen.getByLabelText('Bot'))
    await start()
    expect(api.createGame).toHaveBeenCalledWith('tok-1', { opponent: 'bot' })
    expect(api.joinGame).not.toHaveBeenCalled()
    expect(onStarted).toHaveBeenCalledWith(game)
  })

  it('disables Start while a human opponent is not signed in', () => {
    renderLobby(onlyP1)
    expect((screen.getByRole('button', { name: 'Start game' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows the server message for a rejected winning score and does not start', async () => {
    vi.mocked(api.createGame).mockRejectedValue(
      new ApiError(400, 'INVALID_WINNING_SCORE', 'Winning score must be a whole number from 10 to 1000'),
    )
    const onStarted = renderLobby(both)
    await userEvent.type(screen.getByLabelText('Winning score'), '5')
    await start()
    expect((await screen.findByRole('alert')).textContent).toMatch(/whole number from 10 to 1000/)
    expect(onStarted).not.toHaveBeenCalled()
  })
})
