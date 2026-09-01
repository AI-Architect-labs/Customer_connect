import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('AgriConnect setup: installing root npm dependencies...');
run('npm', ['install', '--no-audit', '--no-fund']);
console.log('Installing Cloud Functions dependencies...');
run('npm', ['install', '--no-audit', '--no-fund'], { cwd: new URL('../functions/', import.meta.url) });
console.log('Installing Python helper dependencies from requirements.txt...');
const python = process.platform === 'win32' ? 'python' : 'python3';
run(python, ['-m', 'pip', 'install', '-r', 'requirements.txt']);
console.log('Setup complete. Copy .env.local.example to .env.local before running the app.');
