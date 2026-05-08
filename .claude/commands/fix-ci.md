# fix-ci

Wait for the current PR's CI run to finish, then read any failures and fix them. Repeat until all checks pass.

## Steps

1. Find the latest run ID:

   ```
   gh run list --limit 1 --json databaseId --jq '.[0].databaseId'
   ```

2. Wait for it to finish:

   ```
   gh run watch <run-id>
   ```

3. Check results:

   ```
   gh pr checks <pr-number>
   ```

4. If any check failed, read the logs:

   ```
   gh run view <run-id> --log-failed
   ```

5. Fix the root cause, commit, push, then go back to step 1.

6. Only declare done when **all checks pass**.

## Rules

- Never skip a failing check.
- Fix the root cause — do not silence errors with `// @ts-ignore`, `eslint-disable`, or equivalent.
- Always use `nvm use` before running Node commands locally (project requires Node 24).
