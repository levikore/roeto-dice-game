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

/** Pause between replayed moves when one request carries several (e.g. the bot's turn). */
const REPLAY_MS = 800
const HISTORY_SHOWN = 20

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

interface Replay {
  rest: GameEvent[] // moves not shown yet
  game: GameView // the state to show once they have all been shown
}

/** Shows exactly what the server says. Buttons come from `allowedActions`; no rules live here. */
export default function Board({ game, sessions, onGame, onLeave }: Props) {
  const [log, setLog] = useState<GameEvent[]>([]) // everything shown so far in this game
  const [replay, setReplay] = useState<Replay | null>(null)
  const all = [sessions.p1, sessions.p2]
  const name = (id: string) => game.players.find((p) => p.userId === id)?.username ?? 'Someone'

  // The server picks whose turn it is; we just use that player's token.
  const actor = all.find((s) => s?.user.id === game.currentPlayerId) ?? null
  // Any player in the game may start a new one.
  const member = all.find((s) => s && game.players.some((p) => p.userId === s.user.id)) ?? null

  // A different game starts with a clean history.
  useEffect(() => {
    setLog([])
    setReplay(null)
  }, [game.id])

  const resync = async () => {
    if (!member) return
    try {
      onGame((await api.getGame(member.token, game.id)).game)
    } catch {
      /* keep showing the last known state */
    }
  }

  // One event shows at once. Several (the bot answered) are shown one by one, then the new state.
  const deliver = (events: GameEvent[], next: GameView) => {
    if (events.length <= 1) {
      setLog((l) => [...l, ...events])
      onGame(next)
      return
    }
    setLog((l) => [...l, events[0]])
    setReplay({ rest: events.slice(1), game: next })
  }

  useEffect(() => {
    if (!replay) return
    if (replay.rest.length === 0) {
      onGame(replay.game)
      setReplay(null)
      return
    }
    const t = setTimeout(() => {
      setLog((l) => [...l, replay.rest[0]])
      setReplay({ rest: replay.rest.slice(1), game: replay.game })
    }, REPLAY_MS)
    return () => clearTimeout(t)
    // `onGame` is a stable state setter from the parent.
  }, [replay])

  const act = useMutation({
    mutationFn: (kind: 'roll' | 'hold') => api[kind](actor!.token, game.id, game.version),
    onSuccess: (res) => deliver(res.events, res.game),
    onError: (e) => {
      if (e instanceof ApiError && e.status !== 0) void resync()
    },
  })

  const restart = useMutation({
    mutationFn: () => api.newGame(member!.token, game.id, game.version),
    onSuccess: (res) => onGame(res.game),
    onError: (e) => {
      if (e instanceof ApiError && e.status !== 0) void resync()
    },
  })

  // After a 6&6 the server tells us how long actions stay locked; then we ask again.
  useEffect(() => {
    if (game.lockRemainingMs <= 0 || replay) return
    const t = setTimeout(() => void resync(), game.lockRemainingMs)
    return () => clearTimeout(t)
    // Re-arm only when the server sends a new lock; game.id and the tokens do not change meanwhile.
  }, [game.lockRemainingMs, game.version, replay])

  const busy = act.isPending || restart.isPending || replay !== null
  const can = (a: 'ROLL' | 'HOLD') => !!actor && !busy && game.allowedActions.includes(a)
  const last = log[log.length - 1]
  const lastDice = [...log].reverse().find((e) => e.dice)?.dice
  const bust = last?.type === 'BUST'
  const error = act.error ?? restart.error
  const winner = game.winnerId && !replay ? name(game.winnerId) : null
  const waitingFor =
    game.status === 'IN_PROGRESS' && !actor && game.currentPlayerId && !replay
      ? name(game.currentPlayerId)
      : null

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

      <div className={`dice${bust ? ' bust' : ''}`} aria-hidden={!lastDice}>
        {lastDice?.map((d, i) => (
          <span key={`${log.length}-${i}`} className="die">
            {face(d)}
          </span>
        ))}
      </div>

      <div className={`messages${bust ? ' bust-message' : ''}`} role="status" aria-live="polite">
        {winner ? (
          <strong>🏆 {winner} wins!</strong>
        ) : (
          last && <p>{describe(last, name)}</p>
        )}
        {game.lockRemainingMs > 0 && !replay && <p>Hold on…</p>}
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

      {log.length > 0 && (
        <details className="history" open>
          <summary>History</summary>
          <ol aria-label="History">
            {[...log]
              .reverse()
              .slice(0, HISTORY_SHOWN)
              .map((e, i) => (
                <li key={log.length - i}>{describe(e, name)}</li>
              ))}
          </ol>
        </details>
      )}
    </section>
  )
}
