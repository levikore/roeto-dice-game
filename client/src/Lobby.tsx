import { useMutation } from '@tanstack/react-query'
import type { GameView } from '@dice/shared'
import { useState } from 'react'
import { api } from './api/client.ts'
import type { Sessions } from './session.ts'

interface Props {
  sessions: Sessions
  onStarted: (game: GameView) => void
}

type Opponent = 'human' | 'bot'

/** Collects the options and asks the API to create (and join) the game. It decides nothing itself. */
export default function Lobby({ sessions, onStarted }: Props) {
  const { p1, p2 } = sessions
  const [winningScore, setWinningScore] = useState('')
  const [opponent, setOpponent] = useState<Opponent>('human')

  const start = useMutation({
    mutationFn: async () => {
      // An empty box means "use the server default"; any other value is validated by the server.
      const body = {
        ...(winningScore.trim() !== '' && { winningScore: Number(winningScore) }),
        opponent,
      }
      const created = await api.createGame(p1!.token, body)
      if (opponent === 'bot') return created.game
      return (await api.joinGame(p2!.token, created.game.id)).game
    },
    onSuccess: (g) => onStarted(g),
  })

  if (!p1) return null
  const needsPlayer2 = opponent === 'human' && !p2

  return (
    <section className="panel lobby" aria-label="New game">
      <h2>New game</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          start.mutate()
        }}
      >
        <label>
          Winning score
          <input
            inputMode="numeric"
            placeholder="100 (default)"
            value={winningScore}
            onChange={(e) => setWinningScore(e.target.value)}
          />
        </label>
        <fieldset>
          <legend>Opponent for {p1.user.username}</legend>
          <label className="radio">
            <input
              type="radio"
              name="opponent"
              checked={opponent === 'human'}
              onChange={() => setOpponent('human')}
            />
            Player 2 {p2 ? `(${p2.user.username})` : '(sign in above)'}
          </label>
          <label className="radio">
            <input
              type="radio"
              name="opponent"
              checked={opponent === 'bot'}
              onChange={() => setOpponent('bot')}
            />
            Bot
          </label>
        </fieldset>
        <div role="alert" className="error">
          {start.error?.message}
        </div>
        <button type="submit" disabled={start.isPending || needsPlayer2}>
          {start.isPending ? 'Starting…' : 'Start game'}
        </button>
      </form>
    </section>
  )
}
