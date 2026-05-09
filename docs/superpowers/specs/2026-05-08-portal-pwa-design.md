# Portal PWA — Standalone iOS Home-Screen App

## Problem

Adding the portal to the iPhone home screen currently produces a Safari
bookmark, not a standalone app. Tapping the icon opens a regular Safari tab
with the URL bar and bottom toolbar visible. The portal lacks the metadata iOS
needs to launch a saved page in standalone mode.

## Goal

Saving the portal to the iOS home screen produces an icon that, when tapped,
launches the portal in **standalone display mode**: no Safari URL bar, no
bottom toolbar, custom app name, custom icon.

## Non-goals

- Offline support / service worker
- App Store submission
- Push notifications
- Custom splash screen artwork beyond the manifest's auto-generated splash
- Android-specific PWA install prompts (Android still gets a manifest, but
  this design optimizes for iOS Safari)

## Architecture

iOS Safari decides whether to launch a home-screen page in standalone mode
based on metadata it finds in `index.html` and the linked web manifest at the
moment the page is added to the home screen. The implementation is therefore
purely static: a manifest, three icon PNGs sourced from one SVG, and six lines
of additional `<head>` markup. No build pipeline changes, no dev-server
changes, no service worker.

```
apps/portal/
├── src/
│   └── index.html               (add 6 PWA meta/link tags)
├── public/
│   ├── manifest.webmanifest     (new)
│   └── icons/
│       ├── icon.svg             (source of truth)
│       ├── icon-180.png         (apple-touch-icon)
│       ├── icon-192.png         (manifest)
│       └── icon-512.png         (manifest, maskable)
└── scripts/
    └── generate-pwa-icons.sh    (icon.svg → 3 PNGs via ImageMagick)
```

`apps/portal/public/` is already wired into Angular's build via `angular.json`
under `build.options.assets.input: "public"`, so anything dropped there is
served at the site root in dev and copied into `dist/` in prod.

## Files

### `apps/portal/public/manifest.webmanifest`

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

- `start_url: "/"` — tapping the icon always opens the app root.
- `display: standalone` — the key flag; instructs iOS Safari (when it sees
  `apple-mobile-web-app-capable: yes`) to drop browser chrome.
- `theme_color: #3880ff` — Ionic blue. Matches icon background.
- `background_color: #ffffff` — splash screen background while the SPA boots.
- The third `icons` entry with `purpose: "maskable"` is for Android adaptive
  icons; iOS ignores it. Same source PNG, no extra asset.

### `apps/portal/public/icons/icon.svg`

512×512 viewBox, solid `#3880ff` background, white "P" centered using a
system sans-serif. Source of truth — edit to rebrand.

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

iOS rounds the corners and applies its own gloss; the icon is a flat square
with no transparency, no rounding.

### `apps/portal/scripts/generate-pwa-icons.sh`

```sh
#!/usr/bin/env sh
# Regenerate the PWA icon PNGs from icon.svg.
# Run after editing apps/portal/public/icons/icon.svg.
# Requires ImageMagick 7 (`magick` on PATH).
set -eu
cd "$(dirname "$0")/.."
SRC="public/icons/icon.svg"
if ! command -v magick >/dev/null; then
  echo "error: 'magick' (ImageMagick 7) is required to regenerate icons" >&2
  echo "  install with: sudo apt install imagemagick" >&2
  exit 1
fi
for size in 180 192 512; do
  magick -background none -density 384 "$SRC" -resize "${size}x${size}" "public/icons/icon-${size}.png"
done
echo "wrote public/icons/icon-{180,192,512}.png"
```

PNGs are committed to the repo so consumers don't need ImageMagick to build.
The script is only required when the SVG changes.

### `apps/portal/src/index.html`

Add the following inside `<head>`, after the existing `<meta name="viewport">`:

```html
<meta name="theme-color" content="#3880ff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Portal" />
<link rel="manifest" href="manifest.webmanifest" />
<link rel="apple-touch-icon" href="icons/icon-180.png" />
```

- `apple-mobile-web-app-capable: yes` is the historical iOS flag that, in
  combination with `display: standalone` in the manifest, drops Safari chrome.
- `apple-mobile-web-app-status-bar-style: default` keeps the status bar with
  a white background and black text — matches the portal's current light UI.
  Change to `black-translucent` later if/when an immersive layout is wanted
  (requires CSS safe-area work).
- `apple-mobile-web-app-title: Portal` is the label that appears under the
  icon on the home screen, capped at ~12 chars.

## README update

Add a short "Install on iPhone" subsection under the existing **Tailscale Setup
→ Enable HTTPS for the portal** section:

```markdown
### Install on iPhone

1. Open `https://<hostname>.<tailnet>.ts.net` in Safari.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Tap the new "Portal" icon. It opens standalone — no URL bar, no toolbar.

If you previously added an HTTP version of the portal to the home screen,
delete it first — iOS does not refresh saved bookmarks when the underlying
metadata changes.
```

## Verification

- `curl -s https://<host>.<tailnet>.ts.net/manifest.webmanifest` returns valid
  JSON with `display: "standalone"`.
- `curl -sI https://<host>.<tailnet>.ts.net/icons/icon-180.png` returns 200 +
  `content-type: image/png`.
- iPhone: delete any prior home-screen icon. Visit URL in Safari → Share →
  Add to Home Screen → tap the icon. Page opens with no URL bar, no bottom
  Safari toolbar. Title under icon reads "Portal".
- Lighthouse PWA audit (desktop, optional): "Installable" ✓.

## Risks

- **Stale home-screen bookmarks.** iOS will not upgrade an existing bookmark
  when the manifest/meta tags change. README mitigates by telling the user to
  remove and re-add. No code workaround.
- **`magick` not installed.** The icon-generation script fails with a clear
  error message and an apt install hint. Generation is opt-in (only needed if
  the SVG is edited); the committed PNGs are sufficient at runtime.
- **Manifest validation.** Browsers silently ignore malformed manifests. The
  verification step `curl …/manifest.webmanifest | jq .` (or eyeballing the
  Application tab in Chrome DevTools) catches typos.
- **Status-bar style choice.** `default` is conservative. If the app later
  goes dark/immersive, switching to `black-translucent` will require CSS
  `env(safe-area-inset-*)` handling in the Ionic shell. Out of scope here.
