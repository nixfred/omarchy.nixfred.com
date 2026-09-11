#!/usr/bin/env bash
# Build site/assets/img/family/pulse-suite.png - the featured Pulse card's shot.
#
#   scripts/pulse-sheet.sh
#
# The Pulse Suite is six plugins, so there is no single panel to photograph. The
# card's image is a 3x2 contact sheet of the six real captures, each cropped to
# its hero (the top of the panel, where these plugins put the chip and the big
# number). Re-run it after recapturing any Pulse panel.
#
# 1600x900 exactly, because the card crops 16/9 and anything else letterboxes.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
shot="$root/site/assets/img/shot"
out="$root/site/assets/img/family/pulse-suite.png"

# Order is the reading order of the sheet, not the catalogue's.
panels=(nixfred-cpu-pulse nixfred-ram-pulse nixfred-disk-pulse
        nixfred-net-pulse pi-audio pi-power)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Built in the same loop that writes the files. Bash can prefix an array with
# ${a[@]/#/x} but cannot prefix AND suffix in one expansion, and a half-applied
# pattern silently hands montage six extensionless paths.
tiles=()
for p in "${panels[@]}"; do
  [ -f "$shot/$p.png" ] || { echo "  ✗ missing $shot/$p.png" >&2; exit 1; }
  # Width first, then a top crop: resizing to a box would letterbox the short ones.
  magick "$shot/$p.png" -gravity north -resize 534x -crop 534x450+0+0 +repage "$tmp/$p.png"
  tiles+=("$tmp/$p.png")
done

mkdir -p "$(dirname "$out")"
magick montage "${tiles[@]}" \
  -tile 3x2 -geometry +0+0 -background '#070b11' "$out"
magick "$out" -resize 1600x900! -strip -quality 88 "$out"

echo "  ✓ $out — $(identify -format '%wx%h' "$out")"
