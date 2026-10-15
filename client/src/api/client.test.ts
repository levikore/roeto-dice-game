import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, setUnauthorizedHandler } from './client.ts';

const reply = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends the bearer token, JSON body and method', async () => {
    const fetchMock = reply(200, { game: { id: 'g' }, events: [] });
    vi.stubGlobal('fetch', fetchMock);
    await api.roll('tok', 'g1', 4);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/games/g1/roll');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(JSON.parse(init.body)).toEqual({ expectedVersion: 4 });
  });

  it('sends no Authorization header for login', async () => {
    const fetchMock = reply(200, { token: 't', user: {} });
    vi.stubGlobal('fetch', fetchMock);
    await api.login('alice', 'pw');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('turns an API error body into an ApiError with status and code', async () => {
    vi.stubGlobal(
      'fetch',
      reply(403, { error: { code: 'NOT_YOUR_TURN', message: 'It is not your turn' } }),
    );
    const err = await api.roll('t', 'g').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 403,
      code: 'NOT_YOUR_TURN',
      message: 'It is not your turn',
    });
  });

  it('explains a proxy error page (API down) in plain words', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>', { status: 502 })));
    const err = await api.getGame('t', 'g').catch((e) => e);
    expect(err).toMatchObject({ status: 502, code: 'SERVER_UNAVAILABLE' });
    expect(err.message).toMatch(/not responding/);
  });

  it('keeps a generic message for a non-JSON client error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 404 })));
    const err = await api.getGame('t', 'g').catch((e) => e);
    expect(err).toMatchObject({ status: 404, code: 'UNKNOWN', message: 'Request failed' });
  });

  it('reports a network failure as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    const err = await api.leaderboard('t').catch((e) => e);
    expect(err).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});

describe('expired logins', () => {
  it('tells the app when a stored token is rejected as UNAUTHENTICATED', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal(
      'fetch',
      reply(401, { error: { code: 'UNAUTHENTICATED', message: 'Please log in' } }),
    );
    await api.leaderboard('old-token').catch(() => {});
    expect(handler).toHaveBeenCalledWith('old-token');
    setUnauthorizedHandler(null);
  });

  it('does not fire for wrong credentials on login, or for other errors', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal(
      'fetch',
      reply(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Wrong' } }),
    );
    await api.login('a', 'b').catch(() => {});
    vi.stubGlobal('fetch', reply(403, { error: { code: 'NOT_YOUR_TURN', message: 'No' } }));
    await api.roll('tok', 'g').catch(() => {});
    expect(handler).not.toHaveBeenCalled();
    setUnauthorizedHandler(null);
  });
});
