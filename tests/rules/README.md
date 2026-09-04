# rules

## Purpose

Security Rules allow/deny tests. These are mandatory CI gates for data-access changes.

## Stack / Tools

Vitest, @firebase/rules-unit-testing, and the Firebase Auth, Firestore, and Storage emulators. Run `npm run test:rules` from the repository root under Node 20 with Java 21 available on `PATH` and through `JAVA_HOME`.

## Why this directory exists

AgriConnect uses a feature-first, layered architecture so contributors can find responsibilities quickly and avoid coupling UI directly to infrastructure. This directory is one explicit boundary in that design.

## Contributor rules

- Keep changes focused, typed, tested, and consistent with the approved architecture.
- Do not put secrets or service-account credentials in source control.
- Reuse canonical types, Zod schemas, enums, and design tokens instead of redefining them.
- Add or update tests when behavior, validation, data access, or security changes.
- If a change conflicts with `docs/Architecture.md`, `docs/Database.md`, or `SECURITY.md`, document the decision before merging.
