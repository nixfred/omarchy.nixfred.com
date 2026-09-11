#!/usr/bin/env bash
# Capture a plugin's panel on this machine.
#
#   scripts/capture.sh <ipc-target> <plugin-id> [open-fn]
#
# Two things have to be true before a before/after diff can find the panel:
#
#   1. An empty workspace, so no window is moving.
#   2. Infomarchy's dashboard hidden. It is a LIVE wallpaper, so while it is up
#      every frame differs from the last and the diff returns the whole screen.
#      Hiding it also keeps Fred's session names, repositories and paired device
#      names out of the shot - a full-screen capture with the desk up is not
#      publishable. See MEMORY: omarchy-screenshots-leak-the-infomarchy-desk.
#
# With both true the wallpaper is pixel-identical between frames, so whatever
# changed IS the panel, and the crop is exact.
set -uo pipefail

IPC="qs -p /usr/share/omarchy/shell ipc call"
target="$1"; id="$2"; fn="${3:-open}"
slug="${id//./-}"
out="$(cd "$(dirname "$0")/.." && pwd)/site/assets/img/shot/${slug}.png"
tmp="$(mktemp -d)"

# vic runs Hyprland's Lua config, where `hyprctl dispatch` evaluates a Lua
# expression. The classic `dispatch workspace 5` form errors out silently.
ws() { hyprctl dispatch "hl.dsp.focus({ workspace = \"$1\" })" >/dev/null 2>&1; }

prev_ws=$(hyprctl activeworkspace -j | jq -r .id)
desk_was=$($IPC infomarchy getDashboardVisible 2>/dev/null | tr -d '"' | tr -d '\n')

cleanup() {
  $IPC "$target" close >/dev/null 2>&1
  [ "$desk_was" = "true" ] && $IPC infomarchy setDashboardVisible true >/dev/null 2>&1
  ws "$prev_ws"
  rm -rf "$tmp"
}
trap cleanup EXIT

$IPC infomarchy setDashboardVisible false >/dev/null 2>&1
free_ws=$(hyprctl workspaces -j | jq -r '[.[].id] | . as $u | first(range(1;40) | select(. as $i | ($u | index($i)) | not))')
ws "$free_ws"
sleep 1.4

$IPC "$target" close >/dev/null 2>&1
sleep 0.7
grim "$tmp/before.png" || { echo "  ✗ $id — grim failed"; exit 1; }

if ! $IPC "$target" "$fn" >/dev/null 2>&1; then
  echo "  ✗ $id — ipc $fn failed"; exit 1
fi
sleep 2.0                      # let the panel finish animating in
grim "$tmp/after.png"

read -r x y w h < <(python3 "$(dirname "$0")/panel_bbox.py" "$tmp/before.png" "$tmp/after.png")

if [ "${w:-0}" -lt 220 ] || [ "${h:-0}" -lt 140 ]; then
  echo "  ✗ $id — no panel appeared (changed region ${w}x${h})"
  exit 1
fi

sw=$(identify -format '%w' "$tmp/after.png")
sh=$(identify -format '%h' "$tmp/after.png")
pad=16
x=$(( x > pad ? x - pad : 0 )); y=$(( y > pad ? y - pad : 0 ))
w=$(( x + w + pad*2 > sw ? sw - x : w + pad*2 ))
h=$(( y + h + pad*2 > sh ? sh - y : h + pad*2 ))

mkdir -p "$(dirname "$out")"
magick "$tmp/after.png" -crop "${w}x${h}+${x}+${y}" +repage \
       -resize '900x900>' -strip -quality 88 "$out"
echo "  ✓ $id — panel ${w}x${h} → $(identify -format '%wx%h' "$out")"
