#!/usr/bin/env bash
# Capture a terminal program's real output as a screenshot.
#
#   scripts/capture-term.sh <slug> <cols> <rows> <command...>
#
# The sibling capture.sh photographs a bar plugin's panel over IPC. The tools in
# the catalogue are not plugins - they are CLIs and TUIs - so the honest picture
# of one is a real terminal rendering it, in Fred's font and theme, not text set
# into an image by hand.
#
# Mechanics that matter:
#   * A dedicated kitty window with its own --class, so the geometry lookup can
#     never pick up one of the dozen other terminals on this machine.
#   * An empty workspace, and Infomarchy's live desk hidden, for the same reasons
#     capture.sh does it: a moving wallpaper behind a window with any
#     transparency ruins the frame, and the desk shows real session names.
#   * Geometry comes from `hyprctl clients -j`, never from guesswork - the
#     compositor already knows the exact position and size, decorations included.
set -uo pipefail

IPC="qs -p /usr/share/omarchy/shell ipc call"
slug="$1"; cols="$2"; rows="$3"; shift 3
out="$(cd "$(dirname "$0")/.." && pwd)/site/assets/img/shot/${slug}.png"
cls="cap-$slug-$$"

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

# Under a tiling compositor the app's requested initial size is discarded - the
# window is stretched to the workspace and the terminal renders at full width,
# which is how a 62-column capture came out 1000px wide and unreadable. The
# size has to come from the compositor, as a rule applied before it maps.
px_w=$(( cols * 10 + 24 ))
px_h=$(( rows * 21 + 24 ))
hyprctl keyword windowrulev2 "float, class:^(${cls})$" >/dev/null 2>&1
hyprctl keyword windowrulev2 "size ${px_w} ${px_h}, class:^(${cls})$" >/dev/null 2>&1

# `sh -c` so the caller can pass a pipeline; `read` holds the window open with
# the final frame on screen instead of racing the capture to exit.
kitty --class "$cls" -o remember_window_size=no -o confirm_os_window_close=0 \
      sh -c "$*; printf '\n'; read -r _" >/dev/null 2>&1 &

for _ in $(seq 40); do
  geo=$(hyprctl clients -j | jq -r --arg c "$cls" \
        'first(.[] | select(.class == $c) | "\(.at[0]) \(.at[1]) \(.size[0]) \(.size[1])") // empty')
  [ -n "$geo" ] && break
  sleep 0.25
done
[ -n "${geo:-}" ] || { echo "  ✗ $slug — window never appeared"; exit 1; }

sleep 2.0                       # let the program paint
# Re-read: the first hit can land before the size rule has been applied.
geo=$(hyprctl clients -j | jq -r --arg c "$cls" \
      'first(.[] | select(.class == $c) | "\(.at[0]) \(.at[1]) \(.size[0]) \(.size[1])") // empty')
read -r x y w h <<<"$geo"
grim -g "${x},${y} ${w}x${h}" "$out" || { echo "  ✗ $slug — grim failed"; exit 1; }
echo "  ✓ $slug — $(identify -format '%wx%h' "$out")"
