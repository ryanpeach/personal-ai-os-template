# personal-ai-os

A locally hosted web app monorepo edited by Claude Code and served to a phone over Tailscale VPN.

## Project Structure

```
├── apps/
│   ├── backend/     # Express + TypeScript API (port 3000)
│   └── portal/      # Angular + Ionic frontend (port 4200)
├── packages/
│   └── shared/      # Shared TypeScript types
├── docs/            # Design specs and implementation plans
├── docker-compose.yml
└── Dockerfile.dev
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2.22+
- [Tailscale](https://tailscale.com/download)
- Node 24 (for local development outside Docker)

## Tailscale Setup

### Initial Setup

Install Tailscale and authenticate:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

This assigns a stable MagicDNS hostname (e.g. `my-machine.tail1234.ts.net`).
Your phone reaches the app at:

- `http://<hostname>:4200` — portal
- `http://<hostname>:3000` — API

Add your phone to the same Tailscale account so it appears on the network.

### Allow your Tailscale hostname in Angular

Angular's dev server blocks requests from unknown hosts. Create a gitignored file with your MagicDNS hostname so the portal accepts connections from your phone:

```bash
echo "my-machine.tail1234.ts.net" > apps/portal/.ng-hosts
```

Replace `my-machine.tail1234.ts.net` with your actual hostname from `tailscale status`. This file is gitignored and never committed.

### Daily Use

```bash
sudo tailscale up    # connect
sudo tailscale down  # disconnect
tailscale status     # check hostname and peers
```

## Running the App

### With file watching (recommended)

```bash
docker compose watch
```

This starts the app and watches for changes:

- **Source files** (`apps/`, `packages/`) — synced instantly via bind mount; nodemon and `ng serve` hot-reload inside the container with no restart
- **Package manifests** (`package.json`, `package-lock.json`) — triggers a full image rebuild and container restart so `npm ci` re-runs

### One-shot start (no watching)

```bash
docker compose up
```

### Stopping

```bash
docker compose down
```

## Backups

Every time the container starts, `npm run migrate` runs before the app. If `apps/backend/data/db.sqlite` exists, it is automatically copied to `apps/backend/data/backups/db.sqlite.<timestamp>.backup` before any migrations are applied.

Backups are append-only — the directory is protected with the Linux append-only attribute so files can be added but never deleted:

```bash
sudo chattr +a apps/backend/data/backups/
```

Run this once after cloning. Claude Code's `settings.json` also has deny rules preventing deletion of `.sqlite` and `.backup` files as an extra layer of enforcement.

To list backups:

```bash
ls -lh apps/backend/data/backups/
```

To restore a backup, stop the container and copy the desired file back:

```bash
docker compose down
cp apps/backend/data/backups/db.sqlite.<timestamp>.backup apps/backend/data/db.sqlite
docker compose up
```

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
