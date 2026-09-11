# Banner brief — the FEATURED section header

Draw one wide banner graphic that heads the Featured section of
omarchy.nixfred.com. It replaces a plain text heading, so it has to carry the
word **FEATURED** and enough visual interest to earn the space.

Deliver as `site/assets/img/featured-banner.svg`. Nothing else changes.

## The letterforms are the point

This site borrows Omarchy's own signature: every letter in the Omarchy wordmark
(`/usr/share/omarchy/logo.svg`, also copied to
`site/assets/img/omarchy-wordmark.svg` in this repo) is built on a strict
**15-unit grid** with **45-unit stems**, **240-unit cap height**, **30-unit
gaps**, and a **two-step (30u) chamfer on the top-left and bottom-right corner
of every letter**. That bevel is the whole identity of the face.

**Read `site/assets/img/omarchy-wordmark.svg` first and measure it.** Then build
the word FEATURED in the same grammar. Only the letters O M A R C H Y exist in
the real face, so F E A T U R E D must be CONSTRUCTED on that grid following the
same rules. The A and the R are available verbatim in the source file — reuse the
A exactly, and take the R's bowl construction as your reference for D. Every
letter gets the same chamfer treatment. Do not typeset it with a font-family;
draw paths.

## The banner

- `viewBox="0 0 1200 150"`, `preserveAspectRatio="xMidYMid meet"`.
- Dark: assume it sits on `#06080b`. You may paint your own ground.
- The word FEATURED set left, at a readable size, in `#e8edf4`.
- Accent colour `#4aa8ff`. A second accent `#c77dff` may be used sparingly.
- Fill the space to the right of the word with **technical instrument motifs**
  consistent with the rest of the site: circuit traces, a spectrum trace, gauge
  ticks, a radar sweep, grid rules. Sharp and cold, like an oscilloscope face.
  No gradients-as-decoration, no drop shadows, no rounded app-icon shapes.
- It must still read at 360px wide on a phone. Keep the word dominant.

## Hard rules

- Hand-written, optimised SVG. No raster, no `<image>`, no `@font-face`, no
  `font-family` anywhere.
- No `<style>` block and no CSS classes: GitHub and some renderers strip them.
  Put attributes directly on the elements.
- Under 12 KB.
- Static. No `<animate>`; the page may add motion in CSS later.
- Must render correctly standalone: open it in a browser and look at it.

## Verify before you finish

Render it and LOOK at it, do not just read the markup:

```bash
rsvg-convert -w 1200 site/assets/img/featured-banner.svg -o /tmp/banner.png
```

Check: the chamfers all face the same way (top-left and bottom-right), the
letters sit on a consistent baseline with even spacing, nothing overlaps, and the
word is legible. Fix and re-render until it is right. Then append a line to
`site/assets/img/MANIFEST.md` describing it.
