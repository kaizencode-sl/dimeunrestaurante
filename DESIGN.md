---
name: Dime un restaurante
description: Restaurantes puntuados en lunas por Alberto de Luna desde 2010.
colors:
  ink: "#0a0a0a"
  night: "#1c1b1a"
  paper: "#ece7db"
  moon: "#f7ecd0"
  glow: "#f2b33d"
  glow-text: "#8f5a06"
  grey: "#8d8a84"
  dim: "#474440"
  ink-soft: "#57544f"
  muted: "#e2dccd"
  photo-bg: "#dcd5c4"
  destructive: "#d8432b"
typography:
  display:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "clamp(120px, 31vw, 560px)"
    fontWeight: 900
    lineHeight: 0.78
    letterSpacing: "-0.045em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "clamp(56px, 9vw, 150px)"
    fontWeight: 900
    lineHeight: 0.85
    letterSpacing: "-0.04em"
    fontVariation: "'wdth' 118"
  title:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "clamp(30px, 4vw, 64px)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  numeral:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "clamp(120px, 20vw, 320px)"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 62"
    fontFeature: "'tnum'"
  aside:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(20px, 2.2vw, 30px)"
    fontWeight: 400
    lineHeight: 1.15
  body:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.35vw, 21px)"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.2
  card-text:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1
  ui:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.1
  ui-small:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1
  label-large:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  label:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  micro:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  eyebrow:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
rounded:
  photo: "3px"
  sticker: "4px"
  frame: "6px"
  inset: "10px"
  map: "14px"
  panel: "18px"
  pill: "99px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  section: "14vh"
  section-end: "16vh"
  content: "1500px"
  prose: "1200px"
components:
  score-stamp:
    textColor: "{colors.glow-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 14px 6px 8px"
  pill-cta:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "14px 20px 13px"
  tag:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 10px 5px"
  sticker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.glow-text}"
    rounded: "{rounded.sticker}"
    padding: "8px 11px 7px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "22px 22px 20px"
  card-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  final-panel:
    backgroundColor: "{colors.glow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "12vh 6vw 10vh"
---

# Design System: Dime un restaurante

## Overview

**Creative North Star: "Under One Moon"**

Alberto de Luna's surname and his scores are moons, so the whole site lives under one. Every page is a night scene: black ink, moonlight paper and a single harvest-moon gold. A score is not a number in a badge, it is the phase of a moon, and that moon recurs as the loader, the nav's progress mark, the score stamp, the footer's phase strip and the map pins. If a new screen has no moon in it somewhere, it is probably off-brand.

The voice is a late-night food column set as a poster: huge, wide, black-weight Archivo headlines that run edge to edge, answered by Instrument Serif italics that sound like the critic talking under his breath. Photos come first and fill their frames. The scroll is the narrator: sections pin, words light up, moons wax and numbers roll as you go. There is one visual world and no light/dark switch; sections alternate between night (ink) and paper, with gold reserved for the loudest moments.

Density is low and scale is extreme. Type sizes jump from 12px uppercase labels straight to 150–560px display words with little in between, which is what makes it feel like print rather than an app.

**Key Characteristics:**
- Night, moonlight and one accent; no theme switch.
- Variable-width grotesk: wide (112–125%) for names and headlines, condensed (62%) for numerals.
- Serif italic for every human aside: headlines of reviews, ledes, signatures.
- The moon phase is the score, the icon and the ornament.
- Flat surfaces, outlined and stamped controls, no shadows at rest.
- Motion is scroll-driven and always has a reduced-motion fallback.

## Colors

A three-note night palette, ink, paper and gold, with a few warm greys to hold text and photo placeholders.

### Primary
- **Harvest Moon Gold** (#f2b33d, `--glow`): the one accent. Fills on the night (the hero word, the cities band, the final panel, tags, the pill CTA, the cursor dot, map pins) and the lit side of moons on ink. Text on gold is always ink.
- **Burnt Gold** (#8f5a06, `--glow-text`): gold's deeper tone for text, outlines and the focus ring on paper, where #f2b33d would fail contrast. Score stamps, stickers, eyebrows on paper, active filters, link hovers.

### Neutral
- **Night Ink** (#0a0a0a, `--ink`): page background, the stage behind the loader and photo heroes, text on paper, 2px rules and card outlines.
- **Deep Night** (#1c1b1a, `--night`): the unlit body of a moon; the only near-black that isn't ink.
- **Moonlight Paper** (#ece7db, `--paper`): the reading surface for manifesto, lists, reviews and gallery sections; also text on ink.
- **Full Moon** (#f7ecd0, `--moon`): the lit part of moons, the big rolling number and text on the stage (`--on-stage`).
- **Ash** (#8d8a84, `--grey`): footer, inactive filters, empty states. Muted text only.
- **Soft Ink** (#57544f, `--ink-soft`): secondary text on paper: indexes, row footers, serif signatures.
- **Ember** (#474440, `--dim`): dim text and strokes on the night.
- **Linen** (#e2dccd, `--muted`) and **Photo Sand** (#dcd5c4, `--photo-bg`): quiet fills and the colour a photo frame shows before its image loads.
- **Brick** (#d8432b, `--destructive`): shadcn's destructive slot; not used in the current pages.

### Named Rules
**The One Gold Rule.** Gold is the only hue. Never add a second accent; when something needs emphasis, make it gold, bigger or inverted, not another colour.

**The Two Golds Rule.** #f2b33d fills and sits on ink; #8f5a06 is text and line on paper. Never put bright gold text on paper.

**The Token-Only Rule.** Style with the CSS variables in `src/styles/global.css` (or their Tailwind aliases like `bg-glow`, `text-ink`). The only literals allowed are `#fff` over photos and black alpha gradients that keep text legible on images.

## Typography

**Display Font:** Archivo Variable, width axis (with system-ui)
**Serif Font:** Instrument Serif 400, roman and italic (with Georgia)

**Character:** One grotesk stretched to its limits, wide and black for shouting, condensed for numbers, against a soft italic serif for the critic's voice. The width axis does the work other systems give to a second display face.

### Hierarchy
- **Display** (900, clamp(120px, 31vw, 560px), 0.78, width 125%, -0.045em): the hero word only; runs off the bottom edge, gold on the photo.
- **Headline** (900, clamp(56px, 9vw, 150px), 0.85, width 118%, -0.04em): section titles (Reseñas, Lunas, the final "¿Dónde cenamos hoy?") and review titles (up to 200px).
- **Manifesto** (800, clamp(34px, 5.6vw, 92px), 1, width 88%, -0.025em, balanced): the paragraph that lights up word by word.
- **Title** (900, clamp(30px, 4vw, 64px), 0.9, width 112%, -0.03em, uppercase in rows): restaurant names in rows and cards.
- **Numeral** (800, up to 320px, 0.8, width 62%, tabular): scores and counters; always condensed so "10" and "0,5" hold the same footprint.
- **Aside** (Instrument Serif italic 400, clamp(18px, 2.2vw, 30px), 1.15): review headlines in quotes, ledes, signatures, empty states.
- **Body** (400, clamp(18px, 1.35vw, 21px), 1.6): review text, kept to a readable measure.
- **Label** (600, 12px, 1, 0.06–0.08em, uppercase): nav, footer, meta lines, row footers.
- **UI steps** between body and label, for controls and compact data: Control (600, 17px) for filter buttons and selects; Card text (800, 16px) and UI small (800, 14px) for list cards and badges on phones; UI (800–900, 15px) for score stamps, small names and viewer captions (at 400); Label large (600–900, 13px) for counts, resets and pill CTAs.
- **Micro** (700, 11px, 0.1em, uppercase): the smallest step, for seal labels, map hints and map card cities. Nothing goes below 11px.
- **Eyebrow** (700, 12px, 0.14em, uppercase, gold): section kickers (`.eyebrow`).

### Named Rules
**The Width Axis Rule.** Hierarchy comes from `font-stretch`, not new fonts: 125% display, 118% headline, 112% names, 88% manifesto, 62% numerals. Use `.wide` for 125%.

**The Optical Edge Rule.** Display type is aligned by its ink, not its box. Left-aligned headings take the `.flush` class (pulls them 0.06em left so the letters sit on the gutter the labels use); centred ones cancel the trailing negative tracking with `padding-right` equal to it.

**The Italic Voice Rule.** Anything that sounds like Alberto speaking (a quote, a lede, a sign-off) is Instrument Serif italic. Labels and data never are.

## Layout

Full-bleed sections stacked as alternating scenes: ink stage → paper manifesto → paper latest → ink lunas → gold cities → paper reviews → ink-framed gold final panel. Each section pads 14vh top and 16–18vh bottom with a 24px side gutter (16px under 640px). Content caps at 1500px (lists, heads, grids) and 1200px for the manifesto prose.

Scroll scenes use a tall wrapper (200–340svh) with a `position: sticky` 100svh stage inside, min-height 560px. Lists are CSS grid: `repeat(auto-fit, minmax(260px, 1fr))` cards with 14px gaps, review rows with 56px between them, a 200px sticky filter column beside the rows. Photo strips are a 1.35fr + three 1fr grid with 6px gaps.

Breakpoints: 800px collapses two-column scenes and grids to one column and turns the sticky filters into a wrapping row; 640px tightens the gutter; 480px drops the nav clock and keeps its moon. `body` and `main` use `overflow-x: clip` (not hidden, which would break sticky) so oversized type and marquees never widen the page.

## Elevation & Depth

Flat. Depth comes from scene changes (ink against paper against gold), from photos, and from the moon's own radial glow, not from shadows. Shadows appear only on things that float over other content.

### Shadow Vocabulary
- **Floating map** (`box-shadow: 0 30px 80px rgb(0 0 0 / 25%)`): the map window inside the gold final panel.
- **Overlay** (`0 18px 40px rgb(0 0 0 / 35%)`, `0 20px 50px rgb(0 0 0 / 50%)`): map popups and the photo viewer.
- **Outline tag** (`inset 0 0 0 1.5px currentColor`): an outline drawn with a shadow so it adds no size.

### Named Rules
**The Flat-At-Rest Rule.** Cards, rows, stamps and buttons never carry a shadow. Hover is shown by inversion (paper → ink), scale on photos, or a small rotate, not by lifting.

## Shapes

Mostly square-shouldered with two exceptions: pills and moons. Photos get a near-square 3px corner, stickers 4px, photos inside a review's text, the photo viewer and the map's panels and controls 6px, inset photos 10px, the map 14px, cards and the final panel 18px. Everything that is a stamp, tag or CTA is a full pill (99px). Lines are heavy and drawn in `currentColor`: 2px rules above rows, 2px card and stamp outlines, the logo's 2px box. The circle (the moon, the cursor dot, the hero's circular clip-path reveal) is the signature silhouette.

## Components

Stamped and outlined: controls read like ink stamps on a menu, outlined in 2px, inverting rather than lifting.

### Buttons and CTAs
- **Pill CTA** (`.map-open`): gold fill, ink text, 900 13px wide (112%) uppercase, 0.06em, 14px 20px padding, full pill. Hover: `scale(1.05) rotate(-2deg)`.
- **Text filters** (`.fbtn`): unstyled 600 17px Archivo in Ash; hover goes ink and nudges 4px right; `aria-pressed="true"` turns Burnt Gold with a "●" prefix.
- **Links**: inherit colour, 1px underline at 0.18em offset; hover to Burnt Gold on paper, Full Moon on ink.
- The shadcn `Button` in `src/components/ui/button.tsx` is installed but unused; if you use it, restyle it to these rules rather than its default 4xl-radius look.

### Score Stamp
The score as a stamp: a 22px outlined moon at the score's phase plus "7,5 lunas", 900 15px uppercase, Burnt Gold text and 2px outline, full pill, 6px 14px 6px 8px.

### Tags and Stickers
- **Tag**: gold pill, ink text, 700 12px uppercase; the `.update` variant is transparent with a 1.5px inset outline.
- **Sticker** (`.sticker`): absolutely placed paper label, Burnt Gold 2px border and text, 800 12px uppercase, 4px corner. On gold it switches to ink.

### Cards
`.card` on the home page: 2px ink outline, 18px corner, 22px padding, photo inset with 10px corner pulled 10px past the padding. Hover/focus inverts to ink on paper (0.35s) and scales the photo to 1.05. Score shows a 44px gold-on-night moon beside a 64px condensed numeral.

### Review Row
The list's unit: a 2px ink rule, a tabular index, the uppercase wide name with its serif quote under it, the score stamp on the right, then a four-photo strip and an uppercase meta footer. Hover scales the photos to 1.07 over 0.9s on `cubic-bezier(0.2, 0.7, 0.1, 1)`. A custom cursor grows to a 110px gold disc saying "Ver reseña".

### Review Photos
One format inside a review's text column: a single 3:2 photo or a pair of 4:5 photos, 6px corners, alternating as the text runs. Dish lists are plain numbered text; the photos of their dishes follow the list as a set captioned in the uppercase label style. Every photo is a button that opens the same full-screen viewer (← → step through all of them, Esc or a click closes). There is no separate gallery at the end.

### Navigation
Fixed, transparent, no colour of its own: each part samples what's under it and turns ink or white. After 80px of scroll it takes an 88% backing of the colour beneath plus a 12px blur. The DIME logo is 900 15px wide in a 2px box; links and the Madrid clock are 600 12px uppercase; a 13px outlined moon fills with scroll progress.

### Moon
`moon.astro` draws any score 0–10 as a moon phase in SVG and is themed only through `--moon-base`, `--moon-ring` and `--moon-lit`. Use it, never a star or number badge, wherever a score appears. The footer's phase strip runs new to full.

## Do's and Don'ts

### Do:
- **Do** put a moon on every new surface, drawn with `moon.astro` and themed through its three variables.
- **Do** alternate scenes between ink, paper and (rarely) gold, with 14vh/16vh section padding and a 24px gutter.
- **Do** use the width axis for hierarchy: 118–125% for headlines, 62% for numbers, tabular figures on any score.
- **Do** write quotes, ledes and sign-offs in Instrument Serif italic.
- **Do** use Burnt Gold (#8f5a06) for gold text and focus outlines on paper, bright gold (#f2b33d) only as fill or on ink.
- **Do** drive motion with GSAP through `gsap.matchMedia()`, gating hidden start states behind the `.motion` class so reduced-motion visitors get the finished page.

### Don't:
- **Don't** add a second accent colour or a light/dark toggle; the site is one night.
- **Don't** add shadows to cards, rows, stamps or buttons at rest.
- **Don't** hardcode colours outside the tokens, except `#fff` and black alpha gradients over photos.
- **Don't** show scores as stars or plain numbers in a badge; a score is a moon phase and "lunas".
- **Don't** introduce another display or body font; stretch Archivo instead.
- **Don't** use `overflow-x: hidden` on page wrappers; use `clip` so sticky scenes keep working.
