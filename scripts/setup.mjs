// One-time setup: creates .env with a random JWT secret (if missing) and seeds the demo users.
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('.env')) {
  copyFileSync('.env.example', '.env');
  const env = readFileSync('.env', 'utf8').replace(
    /^JWT_SECRET=.*$/m,
    `JWT_SECRET=${randomBytes(32).toString('hex')}`,
  );
  writeFileSync('.env', env);
  console.log('Created .env with a random JWT_SECRET');
}
const seed = spawnSync('npm', ['run', 'seed', '-w', '@dice/server'], { stdio: 'inherit' });
process.exit(seed.status ?? 1);
