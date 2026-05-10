# Portal PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portal install as a standalone iOS home-screen app (no Safari URL bar, no bottom toolbar) by adding a web manifest, three icon PNGs, and the iOS-specific `<head>` meta tags.

**Architecture:** Pure-static change. A single source SVG is rasterized to three PNG sizes by an ImageMagick wrapper script. A `manifest.webmanifest` declares `display: standalone`. `index.html` gets six `<head>` lines. No build pipeline changes, no runtime code, no service worker.

**Tech Stack:** SVG, ImageMagick (`convert`), JSON manifest, HTML meta tags.

**Branch:** `feat/portal-pwa` (already created; spec already committed).

**Spec:** `docs/superpowers/specs/2026-05-08-portal-pwa-design.md`

---

## File Structure

| Action | Path                                        | Responsibility                                                      |
| ------ | ------------------------------------------- | ------------------------------------------------------------------- |
| Create | `apps/portal/public/icons/icon.svg`         | Source of truth for the icon. Edit to redesign.                     |
| Create | `apps/portal/public/icons/icon-180.png`     | iOS apple-touch-icon (180×180). Generated from SVG.                 |
| Create | `apps/portal/public/icons/icon-192.png`     | Manifest icon (192×192). Generated from SVG.                        |
| Create | `apps/portal/public/icons/icon-512.png`     | Manifest icon (512×512, also used as maskable). Generated from SVG. |
| Create | `apps/portal/scripts/generate-pwa-icons.sh` | Wrapper around `convert` to regenerate the three PNGs from the SVG. |
| Create | `apps/portal/public/manifest.webmanifest`   | Web manifest declaring standalone display, name, icons, colors.     |
| Modify | `apps/portal/src/index.html`                | Add manifest link + iOS-specific meta tags + apple-touch-icon link. |
| Modify | `README.md`                                 | Add an "Install on iPhone" subsection under Tailscale Setup.        |

---

### Task 1: Add icon SVG and generator script, produce the three PNGs

**Files:**

- Create: `apps/portal/public/icons/icon.svg`
- Create: `apps/portal/scripts/generate-pwa-icons.sh`
- Create: `apps/portal/public/icons/icon-180.png` (output of script)
- Create: `apps/portal/public/icons/icon-192.png` (output of script)
- Create: `apps/portal/public/icons/icon-512.png` (output of script)

- [ ] **Step 1: Create the icon SVG**

Create `apps/portal/public/icons/icon.svg` with exactly:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3880ff"/>
  <text x="50%" y="54%" text-anchor="middle"
        dominant-baseline="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        font-weight="700"
        font-size="320"
        fill="#ffffff">P</text>
</svg>
```

- [ ] **Step 2: Create the generator script**

Create `apps/portal/scripts/generate-pwa-icons.sh` with exactly:

```sh
#!/usr/bin/env sh
# Regenerate the PWA icon PNGs from icon.svg.
# Run after editing apps/portal/public/icons/icon.svg.
# Requires ImageMagick (`convert` on PATH; works with IM6 or IM7).
set -eu
cd "$(dirname "$0")/.."
SRC="public/icons/icon.svg"
if ! command -v convert >/dev/null; then
  echo "error: ImageMagick ('convert') is required to regenerate icons" >&2
  echo "  install with: sudo apt install imagemagick" >&2
  exit 1
fi
for size in 180 192 512; do
  convert -background none -density 384 "$SRC" -resize "${size}x${size}" "public/icons/icon-${size}.png"
done
echo "wrote public/icons/icon-{180,192,512}.png"
```

- [ ] **Step 3: Make it executable**

Run:

```bash
chmod +x apps/portal/scripts/generate-pwa-icons.sh
```

- [ ] **Step 4: Smoke-test parse**

Run:

```bash
sh -n apps/portal/scripts/generate-pwa-icons.sh && echo OK
```

Expected: `OK`.

- [ ] **Step 5: Confirm `convert` is installed**

Run:

```bash
command -v convert && convert --version | head -1
```

Expected: prints a path and a version line. If not installed:

```bash
sudo apt install imagemagick
```

Then re-run the check.

- [ ] **Step 6: Run the generator**

Run:

```bash
./apps/portal/scripts/generate-pwa-icons.sh
```

Expected output:

```
wrote public/icons/icon-{180,192,512}.png
```

- [ ] **Step 7: Verify the three PNGs exist with the right dimensions**

Run:

```bash
file apps/portal/public/icons/icon-180.png apps/portal/public/icons/icon-192.png apps/portal/public/icons/icon-512.png
```

Expected: each line ends with `PNG image data, NNN x NNN, 8-bit/color RGBA, non-interlaced` where NNN matches the filename (180, 192, 512).

- [ ] **Step 8: Visual sanity check (optional but recommended)**

Open `apps/portal/public/icons/icon-512.png` in any image viewer. Should show a blue (`#3880ff`) square with a white "P" centered. If the "P" is missing or off-center, the SVG font fallback failed — re-check Step 1.

- [ ] **Step 9: Commit**

```bash
git add apps/portal/public/icons/icon.svg apps/portal/scripts/generate-pwa-icons.sh apps/portal/public/icons/icon-180.png apps/portal/public/icons/icon-192.png apps/portal/public/icons/icon-512.png
git commit -m "feat(portal): add PWA icon (svg source + generated PNGs + regen script)"
```

---

### Task 2: Add the web manifest

**Files:**

- Create: `apps/portal/public/manifest.webmanifest`

- [ ] **Step 1: Create the manifest**

Create `apps/portal/public/manifest.webmanifest` with exactly:

```json
{
  "name": "Portal",
  "short_name": "Portal",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3880ff",
  "background_color": "#ffffff",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 2: Validate JSON**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('apps/portal/public/manifest.webmanifest','utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 3: Commit**

```bash
git add apps/portal/public/manifest.webmanifest
git commit -m "feat(portal): add web manifest for standalone PWA install"
```

---

### Task 3: Wire PWA tags into index.html

**Files:**

- Modify: `apps/portal/src/index.html`

- [ ] **Step 1: Read current file**

Run:

```bash
cat apps/portal/src/index.html
```

Confirm the `<head>` matches (existing content):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Portal</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

If it doesn't match, stop and re-check the spec — the file may have drifted.

- [ ] **Step 2: Replace the `<head>` block**

Replace the entire `<head>` block with:

```html
<head>
  <meta charset="utf-8" />
  <title>Portal</title>
  <base href="/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#3880ff" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Portal" />
  <link rel="icon" type="image/x-icon" href="favicon.ico" />
  <link rel="apple-touch-icon" href="icons/icon-180.png" />
  <link rel="manifest" href="manifest.webmanifest" />
</head>
```

(The two existing lines — title/base/viewport and the favicon link — are kept; six new lines are added between them and after.)

- [ ] **Step 3: Validate by re-reading**

Run:

```bash
cat apps/portal/src/index.html
```

Expected: the `<head>` matches the block from Step 2 exactly.

- [ ] **Step 4: Run prettier**

Run:

```bash
npx prettier --check apps/portal/src/index.html || npx prettier --write apps/portal/src/index.html
```

Expected: file is formatted (or already was).

- [ ] **Step 5: Run typecheck (sanity, should be unaffected)**

Run:

```bash
npm run typecheck --workspace=apps/portal
```

Expected: passes (the change is to a static HTML file; typecheck should not change behavior, but this confirms the workspace still builds).

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/index.html
git commit -m "feat(portal): add PWA meta tags and manifest link to index.html"
```

---

### Task 4: README — Install on iPhone

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Open the README and locate the section to extend**

The Tailscale Setup section ends with `### Daily Use`. Insert a new subsection
**after** the existing **Enable HTTPS for the portal** subsection and **before**
the **Daily Use** subsection.

The "Enable HTTPS for the portal" subsection currently ends with the line:

```
- `https://<hostname>.<tailnet>.ts.net/api/...` — API (proxied by the portal's dev server to the backend)

The backend is also reachable directly over HTTP at `http://<hostname>:3030`
on the tailnet for debugging, but the phone always uses the HTTPS portal.
```

(That second paragraph above ends the subsection; what follows is `### Daily Use`.)

- [ ] **Step 2: Insert the new subsection**

After the paragraph ending in "the phone always uses the HTTPS portal." and immediately before `### Daily Use`, insert:

```markdown
### Install on iPhone

The portal is installable as a standalone home-screen app (no Safari URL bar
or toolbar):

1. Open `https://<hostname>.<tailnet>.ts.net` in Safari on the iPhone.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Tap the new "Portal" icon. It opens standalone — no URL bar, no toolbar.

If you previously added an HTTP version of the portal to the home screen,
delete that icon first — iOS does not refresh saved bookmarks when the
underlying metadata changes.
```

(Leave a blank line before and after the new subsection so Markdown parses it correctly.)

- [ ] **Step 3: Verify the diff**

Run:

```bash
git diff README.md
```

Expected: only the inserted block (10–11 lines) — no other lines moved or changed.

- [ ] **Step 4: Run prettier**

Run:

```bash
npx prettier --check README.md || npx prettier --write README.md
```

Expected: file is formatted (or already was).

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: add 'Install on iPhone' subsection for PWA home-screen install"
```

---

### Task 5: Verify served assets locally

**Files:** none (live HTTP check via Docker dev stack).

This task does not produce a commit; it's a smoke test before pushing.

- [ ] **Step 1: Confirm dev stack is running**

Run:

```bash
docker compose ps
```

Expected: `app` service `Up`, port `4230->4200`.

If not running, start it:

```bash
docker compose watch
```

Wait ~10 seconds for the Angular dev server to be ready.

- [ ] **Step 2: Curl the manifest**

Run:

```bash
curl -sS http://localhost:4230/manifest.webmanifest
```

Expected: prints the JSON manifest from Task 2 verbatim.

- [ ] **Step 3: Curl the apple-touch-icon**

Run:

```bash
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://localhost:4230/icons/icon-180.png
```

Expected: `200 image/png`.

- [ ] **Step 4: Confirm index.html includes the new tags**

Run:

```bash
curl -sS http://localhost:4230/ | grep -E 'manifest|apple-mobile-web-app|apple-touch-icon|theme-color'
```

Expected: all six new lines are present (theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style, apple-mobile-web-app-title, apple-touch-icon, manifest).

- [ ] **Step 5: Confirm the same is true through Tailscale HTTPS**

Run:

```bash
HOST=$(tailscale status --json | grep -o '"DNSName":"[^"]*"' | head -1 | cut -d'"' -f4 | sed 's/\.$//')
echo "host: $HOST"
curl -sS -o /dev/null -w '%{http_code}\n' "https://$HOST/manifest.webmanifest"
curl -sS -o /dev/null -w '%{http_code}\n' "https://$HOST/icons/icon-180.png"
```

Expected: `200` for both. If the manifest fetch fails over HTTPS but works over plain HTTP, re-check that `tailscale serve --bg 4230` is still running (`tailscale serve status`).

---

### Task 6: Manual iPhone verification (user-gated)

**Files:** none (live device test).

This task does not produce a commit; it gates the PR.

- [ ] **Step 1: Remove the old home-screen icon**

On the iPhone, long-press the existing "Portal" icon (or whatever it's called) and choose **Delete Bookmark / Remove from Home Screen**. iOS does not refresh metadata for an existing bookmark.

- [ ] **Step 2: Hard-refresh in Safari**

Open Safari, navigate to `https://<hostname>.<tailnet>.ts.net`. Pull-to-refresh, or close all Safari tabs first to ensure the new manifest is fetched fresh.

- [ ] **Step 3: Add to Home Screen**

Tap **Share** → scroll → **Add to Home Screen** → confirm the title says "Portal" → **Add**.

- [ ] **Step 4: Launch and verify standalone mode**

Tap the new icon. Expected:

- No URL bar at the top.
- No bottom Safari toolbar (back / share / refresh / compass).
- Status bar shows the time/battery only; no in-app browser X-to-close.
- Icon on home screen is the blue "P" square.

- [ ] **Step 5: Navigate within the app**

Open the Todo screen (or any other in-app route). Verify Safari chrome **does not appear** when navigating between routes. (This was the original failure mode.)

- [ ] **Step 6: API calls still work**

Add a task in the Todo UI; confirm it persists across reload (i.e. the `/api/...` proxy still works in standalone mode).

If any step above fails, do **not** push — debug first.

---

### Task 7: Push, open PR, watch CI

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/portal-pwa
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat: install portal as standalone PWA on iOS home screen" --body "$(cat <<'EOF'
## Summary
- Add web manifest (`display: standalone`, name, icons, colors).
- Add iOS-specific `<head>` meta tags (`apple-mobile-web-app-capable`, status bar style, title) and an `apple-touch-icon`.
- Generate a 180/192/512 PNG icon set from a single committed SVG; include a regen shell script (`apps/portal/scripts/generate-pwa-icons.sh`) using ImageMagick.
- README: add "Install on iPhone" subsection (delete the old bookmark, re-add).

Spec: `docs/superpowers/specs/2026-05-08-portal-pwa-design.md`
Plan: `docs/superpowers/plans/2026-05-08-portal-pwa.md`

## Test plan
- [ ] `curl https://<host>.<tailnet>.ts.net/manifest.webmanifest` returns valid JSON with `display: "standalone"`
- [ ] `curl https://<host>.<tailnet>.ts.net/icons/icon-180.png` returns 200 + image/png
- [ ] iPhone: delete old home-screen icon, re-add via Share → Add to Home Screen
- [ ] Tapping the new icon launches the portal with no Safari URL bar and no bottom toolbar
- [ ] In-app navigation does not surface Safari chrome
- [ ] `/api/...` calls still work in standalone mode
EOF
)"
```

- [ ] **Step 3: Watch CI**

```bash
gh pr checks --watch
```

If checks go red, investigate, fix, push, re-watch. Do not declare done while CI is red.

- [ ] **Step 4: After merge — finishing-a-development-branch cleanup**

```bash
git checkout main
git pull
git push origin --delete feat/portal-pwa
git branch -d feat/portal-pwa
```

---

## Self-review

- **Spec coverage:**
  - Manifest file → Task 2 ✓
  - Icon SVG (source of truth) → Task 1 step 1 ✓
  - 180/192/512 PNGs → Task 1 steps 6–7 ✓
  - Icon generator script → Task 1 step 2 ✓
  - `index.html` six meta/link additions → Task 3 step 2 ✓
  - README "Install on iPhone" subsection → Task 4 ✓
  - Verification (manifest fetch, icon fetch, iPhone install, in-app nav, /api) → Tasks 5 & 6 ✓
  - Risks (stale bookmark, missing magick, manifest validation, status-bar choice) → mitigated in Task 4 README, Task 1 step 5, Task 2 step 2, manifest design ✓
- **Placeholder scan:** no TBD / TODO / vague-handler text in any step.
- **Type / name consistency:** filenames (`icon-180.png`, `manifest.webmanifest`, `generate-pwa-icons.sh`) and the manifest property names (`display`, `start_url`, `theme_color`, `background_color`, `icons[].purpose`) match across all tasks and the spec.
