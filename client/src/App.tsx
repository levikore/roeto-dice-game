import type { GameView } from '@dice/shared'
import { useEffect, useRef, useState } from 'react'
import { setUnauthorizedHandler } from './api/client.ts'
import Board from './Board.tsx'
import AuthPanel from './AuthPanel.tsx'
import Leaderboard from './Leaderboard.tsx'
import Lobby from './Lobby.tsx'
import { type Session, type Slot, useSessions } from './session.ts'

export default function App() {
  const { sessions, setSession, dropToken } = useSessions()
  const [game, setGame] = useState<GameView | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // If the server stops accepting a stored login (expired, or the server was reset), sign that player out.
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions
  useEffect(() => {
    setUnauthorizedHandler((token) => {
      const s = sessionsRef.current
      const who = s.p1?.token === token ? s.p1 : s.p2?.token === token ? s.p2 : null
      if (!who) return
      dropToken(token)
      setGame(null)
      setNotice(`${who.user.username}'s login expired. Please sign in again.`)
    })
    return () => setUnauthorizedHandler(null)
  }, [dropToken])

  const change = (slot: Slot) => (s: Session | null) => {
    setSession(slot, s)
    setNotice(null)
    if (!s) setGame(null) // leaving a game by logging out
  }

  return (
    <main className="app">
      <h1>Dice Game</h1>
      <div className="panels">
        <AuthPanel title="Player 1" session={sessions.p1} onChange={change('p1')} />
        <AuthPanel title="Player 2" session={sessions.p2} onChange={change('p2')} />
      </div>
      {notice && (
        <p role="alert" className="error">
          {notice}
        </p>
      )}
      {!sessions.p1 && <p className="muted">Sign in Player 1 to start a game.</p>}
      {sessions.p1 && !game && <Lobby sessions={sessions} onStarted={setGame} />}
      {game && (
        <Board game={game} sessions={sessions} onGame={setGame} onLeave={() => setGame(null)} />
      )}
      {(sessions.p1 ?? sessions.p2) && (
        <Leaderboard token={(sessions.p1 ?? sessions.p2)!.token} refreshKey={game?.winnerId ?? null} />
      )}
    </main>
  )
}
