#!/usr/bin/env bash
# Capture a plugin's panel by CLICKING its bar widget.
#
#   scripts/capture-click.sh <x> <y> <plugin-id>
#
# x and y are real screen pixels. ydotool's absolute mode on this machine lands
# the pointer at twice the numbers it is given, so they are halved on the way
# out; hyprctl cursorpos is the check if that ever changes.
#
# The sibling capture.sh opens a panel over IPC. Beatdeck and Burn Bar expose no
# open/toggle function, so the only way to raise their panel is the way a person
# does it: put the pointer on the widget and press the left button. Everything
# else - empty workspace, Infomarchy's desk hidden, before/after diff for the
# crop - is identical to capture.sh, and for the same reasons.
#
# Needs ydotoold running:  systemctl --user start ydotool
set -uo pipefail

IPC="qs -p /usr/share/omarchy/shell ipc call"
x="$1"; y="$2"; id="$3"
slug="${id//./-}"
out="$(cd "$(dirname "$0")/.." && pwd)/site/assets/img/shot/${slug}.png"
tmp="$(mktemp -d)"

ws() { hyprctl dispatch "hl.dsp.focus({ workspace = \"$1\" })" >/dev/null 2>&1; }
click() { ydotool mousemove -a -x $(( $1 / 2 )) -y $(( $2 / 2 )) >/dev/null 2>&1; sleep 0.35; ydotool click 0xC0 >/dev/null 2>&1; }

prev_ws=$(hyprctl activeworkspace -j | jq -r .id)
desk_was=$($IPC infomarchy getDashboardVisible 2>/dev/null | tr -d '"\n')

cleanup() {
  # Click the widget again to dismiss its panel, then put the desk and the
  # workspace back exactly as they were.
  click "$x" "$y" >/dev/null 2>&1
  [ "$desk_was" = "true" ] && $IPC infomarchy setDashboardVisible true >/dev/null 2>&1
  ws "$prev_ws"
  rm -rf "$tmp"
}
trap cleanup EXIT

$IPC infomarchy setDashboardVisible false >/dev/null 2>&1
free_ws=$(hyprctl workspaces -j | jq -r '[.[].id] | . as $u | first(range(1;40) | select(. as $i | ($u | index($i)) | not))')
ws "$free_ws"
sleep 1.4

grim "$tmp/before.png" || { echo "  ✗ $id — grim failed"; exit 1; }
click "$x" "$y"
sleep 2.2
grim "$tmp/after.png"

read -r bx by bw bh < <(python3 "$(dirname "$0")/panel_bbox.py" "$tmp/before.png" "$tmp/after.png")

if [ "${bw:-0}" -lt 220 ] || [ "${bh:-0}" -lt 140 ]; then
  echo "  ✗ $id — no panel appeared (changed region ${bw}x${bh})"
  exit 1
fi

sw=$(identify -format '%w' "$tmp/after.png")
sh=$(identify -format '%h' "$tmp/after.png")
pad=16
bx=$(( bx > pad ? bx - pad : 0 )); by=$(( by > pad ? by - pad : 0 ))
bw=$(( bx + bw + pad*2 > sw ? sw - bx : bw + pad*2 ))
bh=$(( by + bh + pad*2 > sh ? sh - by : bh + pad*2 ))

mkdir -p "$(dirname "$out")"
magick "$tmp/after.png" -crop "${bw}x${bh}+${bx}+${by}" +repage \
       -resize '900x900>' -strip -quality 88 "$out"
echo "  ✓ $id — panel ${bw}x${bh} → $(identify -format '%wx%h' "$out")"
