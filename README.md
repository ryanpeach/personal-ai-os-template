# personal-ai-os

A locally hosted web app monorepo edited by Claude Code and served to a phone over Tailscale VPN.

Create any apps for any phone using Claude Code, Ionic, and a locally hosted Supabase stack (Postgres + PostgREST + Auth + Studio). Escape subscription hell and own your data!

You can even vibe code this app live from your phone using claude code remote control, and since all your data is in
local Postgres, the AI can also access all the data in all your apps making all your apps automatically AI enabled.

Since it's locally hosted, feel free to set up local models for internal genui and ai applications. Control your data.

## Project Structure

```
├── apps/
│   └── portal/      # Angular + Ionic frontend (port 4230). Talks to Supabase directly via @supabase/supabase-js.
├── packages/
│   └── shared/      # Shared TypeScript types
├── supabase/        # Local Supabase stack config + Postgres migrations
├── docs/            # Design specs and implementation plans
├── docker-compose.yml
└── Dockerfile
```

The backend is a **locally hosted Supabase stack** (Postgres + PostgREST + Auth + Studio) started by the
[Supabase CLI](https://supabase.com/docs/guides/cli/getting-started). The portal calls PostgREST directly —
there is no custom Express/Node API layer.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2.22+
- [Tailscale](https://tailscale.com/download)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`brew install supabase/tap/supabase`)
- Node 24 (for local development outside Docker)

## Tailscale Setup

### Initial Setup

Install Tailscale and authenticate:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

This assigns a stable MagicDNS hostname (e.g. `my-machine.tail1234.ts.net`).
Add your phone to the same Tailscale account so it appears on the network.

### Enable HTTPS for the portal

Mobile browsers degrade or block features on plain HTTP (clipboard, service
workers, secure cookies, install prompts). The portal is therefore served over
HTTPS via [`tailscale serve`](https://tailscale.com/kb/1242/tailscale-serve).

1. **Enable HTTPS Certificates** in the Tailscale admin console:
   <https://login.tailscale.com/admin/dns> → "HTTPS Certificates" → Enable.
2. Run the wrapper script once:

   ```bash
   ./scripts/tailscale-serve-portal.sh
   ```

   `--bg` persists the serve config across reboots; `tailscaled` restores it.
   First request from the phone may take ~10s while the cert provisions.

The phone reaches the app at:

- `https://<hostname>.<tailnet>.ts.net` — portal (TLS terminated by Tailscale on port 443)
- `https://<hostname>.<tailnet>.ts.net/api/...` — API (proxied by the portal's dev server to the backend)

The backend is also reachable directly over HTTP at `http://<hostname>:3030`
on the tailnet for debugging, but the phone always uses the HTTPS portal.

### Install on iPhone

The portal is installable as a standalone home-screen app (no Safari URL bar
or toolbar):

1. Open `https://<hostname>.<tailnet>.ts.net` in Safari on the iPhone.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Tap the new "Portal" icon. It opens standalone — no URL bar, no toolbar.

If you previously added an HTTP version of the portal to the home screen,
delete that icon first — iOS does not refresh saved bookmarks when the
underlying metadata changes.

### Daily Use

```bash
sudo tailscale up    # connect
sudo tailscale down  # disconnect
tailscale status     # check hostname and peers
tailscale serve status   # check HTTPS mapping
```

## Running the App

The app is split in two: the **Supabase local stack** (Postgres + PostgREST + Auth + Studio), managed by the
Supabase CLI, and the **portal** (Angular dev server), run either directly with `npm` or in Docker.

### 1. Start Supabase

From the repo root:

```bash
npm run supabase:start
```

The first run pulls the Supabase Docker images (a few minutes); subsequent runs are fast. The CLI prints a
table of URLs and keys when it's up. Default endpoints:

- API (PostgREST): `http://127.0.0.1:54321`
- Studio (admin UI): `http://127.0.0.1:54323`
- Postgres: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

Migrations under `supabase/migrations/` are applied automatically when the stack initialises.

Useful follow-ups:

```bash
npm run supabase:reset   # destroy + recreate the local DB, re-run migrations
npm run supabase:stop    # stop the local stack (data persists in Docker volumes)
```

### 2. Start the portal

```bash
npm run dev              # ng serve on http://127.0.0.1:4230
```

Or run it in Docker with file watching:

```bash
docker compose watch
```

This rebuilds the container image when manifest files change and syncs `apps/` / `packages/` source files into
the running container for hot reload.

### Stopping

```bash
docker compose down       # stop the portal container
npm run supabase:stop     # stop the Supabase stack
```

## Database migrations

Migrations live in `supabase/migrations/` as plain SQL.

```bash
supabase migration new <name>   # creates supabase/migrations/<timestamp>_<name>.sql
# edit the file, then:
npm run supabase:reset           # apply locally (destroys local data)
```

The Supabase CLI handles its own data volumes; you don't need to manage a SQLite file or run any backup
script. Snapshots of the local DB can be taken with `supabase db dump`.

## Auto-Start on Boot

### Tailscale

Tailscale installs its own systemd service. Enable it:

```bash
sudo systemctl enable --now tailscaled
```

### Docker Compose

Create a systemd user service so the app starts on login:

```bash
mkdir -p ~/.config/systemd/user/
```

Create `~/.config/systemd/user/personal-ai-os.service`:

```ini
[Unit]
Description=personal-ai-os Docker Compose
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=simple
WorkingDirectory=/home/YOUR_USER/Documents/Workspace/personal-ai-os
ExecStart=docker compose up
ExecStop=docker compose down
Restart=on-failure

[Install]
WantedBy=default.target
```

Then enable it:

```bash
systemctl --user daemon-reload
systemctl --user enable --now personal-ai-os
systemctl --user status personal-ai-os   # verify
```

To start on boot without being logged in, enable lingering:

```bash
sudo loginctl enable-linger $USER
```
