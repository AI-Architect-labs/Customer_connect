#!/usr/bin/env bash
set -euo pipefail
npm run type-check
npm run lint
npm run format:check
npm test
npm run build
npm --prefix functions run build
printf '\nCore verification passed. Run `npm run test:rules` with Firebase emulators for Security Rules.\n'
