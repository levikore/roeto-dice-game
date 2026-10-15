// Runs the API (port 3000) and the web app (port 5173) together; Ctrl+C stops both.
import { spawn } from 'node:child_process';

const run = (workspace, script) =>
  spawn('npm', ['run', script, '-w', workspace], { stdio: 'inherit' });
const children = [run('@dice/server', 'start'), run('@dice/client', 'dev')];

const stop = () => children.forEach((c) => c.kill('SIGTERM'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((c) => c.on('exit', stop));
