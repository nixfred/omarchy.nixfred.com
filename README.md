# omarchy.nixfred.com

A personal site that cosplays an [Omarchy](https://omarchy.org/) desktop:
workspace switcher in the bar, tiled app windows, cycling themes with real
Omarchy palettes, a command palette on `Space`, and a terminal where Larry —
my persistent AI collaborator — replays real shipped requests.

**Live: https://omarchy.nixfred.com**

Heavily inspired by the excellent [omarchy.rvbbit.ai](https://omarchy.rvbbit.ai/)
design exploration by RVBBIT. Theme palettes and wallpapers are from
[Omarchy](https://github.com/basecamp/omarchy)'s theme set.

## Run it

No build step, no dependencies — three files of vanilla HTML/CSS/JS.

```bash
python3 -m http.server 8462
# → http://localhost:8462
```

## Drive it

| Input | Action |
|-------|--------|
| `Alt+1..4` | Workspaces: Home · Cards · Writing · Fleet |
| `Space` | Command palette (searches everything) |
| footer `‹ ›` | Theme cycle — 8 themes, auto-advances every 20s; click the name to pause |
| `?theme=gruvbox` | Deep-link a theme |
| `#cards` `#writing` `#fleet` | Deep-link a workspace |

On Home, the Larry terminal loops through six real projects (clipsync, Blip,
upstream watch, Swish, larry.status, plonk) — when a scenario completes, its
widget chip appears in the top bar.

## Structure

All content is plain data at the top of `app.js` — `THEMES`, `HERO_COPY`
(per-theme hero taglines), `CARDS` (the twelve projects), `SCENARIOS`
(the Larry demo), `DOCS` (writing), `FLEET` (hosts). Edit, refresh, done.

## License

MIT © Fred Nix. Wallpaper images belong to their respective Omarchy theme
authors.
