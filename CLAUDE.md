# CLAUDE.md — Project Rules

## Branching

- **Never commit directly to `main`.** Always work on a feature branch.
- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- After a PR is merged, delete the remote branch: `git push origin --delete <branch>`.

## Database (Supabase, locally hosted)

- The backend is a locally hosted Supabase stack started via the Supabase CLI (`supabase start`). The portal talks to PostgREST directly at `http://127.0.0.1:54321` using `@supabase/supabase-js`.
- Migrations live in `supabase/migrations/*.sql`. They run automatically when you `supabase start` against an empty stack, and when you `supabase db reset`.
- To add a new migration: `supabase migration new <name>` then fill in the generated `.sql` file.
- To re-apply migrations from scratch (destroys local DB data): `npm run supabase:reset` (alias for `supabase db reset`).
- **Legacy SQLite artifacts** in `apps/backend/data/` (DB file + `.backup`s) may still be present from before the Supabase POC. The deny rules in `settings.json` still forbid deleting `.sqlite` and `.backup` files — leave them alone.

## Local Node Version

This project requires Node 24. Run `nvm use` in the repo root (`.nvmrc` pins the version).

## Supabase CLI

Install once per machine: `brew install supabase/tap/supabase` (or see <https://supabase.com/docs/guides/cli/getting-started>). The CLI manages its own Docker containers for Postgres / PostgREST / GoTrue / Studio — separate from this repo's `docker-compose.yml`.
