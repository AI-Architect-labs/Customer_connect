import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.execPath,
  [
    'node_modules/firebase-tools/lib/bin/firebase.js',
    'emulators:exec',
    '--only',
    'auth,firestore,storage',
    'vitest run tests/rules',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, FIREBASE_CLI_EXPERIMENTS: 'webframeworks' },
  },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
