# Tailscale HTTPS for the Portal

## Problem

Mobile browsers (iOS Safari, Chrome) increasingly degrade or block features on
plain HTTP origins (clipboard, service workers, secure cookies, install
prompts, geolocation). The portal is currently served over HTTP at
`http://ryanpeach-ms-7c35.<tailnet>.ts.net:4230`, which trips this behavior on
the iPhone that accesses it over Tailscale.

## Goal

Serve the portal over HTTPS at the Tailscale MagicDNS hostname. Backend stays
HTTP — the portal proxies `/api` to it server-side, so the phone never talks
to the backend directly.

## Non-goals

- Public internet exposure (no Tailscale Funnel)
- Backend HTTPS termination
- Custom domain names
- Production hardening — this is a personal dev environment

## Architecture

```
phone ──HTTPS──▶ ryanpeach-ms-7c35.<tailnet>.ts.net  (Tailscale TLS termination)
                        │
                        └──HTTP──▶ host:4230 ──▶ container:4200  (Vite dev server)
                                                       │
                                                       └─ /api/*  (proxy.conf.json)
                                                          ──▶ container:3000  (backend)
```

`tailscale serve` runs on the host (outside Docker). It owns port 443,
provisions a Let's Encrypt cert via the Tailscale control plane, terminates
TLS, and proxies plaintext HTTP to the existing `localhost:4230`. The
container, the Angular config, and the proxy.conf are unchanged.

## Why this approach

| Approach                               | Verdict                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `tailscale serve` (chosen)             | Single command. Auto cert provisioning + renewal. No code or container changes. Zero TLS config to maintain.                   |
| `tailscale cert` + Angular `ssl: true` | Cert files must be mounted into the container, re-synced on renewal (~3 mo cycle). Adds Docker volume + Angular config burden. |
| Caddy/nginx in compose                 | Heaviest. Adds a service. Solves a problem we don't have (host headers, multi-domain).                                         |

## Implementation

### Repo changes

1. **`scripts/tailscale-serve-portal.sh`** (new, executable):

   ```sh
   #!/usr/bin/env sh
   set -eu
   sudo tailscale serve --bg 4230
   ```

   `tailscale serve <port>` defaults to HTTPS on 443 → `http://localhost:<port>`.
   `--bg` writes to the persistent serve config; tailscaled restores it on
   reboot. Idempotent — re-running replaces the existing mapping.

2. **`README.md`**: rewrite the **Tailscale Setup** section.
   - Add an "HTTPS" subsection: enable HTTPS certs in admin console, run the
     script once.
   - Update phone-access URLs from `http://<host>:4230` →
     `https://<host>.<tailnet>.ts.net`.
   - Note that backend `:3030` is still HTTP and still reachable directly on
     the LAN/tailnet for debugging, but the phone uses the proxied `/api`
     path under HTTPS.

### Operator steps (one-time, documented in README)

1. Tailscale admin console → DNS → enable "HTTPS Certificates"
2. `./scripts/tailscale-serve-portal.sh`
3. First request from phone may take ~10s while the cert provisions

### Verification

- `tailscale serve status` shows `https://<host>.<tailnet>.ts.net (tcp/443) → http://127.0.0.1:4230`
- `curl -v https://<host>.<tailnet>.ts.net` from another tailnet device returns HTTP 200 and the Angular index
- iPhone Safari loads the portal with a green padlock
- Vite HMR works (WebSocket upgrades to WSS through `tailscale serve`)
- API calls from the phone (`/api/*`) succeed

## Risks / open questions

- **Root requirement.** `tailscale serve` needs root, OR a one-time
  `sudo tailscale set --operator=$USER` (out of scope for this change; mention
  in README).
- **HTTPS Certificates flag.** If the user hasn't enabled this in the admin
  console, `tailscale serve` will fail with a clear error. README will call
  this out as step 1.
- **Cert provisioning timing.** First load can be slow; not a regression.
- **Auto-start.** `--bg` persists config across reboots — no systemd unit
  needed. README's existing auto-start section stays as-is.
