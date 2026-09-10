# Graphics brief — omarchy.nixfred.com

You are producing **every visual asset** for a dark, glowing showcase site for Fred Nix's
Omarchy desktop plugins. The site itself (HTML/CSS/JS layout) is being built separately.
Your job is the artwork only, delivered as **hand-written, optimised SVG files**.

Read `data/plugins.json` in this repo first. It is the source of truth for names,
taglines, families and per-plugin accent colours.

## Hard rules

- **SVG only.** No PNG, no JPEG, no base64 rasters, no external fonts, no `<image>` tags.
- Every icon uses `stroke="currentColor"` or `fill="currentColor"` so the page can recolour it.
  Do **not** hardcode the accent colours into the glyphs; the page applies them.
  The one exception is `wordmark.svg` and `favicon.svg`, which may use fixed colour.
- `viewBox="0 0 24 24"` for all plugin and family glyphs. No `width`/`height` attributes.
- Stroke-based, `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.
- Optimised: no editor metadata, no `<defs>` you do not use, no comments, one line per element.
- Each file must be under 2 KB.
- Legible at 20px. Test that by keeping detail count low: 3 to 7 strokes per glyph.
- Never reuse the same glyph for two plugins. Each must be distinguishable at a glance.

## Deliverable 1 — plugin glyphs

One file per plugin at `site/assets/img/glyph/<id>.svg`, where `<id>` is the plugin's
`id` field from data/plugins.json with dots replaced by dashes.
Example: `nixfred.ram-pulse` becomes `site/assets/img/glyph/nixfred-ram-pulse.svg`.

All 29 plugins. The glyph must depict **what the plugin does**, not a generic category icon.

The six Pulse plugins (RAM, CPU, Net, Disk, Audio, Power) are an explicit **family** and
must read as siblings: give them a shared silhouette, a chip or die outline, and vary only
the interior motif. That family resemblance is the single most important thing in this brief.

## Deliverable 2 — family icons

One per family in `data/plugins.json` at `site/assets/img/family/<family-id>.svg`.
Seven files. More abstract than the plugin glyphs, these head a section.

## Deliverable 3 — site identity

- `site/assets/img/wordmark.svg` — the words "omarchy plugins" set as a logotype.
  Geometric, technical, lowercase, tight tracking. Must work on a near-black ground.
  Draw the letterforms as paths; you may not reference a font family.
- `site/assets/img/favicon.svg` — a 32x32-safe mark derived from the wordmark. Simple enough
  to survive a browser tab.

## Deliverable 4 — status badges

`site/assets/img/badge/listed.svg`, `badge/pending.svg`, `badge/shelved.svg`,
`badge/fork.svg`. Small inline marks, 16x16 viewBox, currentColor, no text inside them.

## Aesthetic

The Omarchy bar is dark, glassy and glowing. These plugins draw silicon, sonar sweeps,
flux cells and spectrum analysers. Aim for **technical instrument** rather than friendly
app icon: think oscilloscope faces, circuit traces, radar, gauge needles. Sharp, precise,
slightly cold. No rounded-square app-icon containers, no gradients, no drop shadows.

## When you are done

Write `site/assets/img/MANIFEST.md` listing every file you created, one line each, with a
short note on what the glyph depicts. Do not modify any file outside `site/assets/img/`.
