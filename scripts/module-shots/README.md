# Module screenshots

The "inside the module" pictures on the public site: one screen per module, drawn as a self-contained HTML page and rendered to a PNG. The site shows them in the platform section's lightbox (about 1150 CSS px wide) and as thumbnails (about 230 px wide).

## Files

- `shell.css`: the shared frame. Fonts, tokens, the module accent classes, the base reset, the 1440 x 900 app frame, sidebar, header, content area, breadcrumb, page header, foot, Oppie's marks, and the common components. Only the shell agent writes it; a page never pastes or overrides its rules.
- `<module>.html` (`build`, `studios`, `playbook`, `university`, `compass`): one screen each. Links `/scripts/module-shots/shell.css`, keeps its own page-specific CSS in one `<style>`, and nothing else external: no scripts, no web fonts, no stylesheets beyond the shell.
- `render.mjs`: serves the repo root on a local port and screenshots each page at 1440 x 900 CSS px, device scale 2, into `src/assets/modules/<module>.png` (2880 x 1800).
- `src/assets/modules/<module>.png`: the rendered output, committed with the page that made it. The site imports these files (`src/content/module-shots.ts`), so each picture's address carries a fingerprint of its contents and a re-rendered picture is never hidden behind a cached copy of the old one.

## Render

    node scripts/module-shots/render.mjs [module ...]

With no names it renders all five. If playwright's own Chromium is missing, name one:

    CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/module-shots/render.mjs studios

Then open the PNG and look: marks visible and trimmed, no broken images, Plus Jakarta Sans loaded (not a fallback), nothing clipped that should not be, every string present, and the focal element still readable at thumbnail size.

## Paths

The renderer serves the repo root, so every reference is root-relative to it:

- stylesheet: `/scripts/module-shots/shell.css`
- font: `/src/theme/fonts/PlusJakartaSans-Variable.woff2` (loaded by the shell; also the italic variable file)
- brand files: `/public/brand/...` (never `/brand/...`, which does not exist at the root and breaks silently)

## Starting a page

    <!doctype html>
    <html lang="en" class="m-studios">   <!-- m-build, m-studios, m-playbook, m-university or m-compass -->
    <head><meta charset="utf-8"><title>Studios</title>
    <link rel="stylesheet" href="/scripts/module-shots/shell.css">
    <style>/* page-specific rules only */</style></head>
    <body>
      <div class="sidebar"> .brand, .nav, .foot </div>
      <div class="header"> .pill, .hdr-right </div>
      <div class="content"> .glow, .crumbs, .page-header, then the page </div>
    </body></html>

The accent class on `<html>` sets `--m-hi`, `--m-base`, `--m-shade`, `--m-deep`, `--m-soft` and `--m-ring` for the whole page. The accent goes only where the specification's `accent` field for that screen lists it: the jewel beside the wordmark, the active nav stroke, the glow, and the named elements. Surfaces, text, borders and primary buttons never take it; status meaning uses `--success`, `--warning` and `--danger`.

Geometry: sidebar x 0 to 264; header x 264 to 1440, y 0 to 64; content inner x 288 to 1416; crumbs y 64 to 96; title y 108 to 140; rule at y 174; page content y 190 to 876. A card meant to run off the bottom is given more height than fits and the frame crops it; nothing else is clipped and no scrollbar appears. The `.glow` is the first child of `.content`; its `left` and `top` are relative to `.content` (x 264, y 64).

### Marks

- Sidebar brand band, where an app's name sits: the module's own name, its wordmark trimmed to its artwork and set 36px tall, 16px after a 20px `.jewel` disc. The Opero lockup does not appear on these screens.
  `<div class="brand"><span class="jewel"></span><svg class="mark" viewBox="BOUNDS"><image href="/public/brand/modules/<module>-dark.svg" x="290" y="-379" width="W" height="2037"/></svg></div>`
  with, per module (from `public/brand/manifest.json`):
  - build: `viewBox="819 150 2377 980"`, width 3435
  - studios: `viewBox="819 150 3751 980"`, width 4809
  - playbook: `viewBox="817 150 4637 980"`, width 5693
  - university: `viewBox="819 150 4888 980"`, width 5947
  - compass: `viewBox="819 150 4632 980"`, width 5691
- Foot discs, brand order, the current one ringed:
  `<div class="foot"><div class="discs"><span class="jewel m-build"></span><span class="jewel m-studios"></span><span class="jewel m-playbook current"></span><span class="jewel m-university"></span><span class="jewel m-compass"></span></div>Switch module</div>`
- Oppie at rest: `<img class="oppie" src="/public/brand/oppie/oppie-rest-dark.svg" width="20" height="20" alt="">` (20px in the pill, 12px in a chip, 20px beside a chat turn, 28px in an answer band).
- Oppie thinking (Build only): paste the whole source of `public/brand/oppie/oppie-thinking-dark.svg` inline once inside `<span class="oppie-thinking">`; the shell freezes it mid-turn. A second thinking mark on the same page is an `<img>` of the rest file, never a second inline copy (the gradient ids would collide).
- Icons: `<svg class="icon" viewBox="0 0 24 24">` with the elements copied from `node_modules/lucide-react/dist/esm/icons/<name>.mjs`. Sizes: `.i16`, `.i14`, `.i12`. Never an icon font, never a typed glyph: checks, chevrons, rings and comparison signs are SVG or words.

### Components in the shell

Buttons `.btn` with `.btn-primary` (silver), `.btn-secondary`, `.btn-ghost`, `.btn-dashed`, `.btn-sm`, `.btn-icon` (36px round), `.btn-square`, `.btn-block`, `.is-working`; segmented control `.seg` with `.on`, `.seg-sm`; chips `.chip` with `.chip-module`, `.chip-success`, `.chip-warning`, `.chip-danger`, `.chip-neutral`, `.chip-outline`, `.chip-square`; `.eyebrow`; cards `.card`, `.card-raised`, `.card-flush`, `.card-title`, `.section-title`; tables (`th`, `td`, `.num`, `.first`, `.center`, `.cell`); tabs `.tabs` with `.tab.on`; inputs `.input`, `.textarea`, `.checkbox`, `.check-label`; avatars `.avatar` (32), `.avatar-sm` (24), `.avatar-xs` (22), `.person`; progress `.track` with an inner `span` sized by width, `.track-thin`; type helpers `.body`, `.prose`, `.meta`, `.muted`, `.subtle`, `.num-kpi`, `.num-ring`, `.num-hero`; layout helpers `.row`, `.stack`, `.grow`, `.right`, `.truncate`, `.dot`.

## Rules

Reviewers fail the work on any slip.

- Copy: say property management, never the two-word phrase realtors use. No competitor product or outside software brand, no file-format brand. No em or en dashes anywhere in the file, comments and attributes included (`npm run check:copy`); separators are the middot, the comma and the colon. No calendar dates, weekdays or years ("in 12 days", "this week", "Period 3"). No prices and no dollar signs. Nothing about the books: no mention of that discipline or any such system (budgets and reporting may appear as what they are). The assistant is Oppie, spelled so. Modules by their bare names (Studios, never prefixed with the product name). The firm, its properties, people, residents and lessees are fictional: never the firm Opero was built inside, never a real company or person, and the people who live or lease are residents and lessees. Strings come from the specification word for word.
- Assets: no photos, no external resources, no icon fonts. The only font is the self-hosted Plus Jakarta Sans. Marks come from `public/brand` and are never drawn by hand, never placed untrimmed. Oppie is five rounded pills in the jewel colors, never an orb, never animated in a still.
- Legibility: nothing that must be read is under 13 CSS px (the 11px initials inside a decorative avatar are the one exception). Headlines stay loose: never condense tracking or line height. Each screen has one focal element that still reads in the thumbnail.
- Color: tokens only. Every color is one of the shell's custom properties or a literal from the specification's token block.
- Files: a builder owns exactly one `<module>.html` and its PNG. Never touch `render.mjs`, `shell.css`, the other pages, `src/theme/tokens.ts` or anything under `public/brand`.
