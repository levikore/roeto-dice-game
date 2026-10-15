import type { GameView } from '@dice/shared'
import { useState } from 'react'
import Board from './Board.tsx'
import AuthPanel from './AuthPanel.tsx'
import Lobby from './Lobby.tsx'
import { type Session, type Slot, useSessions } from './session.ts'

export default function App() {
  const { sessions, setSession } = useSessions()
  const [game, setGame] = useState<GameView | null>(null)

  const change = (slot: Slot) => (s: Session | null) => {
    setSession(slot, s)
    if (!s) setGame(null) // leaving a game by logging out
  }

  return (
    <main className="app">
      <h1>Dice Game</h1>
      <div className="panels">
        <AuthPanel title="Player 1" session={sessions.p1} onChange={change('p1')} />
        <AuthPanel title="Player 2" session={sessions.p2} onChange={change('p2')} />
      </div>
      {!sessions.p1 && <p className="muted">Sign in Player 1 to start a game.</p>}
      {sessions.p1 && !game && <Lobby sessions={sessions} onStarted={setGame} />}
      {game && (
        <Board game={game} sessions={sessions} onGame={setGame} onLeave={() => setGame(null)} />
      )}
    </main>
  )
}
