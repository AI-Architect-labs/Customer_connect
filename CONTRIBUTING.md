# Contributing to AgriConnect

## Before changing code

Read:

1. `AI_CONTEXT.md`
2. `PROJECT_STATE.md`
3. `docs/Architecture.md`
4. `docs/Database.md`
5. `docs/ImplementationSecurityAddendum.md`
6. the `README.md` in the directory you plan to modify.

## Setup

Use Node.js 20 as declared by `.nvmrc` and `package.json`. Java 21 is needed only when running the Firebase emulators or Security Rules tests; AgriConnect application code does not use Java.

```bash
npm ci
npm --prefix functions ci
python -m pip install -r requirements.txt
cp .env.local.example .env.local
npm run emulators
```

Use short-lived branches from `develop`, e.g. `feature/catalog-search` or `fix/order-cancellation`. The current promotion flow is `feature/*` -> `develop` -> `staging` -> `main`; keep all three long-lived branches and promote only after the relevant quality gates pass.

## Dependency direction

```text
route / UI
   ↓
feature component or hook
   ↓
feature service
   ↓
repository / Firebase adapter
   ↓
Firebase
```

Cross-feature imports should use the feature public surface when available. Shared components must remain feature-agnostic. Never query private customer/order data directly from a presentation component.

## Commits

Use Conventional Commits:

- `feat:` feature
- `fix:` defect
- `test:` tests
- `docs:` documentation
- `refactor:` behavior-preserving cleanup
- `chore:` tooling/configuration

Husky, lint-staged and Commitlint run locally.

## Pull-request gate

```bash
npm run verify
npm run verify:all
```

Use `npm run verify` for the fast app/functions gate while iterating. The complete
`npm run verify:all` gate includes Firebase Security Rules tests, requires Java 21,
and must pass before a PR or release.

Also manually test the affected real user journey on mobile when UI/auth/storage/push behavior changes.

A PR must not weaken the invariants in `SECURITY.md`. If implementation needs to diverge from an approved design document, record the reason in an ADR/addendum before merge.

## Directory documentation

Every directory contains a `README.md`. When adding a directory, add its README in the same commit and describe: purpose, stack/tools, why the directory exists, and contribution rules.
