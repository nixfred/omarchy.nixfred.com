# omarchy.nixfred.com

The plugin catalogue for [Fred Nix](https://github.com/nixfred)'s Omarchy work.
Thirty bar plugins, a theme, and the tools around them.

Live at **https://omarchy.nixfred.com**.

## How it stays honest

Nothing on the page is a typed-in claim.

| Shown on the page | Where it comes from |
|---|---|
| Marketplace "listed" badge | `registry.json` in `omacom/omarchy-plugin-marketplace`, read live |
| Star counts | the GitHub API, per repo |
| Contribution heatmap | the GitHub GraphQL contributions calendar |
| Versions, names, descriptions | each plugin's own `manifest.json`, reconciled by `bin/audit` |

A plugin that has not been submitted to the official marketplace shows a grey
**not submitted** placeholder. When it gets listed, the nightly workflow notices
and the badge turns green on its own. Nobody edits a status by hand.

## Layout

```
data/plugins.json     hand-edited source of truth: families, taglines, accents
scripts/build.ts      merges it with GitHub + the registry -> site/data.json
scripts/capture.sh    screenshots a plugin's panel on a live Omarchy machine
bin/audit             reconciles ~/Projects against data/plugins.json
site/                 the static site, deployed as-is
```

`site/data.json` is generated. Never edit it.

## Working on it

```bash
bun scripts/build.ts                  # refresh the catalogue
cd site && python3 -m http.server 8899

bin/audit                             # what drifted?
bin/audit --apply                     # write version bumps back
bin/audit ~/Projects/<new-plugin>     # scaffold an entry for a new plugin
```

### Adding a plugin

1. `bin/audit` finds it on disk and prints a ready entry.
2. Paste it into `data/plugins.json`, set `family` and `accent`.
3. `bun scripts/build.ts`.

### Screenshots

`scripts/capture.sh <ipc-target> <plugin-id>` switches to an empty workspace,
opens the panel and grabs the frame. **Check every capture before committing it**:
on a machine running Infomarchy the wallpaper is a live information desk and will
show real session names, repositories and paired devices.

## Design

The page borrows Omarchy's own signature rather than inventing one. Every letter
in the Omarchy wordmark carries a two-step chamfer on its top-left and
bottom-right corner, so every box here does too, and the type is JetBrains Mono,
which is what Omarchy's UI uses. The wordmark itself is
`/usr/share/omarchy/logo.svg` copied verbatim, never redrawn.

The bar across the top is not a picture. It is the real widgets, animating, and
each one scrolls to its plugin.

Every icon, glyph and badge was drawn as hand-written SVG by Codex on Astra 6.

## Licence

MIT. Each plugin repo carries its own.
