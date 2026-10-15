const KEY = 'dice.gameId';

// Remembers which game is on screen so a page reload can open it again.
// sessionStorage can be missing or blocked, so every access is guarded.
export const savedGame = {
  get(): string | null {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(id: string) {
    try {
      sessionStorage.setItem(KEY, id);
    } catch {
      /* the app still works, it just won't survive a reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};
