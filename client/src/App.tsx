import type { GameView } from '@dice/shared';
import { useEffect, useRef, useState } from 'react';
import { ApiError, api, setUnauthorizedHandler } from './api/client.ts';
import Board from './Board.tsx';
import AuthPanel from './AuthPanel.tsx';
import Leaderboard from './Leaderboard.tsx';
import Lobby from './Lobby.tsx';
import { savedGame } from './savedGame.ts';
import { type Session, type Slot, useSessions } from './session.ts';

export default function App() {
  const { sessions, setSession, dropToken } = useSessions();
  const [game, setGame] = useState<GameView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // True while a game remembered from before a page reload is being fetched again.
  const [restoring, setRestoring] = useState(() => savedGame.get() !== null);

  // Leaving a game on purpose (or being signed out) also makes the page forget it.
  const leaveGame = () => {
    setGame(null);
    savedGame.clear();
  };

  // If the server stops accepting a stored login (expired, or the server was reset), sign that player out.
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  useEffect(() => {
    setUnauthorizedHandler((token) => {
      const s = sessionsRef.current;
      const who = s.p1?.token === token ? s.p1 : s.p2?.token === token ? s.p2 : null;
      if (!who) return;
      dropToken(token);
      leaveGame();
      setNotice(`${who.user.username}'s login expired. Please sign in again.`);
    });
    return () => setUnauthorizedHandler(null);
  }, [dropToken]);

  // After a reload: ask the server for the remembered game, trying each signed-in player.
  useEffect(() => {
    const id = savedGame.get();
    if (!id) return;
    let cancelled = false;
    (async () => {
      let serverDown = false;
      for (const s of [sessionsRef.current.p1, sessionsRef.current.p2]) {
        if (!s) continue;
        try {
          const { game: found } = await api.getGame(s.token, id);
          if (cancelled) return;
          if (found.status !== 'ABANDONED') {
            setGame(found);
            setRestoring(false);
            return;
          }
          break; // an abandoned game is not worth reopening
        } catch (e) {
          if (e instanceof ApiError && (e.status === 0 || e.status >= 500)) serverDown = true;
          // 401/403/404: this player cannot open it; try the other one
        }
      }
      if (cancelled) return;
      if (serverDown)
        setNotice('Could not reopen your game: the server is not responding. Reload to try again.');
      else savedGame.clear();
      setRestoring(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Remember the game on screen so a reload can open it again.
  useEffect(() => {
    if (game) savedGame.set(game.id);
  }, [game]);

  const change = (slot: Slot) => (s: Session | null) => {
    setSession(slot, s);
    setNotice(null);
    if (!s) leaveGame(); // leaving a game by logging out
  };

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
      {restoring && sessions.p1 && <p className="muted">Reopening your game…</p>}
      {sessions.p1 && !game && !restoring && <Lobby sessions={sessions} onStarted={setGame} />}
      {game && (
        <Board game={game} sessions={sessions} onGame={setGame} onLeave={leaveGame} />
      )}
      {(sessions.p1 ?? sessions.p2) && (
        <Leaderboard
          token={(sessions.p1 ?? sessions.p2)!.token}
          refreshKey={game?.winnerId ?? null}
        />
      )}
    </main>
  );
}
