#!/usr/bin/env bash
# Capture a GUI application's own window.
#
#   scripts/capture-app.sh <slug> <hyprland-class> <command...>
#
# capture.sh photographs a bar panel over IPC and capture-term.sh photographs a
# terminal. This one is for a real desktop app with its own toplevel: launch it,
# wait for the compositor to report a client with that class, and grab exactly
# the rectangle the compositor says it occupies.
#
# Same two preconditions as the others: an empty workspace so nothing else moves
# into frame, and Infomarchy's live desk hidden so a translucent window does not
# photograph Fred's session names through itself.
set -uo pipefail

IPC="qs -p /usr/share/omarchy/shell ipc call"
slug="$1"; cls="$2"; shift 2
out="$(cd "$(dirname "$0")/.." && pwd)/site/assets/img/shot/${slug}.png"

ws() { hyprctl dispatch "hl.dsp.focus({ workspace = \"$1\" })" >/dev/null 2>&1; }

prev_ws=$(hyprctl activeworkspace -j | jq -r .id)
desk_was=$($IPC infomarchy getDashboardVisible 2>/dev/null | tr -d '"\n')

cleanup() {
  hyprctl dispatch "hl.dsp.window.close({ match = { class = \"$cls\" } })" >/dev/null 2>&1
  [ "$desk_was" = "true" ] && $IPC infomarchy setDashboardVisible true >/dev/null 2>&1
  ws "$prev_ws"
}
trap cleanup EXIT

$IPC infomarchy setDashboardVisible false >/dev/null 2>&1
free_ws=$(hyprctl workspaces -j | jq -r '[.[].id] | . as $u | first(range(1;40) | select(. as $i | ($u | index($i)) | not))')
ws "$free_ws"
sleep 1.0

setsid "$@" >/dev/null 2>&1 &

for _ in $(seq 60); do
  geo=$(hyprctl clients -j | jq -r --arg c "$cls" \
        'first(.[] | select(.class == $c or (.initialClass == $c)) | "\(.at[0]) \(.at[1]) \(.size[0]) \(.size[1])") // empty')
  [ -n "$geo" ] && break
  sleep 0.25
done
[ -n "${geo:-}" ] || {
  echo "  ✗ $slug — no window with class '$cls'. Classes present:"
  hyprctl clients -j | jq -r '.[].class' | sort -u | sed 's/^/      /'
  exit 1
}

sleep 1.8
read -r x y w h <<<"$geo"
grim -g "${x},${y} ${w}x${h}" "$out" || { echo "  ✗ $slug — grim failed"; exit 1; }
magick "$out" -resize '1000x1000>' -strip -quality 88 "$out"
echo "  ✓ $slug — $(identify -format '%wx%h' "$out")"
