# catalog

## Purpose

Feature module for Catalog. It owns its feature-specific UI, hooks, service logic, and public API.

## Stack / Tools

React, TypeScript, Firebase-backed service/repository architecture.

## Why this directory exists

AgriConnect uses a feature-first, layered architecture so contributors can find responsibilities quickly and avoid coupling UI directly to infrastructure. This directory is one explicit boundary in that design.

## Contributor rules

- Keep changes focused, typed, tested, and consistent with the approved architecture.
- Do not put secrets or service-account credentials in source control.
- Reuse canonical types, Zod schemas, enums, and design tokens instead of redefining them.
- Add or update tests when behavior, validation, data access, or security changes.
- If a change conflicts with `docs/Architecture.md`, `docs/Database.md`, or `SECURITY.md`, document the decision before merging.
