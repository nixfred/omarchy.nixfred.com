# omarchy.nixfred.com

**Omarchy OS in the browser.** A Hyprland session you can actually use: dwindle tiling, the stock Omarchy 4 theme set, a terminal, a file system, a browser, lock, boot, screensaver.

Live: https://omarchy.nixfred.com

This is not a portfolio dressed as windows. The earlier desktop-shell site that lived here moved conceptually to [oatlug.org](https://oatlug.org). This repo is the OS.

## Drive it

Super is **Alt** in the browser (the host OS already owns Super). Tap Alt, then a key, if a chord gets stolen.

| Input | Action |
|---|---|
| `SUPER + Return` | Terminal |
| `SUPER + Space` | Launcher |
| `SUPER + K` | Keybindings |
| `SUPER + W` | Close window |
| `SUPER + T` | Toggle floating |
| `SUPER + F` | Fullscreen |
| `SUPER + 1..0` | Workspaces |
| `SUPER + H/J` or arrows | Focus |
| `SUPER + Shift + arrows` | Swap |
| `SUPER + Shift + B / F / N` | Browser / Files / Editor |
| `SUPER + Ctrl + L` | Lock |
| `SUPER + [` `]` | Cycle themes |
| `?theme=gruvbox` | Deep-link a theme |
| `?noboot` | Skip Plymouth |
| `?boot=1` | Replay the boot |

The terminal is a shell. `help`, `fastfetch`, `omarchy theme set kanagawa`, `ls`, `nvim README.md`, `firefox omarchy.org`.

Idle: 2 minutes → screensaver, 5 minutes → lock. Any password unlocks.

## Stack

- Vite + Preact + TypeScript
- Palettes and wallpapers from `/usr/share/omarchy/themes` (Omarchy 4.0.2)
- Cloudflare Pages (`omarchy-nixfred-com`) + a `/proxy` Pages Function for the in-session browser

## Run it

```bash
bun install
bun run dev        # http://localhost:4720
bun run build
bun run deploy     # wrangler pages deploy
```

## License

MIT. Wallpaper images and palettes belong to their Omarchy theme authors.
The Omarchy wordmark belongs to Omarchy.
