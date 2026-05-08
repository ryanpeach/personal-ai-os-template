# Migration Lifecycle Design

**Date:** 2026-05-08
**Branch:** feat/docker-dev

## Summary

One rule: `npm run migrate --workspace=apps/backend` runs before anything touches the DB. Migration logic lives only in the CLI wrapper (`scripts/migrate.cjs`). No migration logic in app code or tests.

## Architecture

### Migration entry point

`apps/backend/scripts/migrate.cjs` — backs up the existing DB (if any) then runs `knex migrate:latest`. This is the only place migrations are applied.

`apps/backend/knexfile.cjs` — knex config used by both the CLI wrapper and `migrate:make`/`migrate:rollback`.

`apps/backend/src/db.ts` — sync connection factory only. Opens the DB at `DATABASE_PATH` (or `data/db.sqlite` default), ensures the directory exists, returns a `better-sqlite3` instance. No migration logic.

### Per-environment lifecycle

| Environment    | Who runs migrate   | When                                                                                    |
| -------------- | ------------------ | --------------------------------------------------------------------------------------- |
| Docker dev     | Dockerfile.dev CMD | Before `npm run dev`, inline: `npm run migrate --workspace=apps/backend && npm run dev` |
| CI (tests)     | Jest `globalSetup` | Before test suite runs, via knex directly in `jest-global-setup.js`                     |
| Local (manual) | Developer          | `npm run migrate --workspace=apps/backend` per CLAUDE.md                                |

## Test Strategy

Tests share a single migrated DB. Jest config sets `DATABASE_PATH` to `apps/backend/data/test.sqlite` and points `globalSetup` at `jest-global-setup.js` (plain CJS, not TypeScript — `globalSetup` runs outside Jest's transform pipeline).

`jest-global-setup.js` runs `knex.migrate.latest()` against the test DB path before any test file loads.

Tests clean up via SQL in `afterEach`:

```ts
afterEach(() => db.prepare('DELETE FROM todos').run());
```

No `fs` operations on DB files in tests. No `tmpdir` pattern. `data/test.sqlite` is gitignored.

### Safety invariant

The main DB (`data/db.sqlite`) and all `.backup` files are physically unreachable from the test process — tests point at `data/test.sqlite` exclusively. Even a rogue test cannot corrupt or delete the main DB.

## Files Changed

| File                                       | Change                                            |
| ------------------------------------------ | ------------------------------------------------- |
| `apps/backend/src/db.ts`                   | Simplified to sync factory (done)                 |
| `apps/backend/scripts/migrate.cjs`         | Backup + migrate wrapper (done)                   |
| `apps/backend/package.json`                | `migrate` script uses wrapper (done)              |
| `apps/backend/jest.config.js`              | Add `globalSetup`, set `DATABASE_PATH` env        |
| `apps/backend/jest-global-setup.js`        | New — runs knex migrations on test DB             |
| `apps/backend/src/__tests__/db.test.ts`    | Rewrite — no tmpdir, no CREATE TABLE, shared DB   |
| `apps/backend/src/__tests__/todos.test.ts` | Remove tmpdir/CREATE TABLE, add afterEach cleanup |
| `Dockerfile.dev`                           | CMD runs migrate before dev server                |
| `.gitignore`                               | Add `data/test.sqlite`                            |

## Out of Scope

- Production deploy pipeline (no prod deploy job exists yet)
- Migration rollbacks (no automated rollback; manual `npm run migrate:rollback`)
- Backup retention policy
