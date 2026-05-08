# CLAUDE.md — Project Rules

## Branching

- **Never commit directly to `main`.** Always work on a feature branch.
- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- After a PR is merged, delete the remote branch: `git push origin --delete <branch>`.

## CI — Wait, Check, Fix

After every `git push` to a PR branch, run `/fix-ci` (`.claude/commands/fix-ci.md`) and follow it until all checks pass. Never declare work done while CI is red.

## Database Safety

- **Never delete** `.sqlite` or `.backup` files — this is also enforced via `settings.json` deny rules.
- `openDatabase()` automatically backs up the DB before applying any pending migrations.
- To add a new migration: `npm run migrate:make --workspace=apps/backend -- <name>` then fill in the generated `.cjs` file.
- To run pending migrations manually: `npm run migrate --workspace=apps/backend`.

## Local Node Version

This project requires Node 24. Run `nvm use` in the repo root (`.nvmrc` pins the version).
