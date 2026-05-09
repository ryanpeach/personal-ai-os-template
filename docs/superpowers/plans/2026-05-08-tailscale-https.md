# Tailscale HTTPS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the portal over HTTPS at the Tailscale MagicDNS hostname using `tailscale serve`, and update the README so a fresh clone can reproduce the setup.

**Architecture:** A small wrapper script invokes `tailscale serve --bg 4230` on the host. Tailscale terminates TLS on port 443 of the MagicDNS hostname and proxies plaintext to the existing `localhost:4230` (Docker → container:4200, Vite). No container, Angular, or proxy changes.

**Tech Stack:** Tailscale (host CLI), shell script, Markdown.

**Branch:** `feat/tailscale-https` (already created; spec already committed).

**Spec:** `docs/superpowers/specs/2026-05-08-tailscale-https-design.md`

---

## File Structure

| Action | Path                                | Responsibility                                                                      |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------- |
| Create | `scripts/tailscale-serve-portal.sh` | One-shot, idempotent enabler of `tailscale serve` for port 4230                     |
| Modify | `README.md` (lines ~24–49)          | Replace HTTP phone URLs with HTTPS; document HTTPS-Certificates flag and the script |

---

### Task 1: Create the `tailscale serve` wrapper script

**Files:**

- Create: `scripts/tailscale-serve-portal.sh`

- [ ] **Step 1: Create the `scripts/` directory**

Run:

```bash
mkdir -p scripts
```

Expected: directory exists, no output.

- [ ] **Step 2: Write the script**

Create `scripts/tailscale-serve-portal.sh` with exactly:

```sh
#!/usr/bin/env sh
# Expose the portal (host port 4230) over HTTPS at the Tailscale MagicDNS
# hostname. Tailscale provisions and renews the cert automatically.
# Requires "HTTPS Certificates" enabled in the Tailscale admin console
# (https://login.tailscale.com/admin/dns -> "Enable HTTPS").
#
# Idempotent: re-running replaces the existing serve mapping.
set -eu
sudo tailscale serve --bg 4230
sudo tailscale serve status
```

- [ ] **Step 3: Make it executable**

Run:

```bash
chmod +x scripts/tailscale-serve-portal.sh
```

- [ ] **Step 4: Lint shellcheck (if installed)**

Run:

```bash
command -v shellcheck >/dev/null && shellcheck scripts/tailscale-serve-portal.sh || echo "shellcheck not installed, skipping"
```

Expected: no warnings, OR "shellcheck not installed, skipping".

- [ ] **Step 5: Smoke-test parse (no execution)**

Run:

```bash
sh -n scripts/tailscale-serve-portal.sh && echo OK
```

Expected: `OK` (verifies the script parses; does not run `tailscale`).

- [ ] **Step 6: Commit**

```bash
git add scripts/tailscale-serve-portal.sh
git commit -m "feat: add tailscale-serve-portal.sh to enable HTTPS for the portal"
```

---

### Task 2: Update README — Tailscale Setup section

**Files:**

- Modify: `README.md` (Tailscale Setup section, lines 24–49 in the pre-edit file)

- [ ] **Step 1: Replace the Tailscale Setup section**

In `README.md`, find the section that currently reads:

````markdown
## Tailscale Setup

### Initial Setup

Install Tailscale and authenticate:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```
````

This assigns a stable MagicDNS hostname (e.g. `my-machine.tail1234.ts.net`).
Your phone reaches the app at:

- `http://<hostname>:4230` — portal
- `http://<hostname>:3030` — API

Add your phone to the same Tailscale account so it appears on the network.

### Daily Use

```bash
sudo tailscale up    # connect
sudo tailscale down  # disconnect
tailscale status     # check hostname and peers
```

`````

Replace it with:

````markdown
## Tailscale Setup

### Initial Setup

Install Tailscale and authenticate:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
`````

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

### Daily Use

```bash
sudo tailscale up    # connect
sudo tailscale down  # disconnect
tailscale status     # check hostname and peers
tailscale serve status   # check HTTPS mapping
```

````

- [ ] **Step 2: Verify the section renders**

Run:
```bash
git diff README.md | head -120
```

Expected: clean diff that removes the two `http://<hostname>:...` bullets and adds the **Enable HTTPS for the portal** subsection.

- [ ] **Step 3: Run prettier on README (matches existing repo formatting)**

Run:
```bash
npx prettier --check README.md || npx prettier --write README.md
```

Expected: file is formatted (or already was).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README for Tailscale HTTPS via tailscale serve"
```

---

### Task 3: Manual verification

**Files:** none (live system check).

This task does not produce a commit; it gates the PR.

- [ ] **Step 1: Confirm Tailscale admin has HTTPS Certificates enabled**

Open <https://login.tailscale.com/admin/dns> in a browser. The "HTTPS Certificates" panel should show **Enabled**. If not, enable it before continuing.

- [ ] **Step 2: Run the script**

Run:
```bash
./scripts/tailscale-serve-portal.sh
```

Expected: `tailscale serve status` output ending with a line similar to:
```
https://ryanpeach-ms-7c35.<tailnet>.ts.net (tcp/443)
|-- / proxy http://127.0.0.1:4230
```

- [ ] **Step 3: Confirm the dev stack is up**

Run:
```bash
docker compose ps
```

Expected: `app` service is `Up`, port `4230->4200` published.

- [ ] **Step 4: Curl the HTTPS endpoint from another tailnet device (or the host)**

From the host:
```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://$(tailscale status --json | jq -r '.Self.DNSName' | sed 's/\.$//')
```

Expected: `200`.

If `jq` is not installed, get the hostname from `tailscale status` and curl manually.

- [ ] **Step 5: Phone smoke test**

On the iPhone (`iphone181`), open Safari and visit
`https://<hostname>.<tailnet>.ts.net`. Verify:
- Page loads with the green padlock (no cert warning).
- Vite HMR connects (DevTools console on a desktop tailnet client shows `[vite] connected.` over WSS).
- A page that calls `/api/...` returns data without a mixed-content error.

- [ ] **Step 6: Reboot persistence check (optional, only if convenient)**

After the next host reboot, run:
```bash
tailscale serve status
```

Expected: same mapping as Step 2; no need to re-run the script.

---

### Task 4: Open PR and clean up

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/tailscale-https
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat: serve portal over HTTPS via Tailscale" --body "$(cat <<'EOF'
## Summary
- Add scripts/tailscale-serve-portal.sh to expose host:4230 over HTTPS at the Tailscale MagicDNS hostname (cert auto-provisioned by Tailscale).
- Update README's Tailscale Setup section: enable HTTPS Certificates, run the script, use https://<hostname>.<tailnet>.ts.net.

## Test plan
- [ ] tailscale serve status shows https → 127.0.0.1:4230
- [ ] curl https://<host>.<tailnet>.ts.net from another tailnet device returns 200
- [ ] iPhone Safari loads the portal with a valid cert and Vite HMR over WSS works
EOF
)"
```

- [ ] **Step 3: Watch CI**

```bash
gh pr checks --watch
```

If red, investigate, fix, push, re-watch. Do not declare done while CI is red.

- [ ] **Step 4: After merge — finishing-a-development-branch cleanup**

```bash
git checkout main
git pull
git push origin --delete feat/tailscale-https
git branch -d feat/tailscale-https
```

---

## Self-review

- **Spec coverage:**
  - Repo change 1 (script) → Task 1 ✓
  - Repo change 2 (README) → Task 2 ✓
  - Operator steps (admin console + run script) → Task 2 README content + Task 3 manual verification ✓
  - Verification list (`tailscale serve status`, curl, iPhone, HMR, /api) → Task 3 steps 2–5 ✓
  - Risks (root requirement, HTTPS Certificates flag, cert timing, auto-start) → all surfaced in README and Task 3 ✓
- **Placeholder scan:** none.
- **Type consistency:** N/A (no code types).
````
