import { setCheatsheet } from "../os/store";

const ROWS: [string, string][] = [
  ["SUPER + Return", "Terminal"],
  ["SUPER + Space", "Launcher (omarchy-menu)"],
  ["SUPER + K", "This cheatsheet"],
  ["SUPER + W", "Close window"],
  ["SUPER + T", "Toggle floating"],
  ["SUPER + F", "Fullscreen"],
  ["SUPER + 1..0", "Workspace"],
  ["SUPER + Shift + 1..0", "Move window to workspace"],
  ["SUPER + Tab", "Next workspace"],
  ["SUPER + H / J / ← / → / ↑ / ↓", "Focus window"],
  ["SUPER + Shift + arrows", "Swap window"],
  ["SUPER + Ctrl + arrows", "Resize split"],
  ["SUPER + Shift + B / F / N", "Browser / Files / Editor"],
  ["SUPER + Ctrl + T", "btop"],
  ["SUPER + Ctrl + L", "Lock"],
  ["SUPER + [ / ]", "Previous / next theme"],
  ["SUPER + Shift + Backspace", "Toggle gaps"],
  ["SUPER + Shift + Space", "Toggle bar"],
  ["Tap Alt", "Sticky Super for 1.5s"],
];

export function Cheatsheet() {
  return (
    <div class="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCheatsheet(false); }}>
      <div class="cheatsheet" role="dialog" aria-label="Keybindings">
        <h2>omarchy-menu-keybindings</h2>
        <p class="hint">
          Super is <b>Alt</b> in the browser — the host OS already owns Super.
          Tap Alt, then a key, if a chord gets stolen.
        </p>
        <table class="binds">
          <tbody>
            {ROWS.map(([k, v]) => (
              <tr key={k}>
                <td><kbd>{k}</kbd></td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
