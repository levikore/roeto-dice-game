import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page, panel: string, username: string) {
  const p = page.getByRole('region', { name: panel });
  await p.getByLabel('Username').fill(username);
  await p.getByLabel('Password').fill('demo1234');
  await p.getByRole('button', { name: 'Log in' }).click();
  await expect(p.getByText(`Signed in as`)).toBeVisible();
}

test('two players log in, play a 10-point game to a win, and the win is counted', async ({
  page,
}) => {
  await page.goto('/');

  await signIn(page, 'Player 1', 'alice');
  await signIn(page, 'Player 2', 'bob');

  const lobby = page.getByRole('region', { name: 'New game' });
  await lobby.getByLabel('Winning score').fill('10');
  await lobby.getByRole('button', { name: 'Start game' }).click();

  const board = page.getByRole('region', { name: 'Game' });
  await expect(board.getByText('First to 10')).toBeVisible();

  // Play like a user: roll, and hold as soon as the server allows it. A click on a button the
  // server just disabled (win, or pause after a double six) is simply tried again.
  const roll = board.getByRole('button', { name: 'Roll' });
  const hold = board.getByRole('button', { name: 'Hold' });
  const winner = board.getByRole('status').getByText(/wins!/);
  const tryClick = (b: typeof roll) => b.click({ timeout: 1500 }).catch(() => {});
  for (let i = 0; i < 200 && !(await winner.isVisible()); i++) {
    if (await hold.isEnabled()) await tryClick(hold);
    else if (await roll.isEnabled()) await tryClick(roll);
    else await page.waitForTimeout(100);
  }

  await expect(winner).toBeVisible();
  await expect(roll).toBeDisabled();
  await expect(hold).toBeDisabled();

  // The server counted exactly one win, shown in the leaderboard.
  const rows = page.getByRole('region', { name: 'Leaderboard' }).getByRole('row');
  await expect(rows.filter({ hasText: /^[12](alice|bob)1$/ })).toHaveCount(1);
});
