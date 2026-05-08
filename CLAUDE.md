# CLAUDE.md — Project Rules

## Branching

- **Never commit directly to `main`.** Always work on a feature branch.
- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- After a PR is merged, delete the remote branch: `git push origin --delete <branch>`.

## CI — Wait, Check, Fix

After every `git push` to a PR branch, run `/fix-ci` (`.claude/commands/fix-ci.md`) and follow it until all checks pass. Never declare work done while CI is red.

## Local Node Version

This project requires Node 24. Run `nvm use` in the repo root (`.nvmrc` pins the version).
