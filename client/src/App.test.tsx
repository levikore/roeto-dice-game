import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api/client.ts'
import App from './App.tsx'

vi.mock('./api/client.ts', async (orig) => ({
  ...(await orig<typeof import('./api/client.ts')>()),
  api: { login: vi.fn(), register: vi.fn() },
}))

const renderApp = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
      <App />
    </QueryClientProvider>,
  )
const panel = (name: string) => within(screen.getByRole('region', { name }))

async function signIn(who: string, username: string) {
  const p = panel(who)
  await userEvent.type(p.getByLabelText('Username'), username)
  await userEvent.type(p.getByLabelText('Password'), 'secret1')
  await userEvent.click(p.getByRole('button', { name: 'Log in' }))
}

beforeEach(() => sessionStorage.clear())
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('two-player sign in', () => {
  it('shows a login form for each player', () => {
    renderApp()
    expect(panel('Player 1').getByLabelText('Username')).toBeTruthy()
    expect(panel('Player 2').getByLabelText('Username')).toBeTruthy()
    expect(screen.getByText('Sign in Player 1 to start a game.')).toBeTruthy()
  })

  it('signs one player in without touching the other', async () => {
    vi.mocked(api.login).mockResolvedValue({ token: 't1', user: { id: 'u1', username: 'alice', wins: 3 } })
    renderApp()
    await signIn('Player 1', 'alice')
    expect(await panel('Player 1').findByText('alice')).toBeTruthy()
    expect(panel('Player 1').getByText('Wins: 3')).toBeTruthy()
    expect(panel('Player 2').getByLabelText('Username')).toBeTruthy()
    expect(api.login).toHaveBeenCalledWith('alice', 'secret1')
  })

  it('shows the server error message on a failed login', async () => {
    vi.mocked(api.login).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong username or password'))
    renderApp()
    await signIn('Player 2', 'bob')
    expect((await panel('Player 2').findByRole('alert')).textContent).toBe('Wrong username or password')
    expect(panel('Player 2').getByLabelText('Username')).toBeTruthy()
  })

  it('registers a new account when switched to register mode', async () => {
    vi.mocked(api.register).mockResolvedValue({ token: 't', user: { id: 'u', username: 'carol', wins: 0 } })
    renderApp()
    const p = panel('Player 1')
    await userEvent.click(p.getByRole('button', { name: 'Need an account? Register' }))
    await userEvent.type(p.getByLabelText('Username'), 'carol')
    await userEvent.type(p.getByLabelText('Password'), 'secret1')
    await userEvent.click(p.getByRole('button', { name: 'Create account' }))
    expect(await p.findByText('carol')).toBeTruthy()
    expect(api.register).toHaveBeenCalledWith('carol', 'secret1')
  })

  it('logs a player out', async () => {
    vi.mocked(api.login).mockResolvedValue({ token: 't', user: { id: 'u', username: 'alice', wins: 0 } })
    renderApp()
    await signIn('Player 1', 'alice')
    await userEvent.click(await panel('Player 1').findByRole('button', { name: 'Log out' }))
    expect(panel('Player 1').getByLabelText('Username')).toBeTruthy()
  })

  it('keeps both logins after a reload (sessionStorage)', async () => {
    vi.mocked(api.login)
      .mockResolvedValueOnce({ token: 't1', user: { id: 'u1', username: 'alice', wins: 0 } })
      .mockResolvedValueOnce({ token: 't2', user: { id: 'u2', username: 'bob', wins: 0 } })
    const first = renderApp()
    await signIn('Player 1', 'alice')
    await panel('Player 1').findByText('alice')
    await signIn('Player 2', 'bob')
    await panel('Player 2').findByText('bob')
    first.unmount()
    renderApp()
    expect(panel('Player 1').getByText('alice')).toBeTruthy()
    expect(panel('Player 2').getByText('bob')).toBeTruthy()
  })
})
