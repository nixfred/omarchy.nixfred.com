#!/usr/bin/env bash
# Capture a real screenshot of a plugin's panel on this machine.
#
#   scripts/capture.sh <ipc-target> <plugin-id> [open-fn]
#
# Switches to an empty workspace, opens the panel, grabs the whole frame.
#
# Auto-cropping to the panel was tried four ways and abandoned: Infomarchy is a
# live wallpaper, so a before/after diff returns the entire screen and no amount
# of masking separated panel from background reliably. The empty workspace makes
# cropping unnecessary anyway - nothing is open on it, so the frame is wallpaper,
# bar and panel. That is the plugin in its real context, and it carries none of
# Fred's private window content.
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
cleanup() { $IPC "$target" close >/dev/null 2>&1; ws "$prev_ws"; rm -rf "$tmp"; }
trap cleanup EXIT

free_ws=$(hyprctl workspaces -j | jq -r '[.[].id] | . as $u | first(range(1;40) | select(. as $i | ($u | index($i)) | not))')
ws "$free_ws"
sleep 1.2

$IPC "$target" close >/dev/null 2>&1
sleep 0.6
if ! $IPC "$target" "$fn" >/dev/null 2>&1; then
  echo "  ✗ $id — ipc $fn failed"; exit 1
fi
sleep 2.0                      # let the panel finish animating in
grim "$tmp/shot.png" || { echo "  ✗ $id — grim failed"; exit 1; }

mkdir -p "$(dirname "$out")"
magick "$tmp/shot.png" -resize 1440x -strip -quality 90 "$out"
echo "  ✓ $id — $(identify -format '%wx%h' "$out")"
