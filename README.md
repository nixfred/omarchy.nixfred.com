# omarchy.nixfred.com

The plugin catalogue for [Fred Nix](https://github.com/nixfred)'s Omarchy work.
62 public plugins, 18 desktop apps and tools, one theme, and earlier work.
Community forks and derived projects retain visible upstream credits.

Live at **https://omarchy.nixfred.com**.

## How it stays honest

Editorial descriptions are grounded in public repository documentation.
Live metadata comes from the sources below.

| Shown on the page | Where it comes from |
|---|---|
| Marketplace "listed" badge | `registry.json` in `omacom/omarchy-plugin-marketplace`, checked at build |
| Star counts | the GitHub API, per repo |
| Contribution heatmap | the GitHub GraphQL contributions calendar |
| Versions | each plugin's committed public `manifest.json`, read on every build |
| Names, descriptions, install commands and upstream credits | reviewed public manifests and README files |

An unlisted repository shows **not listed**. A failed registry read shows
**listing unknown**. No submission or maintenance status is inferred from a
missing listing or a recent push. The build refuses to emit data when any
linked repository cannot be verified public.

The live site uses the existing direct-upload Cloudflare Pages project
`omarchy-nixfred-com`, mapped to `omarchy.nixfred.com`. The nightly GitHub
workflow refreshes repository data; it does not upload Pages assets. The
existing `omarchy-data` Worker overlays public repo counts on `/data.json`
every three minutes. Its next successful refresh adopts a new Pages catalog.

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
bin/audit --apply                     # local audit only; build uses public versions
bin/audit ~/Projects/<new-plugin>     # scaffold an entry for a new plugin
```

### Adding a plugin

1. `bin/audit` finds it on disk and prints a ready entry.
2. Paste it into `data/plugins.json`, set `family` and `accent`.
3. Verify its public visibility, committed manifest, install steps and upstream credits.
4. `bun scripts/build.ts`.

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

## Production update

After verifying build and desktop/mobile rendering, commit and push the scoped
changes, then use the existing authenticated Cloudflare account:

```bash
wrangler pages deploy site --project-name omarchy-nixfred-com --branch main
```

Verify the terminal deployment result, the Pages origin, and the custom-domain
`/data.json` after the Worker refreshes. Do not treat a repository push as a
live deployment. No credentials belong in this repository.
