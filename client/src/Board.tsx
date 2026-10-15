import type { GameEvent, GameView } from '@dice/shared'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ApiError, api } from './api/client.ts'
import type { Sessions } from './session.ts'

interface Props {
  game: GameView
  sessions: Sessions
  onGame: (game: GameView) => void
  onLeave: () => void
}

// Unicode die faces ⚀-⚅: pure presentation of a number the server sent.
const face = (n: number) => String.fromCodePoint(0x267f + n)

function describe(e: GameEvent, name: (id: string) => string): string {
  const who = name(e.userId)
  switch (e.type) {
    case 'ROLL':
      return `${who} rolled ${e.dice?.join(' + ')} (+${e.scoreDelta})`
    case 'BUST':
      return `💥 Double six! ${who} loses the round score`
    case 'HOLD':
      return `${who} held and banked ${e.scoreDelta}`
    case 'WIN':
      return `🏆 ${who} wins!`
    default:
      return ''
  }
}

/** Shows exactly what the server says. Buttons come from `allowedActions`; no rules live here. */
export default function Board({ game, sessions, onGame, onLeave }: Props) {
  const [events, setEvents] = useState<GameEvent[]>([])
  const all = [sessions.p1, sessions.p2]
  const name = (id: string) => game.players.find((p) => p.userId === id)?.username ?? 'Someone'

  // The server picks whose turn it is; we just use that player's token.
  const actor = all.find((s) => s?.user.id === game.currentPlayerId) ?? null
  // Any player in the game may start a new one.
  const member = all.find((s) => s && game.players.some((p) => p.userId === s.user.id)) ?? null

  const resync = async () => {
    if (!member) return
    try {
      onGame((await api.getGame(member.token, game.id)).game)
    } catch {
      /* keep showing the last known state */
    }
  }

  const act = useMutation({
    mutationFn: (kind: 'roll' | 'hold') => api[kind](actor!.token, game.id, game.version),
    onSuccess: (res) => {
      setEvents(res.events)
      onGame(res.game)
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status !== 0) void resync()
    },
  })

  const restart = useMutation({
    mutationFn: () => api.newGame(member!.token, game.id, game.version),
    onSuccess: (res) => {
      setEvents([])
      onGame(res.game)
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status !== 0) void resync()
    },
  })

  // After a 6&6 the server tells us how long actions stay locked; then we ask again.
  useEffect(() => {
    if (game.lockRemainingMs <= 0) return
    const t = setTimeout(() => void resync(), game.lockRemainingMs)
    return () => clearTimeout(t)
    // Re-arm only when the server sends a new lock; game.id and the tokens do not change meanwhile.
  }, [game.lockRemainingMs, game.version])

  const busy = act.isPending || restart.isPending
  const can = (a: 'ROLL' | 'HOLD') => !!actor && !busy && game.allowedActions.includes(a)
  const lastDice = [...events].reverse().find((e) => e.dice)?.dice
  const error = act.error ?? restart.error
  const winner = game.winnerId ? name(game.winnerId) : null
  const waitingFor =
    game.status === 'IN_PROGRESS' && !actor && game.currentPlayerId ? name(game.currentPlayerId) : null

  return (
    <section className="board" aria-label="Game">
      <p className="muted">First to {game.winningScore}</p>
      <div className="cards">
        {game.players.map((p) => {
          const active = p.userId === game.currentPlayerId
          return (
            <article key={p.userId} className={`card${active ? ' active' : ''}`} aria-current={active}>
              <h3>{p.username}</h3>
              <div className="score">
                <span className="sr-only">{p.username} total score </span>
                {p.globalScore}
              </div>
              <p className="muted">Wins: {p.wins}</p>
              {active && <p className="round">Round: {game.roundScore}</p>}
            </article>
          )
        })}
      </div>

      <div className="dice" aria-hidden={!lastDice}>
        {lastDice?.map((d, i) => (
          <span key={i} className="die">
            {face(d)}
          </span>
        ))}
      </div>

      <div className="messages" role="status" aria-live="polite">
        {winner ? <strong>🏆 {winner} wins!</strong> : events.map((e, i) => <p key={i}>{describe(e, name)}</p>)}
        {game.lockRemainingMs > 0 && <p>Hold on…</p>}
        {waitingFor && <p>Waiting for {waitingFor}…</p>}
      </div>

      <div role="alert" className="error">
        {error?.message}
      </div>

      <div className="actions">
        <button type="button" disabled={!can('ROLL')} onClick={() => act.mutate('roll')}>
          Roll
        </button>
        <button type="button" disabled={!can('HOLD')} onClick={() => act.mutate('hold')}>
          Hold
        </button>
        <button type="button" className="secondary" disabled={busy || !member} onClick={() => restart.mutate()}>
          New game
        </button>
        <button type="button" className="secondary" onClick={onLeave}>
          Change settings
        </button>
      </div>
    </section>
  )
}
