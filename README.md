# personal-ai-os

A locally hosted **portal-of-apps framework** for your iPhone. Build any app you want with Claude Code, install the portal to your home screen as a PWA, and run everything off your own machine over a Tailscale VPN.

Escape subscription hell, own your data, and — because all your data lives in your own Postgres — let Claude Code reach into every app's state to make them automatically AI-enabled. Vibe-code new apps live from your phone via Claude Code remote control. Run local models for fully private GenAI if you want.

## Stack

- **Frontend:** [Angular 21](https://angular.dev) + [Ionic](https://ionicframework.com) (iOS-style PWA components) + [Tailwind CSS](https://tailwindcss.com) (utility styling).
- **Backend:** Locally hosted [Supabase](https://supabase.com) stack (Postgres 17 + PostgREST + GoTrue + Storage + Studio) managed via the Supabase CLI.
- **Transport:** [Tailscale](https://tailscale.com) provides a private encrypted overlay network and TLS termination so the iPhone can reach the portal over HTTPS without any of it being exposed to the public internet.

**Auth is intentionally not implemented.** The portal binds to localhost and is only reachable via Tailscale — every device on the tailnet is already trust-authenticated by Tailscale itself. Adding GoTrue / OAuth on top is unnecessary friction for a single-user, self-hosted setup. If you ever expose this beyond Tailscale, wire up Supabase Auth before doing so.

## Project structure

```
├── src/                     # Angular + Ionic frontend source
│   ├── app/
│   │   ├── apps/            # Individual apps in the portal (todo, ...)
│   │   ├── home/            # Portal home screen (grid of app icons)
│   │   └── supabase.client.ts
│   ├── styles.css           # @tailwind directives
│   └── ...
├── public/                  # PWA manifest + icons
├── packages/shared/         # Shared TypeScript types (Todo, etc.)
├── supabase/
│   ├── migrations/*.sql     # Schema migrations (versioned)
│   ├── seeds/*.sql          # Initial data, applied on first start / reset
│   └── config.toml          # Supabase CLI / local stack config
├── scripts/
│   ├── supabase-backup.sh   # DB snapshot script (runs on predev)
│   ├── tailscale-serve-portal.sh
│   └── generate-pwa-icons.sh
├── data/backups/            # Timestamped DB dumps (append-only)
├── tailwind.config.js       # Tailwind content paths + theme
├── angular.json
└── package.json
```

## Prerequisites

- [Node 24](https://nodejs.org) — `nvm use` (the repo's `.nvmrc` pins the version)
- [Docker](https://docs.docker.com/get-docker/) — the Supabase CLI starts its own Postgres/PostgREST/GoTrue/Studio containers
- [Tailscale](https://tailscale.com/download) — required only when serving the portal to your phone

## Backend (Supabase)

The portal talks to PostgREST at `http://127.0.0.1:54321` using `@supabase/supabase-js`. The Supabase CLI is bundled as a devDependency, so `npm install` provides it.

| Command                   | What it does                                                       |
| ------------------------- | ------------------------------------------------------------------ |
| `npm run supabase:start`  | Boot the local stack (also runs automatically via `predev`)        |
| `npm run supabase:stop`   | Stop the local stack                                               |
| `npm run supabase:status` | Show container status and endpoint URLs                            |
| `npm run supabase:reset`  | Drop the DB, re-apply migrations + seeds (destroys local data)     |
| `npm run supabase:backup` | Dump roles/schema/data into `data/backups/<timestamp>.<git-hash>/` |

- **Migrations** live in `supabase/migrations/*.sql`. Add a new one with `npx supabase migration new <name>`.
- **Seeds** live in `supabase/seeds/*.sql` and are only applied on a fresh DB (`supabase db reset` or first `supabase start` against an empty volume). Editing a seed file does nothing until the next reset.
- Supabase Studio is at `http://127.0.0.1:54323`.

## Tailwind

Tailwind is configured at the repo root and consumed via Angular's built-in CSS pipeline.

- `tailwind.config.js` — content paths (`./src/**/*.{html,ts}`) and theme extensions.
- `src/styles.css` — `@tailwind base; @tailwind components; @tailwind utilities;` directives.

No PostCSS config is needed — Angular 21's `@angular/build` detects Tailwind automatically.

## Development server

```bash
npm run dev
```

Wire-up: `predev` boots Supabase and snapshots the DB, then `ng serve` starts on `http://localhost:4200/`. The app hot-reloads on source changes. Supabase keeps running after `ng serve` exits — stop it explicitly with `npm run supabase:stop`.

## Serving to your iPhone (Tailscale + HTTPS)

Mobile browsers degrade or block features on plain HTTP (clipboard, service workers, secure cookies, install-to-home-screen prompts). The portal is served over HTTPS via [`tailscale serve`](https://tailscale.com/kb/1242/tailscale-serve).

### One-time setup

Install Tailscale and authenticate:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

This assigns a stable MagicDNS hostname like `my-machine.tail1234.ts.net`. Add your phone to the same Tailscale account so it appears on the tailnet.

Enable HTTPS certificates: <https://login.tailscale.com/admin/dns> → "HTTPS Certificates" → Enable.

Run the wrapper once to publish the portal:

```bash
./scripts/tailscale-serve-portal.sh
```

The phone now reaches the portal at `https://<hostname>.<tailnet>.ts.net` (TLS terminated by Tailscale on port 443). The first request may take ~10s while the cert provisions.

### Install on iPhone

1. Open `https://<hostname>.<tailnet>.ts.net` in Safari on the iPhone.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Tap the new "Portal" icon. It opens standalone — no URL bar, no toolbar.

If you previously added an HTTP version of the portal to the home screen, delete that icon first — iOS does not refresh saved bookmarks when the underlying metadata changes.

### Daily Tailscale commands

```bash
sudo tailscale up        # connect
sudo tailscale down      # disconnect
tailscale status         # check hostname and peers
tailscale serve status   # check HTTPS mapping
```

## Database backups

`npm run dev` runs `scripts/supabase-backup.sh` on every start, writing a timestamped snapshot (`roles.sql`, `schema.sql`, `data.sql`) into `data/backups/<utc-timestamp>.<git-hash>/`. The git hash is suffixed with `-dirty` when the working tree has uncommitted changes, so you know the commit alone won't reproduce the migration state.

**Make the backup directory append-only** so historical snapshots cannot be modified or deleted by accident:

```bash
sudo chattr +a data/backups
```

To verify: `lsattr -d data/backups` should show an `a` flag. To temporarily lift it (e.g. for pruning old snapshots intentionally): `sudo chattr -a data/backups`. `.claude/settings.json` also denies `rm`/`unlink`/`mv`/`chattr` on `seed.sql` and the backups directory as a second layer of defense against the AI accidentally destroying data.

Append-only is a Linux ext2/3/4/btrfs filesystem attribute. On other filesystems or platforms, use an equivalent (e.g. snapshot to read-only remote storage).

### Restoring a backup

```bash
npm run supabase:stop
# Inspect and pick a snapshot under data/backups/
# Then re-apply roles → schema → data into the local DB.
# (Easiest: pipe the SQL files through psql against the local Postgres on port 54322.)
npm run supabase:start
```

## Auto-start on boot

### Tailscale

Tailscale installs its own systemd service:

```bash
sudo systemctl enable --now tailscaled
```

### Portal

Create a user systemd service so the portal starts on login.

```bash
mkdir -p ~/.config/systemd/user/
```

Create `~/.config/systemd/user/personal-ai-os.service`:

```ini
[Unit]
Description=personal-ai-os portal
After=network-online.target docker.service

[Service]
Type=simple
WorkingDirectory=/home/YOUR_USER/Documents/Workspace/personal-ai-os-template
ExecStart=/usr/bin/env npm run dev
ExecStop=/usr/bin/env npm run supabase:stop
Restart=on-failure

[Install]
WantedBy=default.target
```

Enable it:

```bash
systemctl --user daemon-reload
systemctl --user enable --now personal-ai-os
systemctl --user status personal-ai-os
```

To start on boot without being logged in, enable lingering:

```bash
sudo loginctl enable-linger $USER
```

## Other Angular commands

```bash
ng generate component <name>   # scaffold a new component
npm run build                  # production build → dist/
npm test                       # vitest unit tests
npm run typecheck              # tsc --noEmit
npm run lint                   # eslint
```

## Additional resources

- [Angular CLI reference](https://angular.dev/tools/cli)
- [Ionic Framework docs](https://ionicframework.com/docs)
- [Supabase CLI docs](https://supabase.com/docs/guides/cli)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
