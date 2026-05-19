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
  convert -background "#3880ff" -density 384 "$SRC" -resize "${size}x${size}" \
    -alpha remove -alpha off "public/icons/icon-${size}.png"
done
echo "wrote public/icons/icon-{180,192,512}.png"
