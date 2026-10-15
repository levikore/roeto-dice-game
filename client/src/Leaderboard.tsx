import { useQuery } from '@tanstack/react-query';
import { api } from './api/client.ts';

interface Props {
  token: string;
  /** Changes when a game ends, so the table is read again. */
  refreshKey: string | null;
}

export default function Leaderboard({ token, refreshKey }: Props) {
  const { data, error, refetch, isFetching } = useQuery({
    queryKey: ['leaderboard', token, refreshKey],
    queryFn: () => api.leaderboard(token),
  });

  return (
    <section className="panel leaderboard" aria-label="Leaderboard">
      <h2>Leaderboard</h2>
      {error && (
        <>
          <p role="alert" className="error">
            {error.message}
          </p>
          <button
            type="button"
            className="secondary"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </>
      )}
      {data && (
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              <th scope="col">Wins</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((row, i) => (
              <tr key={row.userId}>
                <td>{i + 1}</td>
                <td>
                  {row.username}
                  {row.isBot && <span className="muted"> (bot)</span>}
                </td>
                <td>{row.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
