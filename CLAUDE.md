# CLAUDE.md — Project Rules

## Branching

- **Never commit directly to `main`.** Always work on a feature branch.
- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- After a PR is merged, delete the remote branch: `git push origin --delete <branch>`.

## CI — Wait, Check, Fix

After every `git push` to a PR branch:

1. **Wait** for CI to finish: `gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')`.
2. **Check** the result: `gh pr checks <pr-number>`.
3. If any check fails, **read the logs** (`gh run view <run-id> --log-failed`) and fix the root cause.
4. Commit the fix and repeat from step 1 until all checks pass.

Never declare work done while CI is red.

## Local Node Version

This project requires Node 24. Run `nvm use` in the repo root (`.nvmrc` pins the version).
