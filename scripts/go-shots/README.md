# OperoGo screens

The drawn phone screens behind the OperoGo section of the home page. They are illustrations of the mobile app made with
creative license, not captures: each `<screen>.html` is a screen, `shell.css` is the phone every screen starts from, and
`render.mjs` renders them.

- `shell.css`: the phone frame (status bar, app bar with the OperoGo icon and the module accent, the content area, the
  Report a Building Issue banner and the home indicator), the tokens, and the parts (cards, rows, chips, buttons, inputs,
  module cards, the Oppie listening ring). Pages link it and keep only their own rules in their `<style>`.
- `render.mjs`: serves the repo root on a local port and screenshots each page at 390 x 844 CSS px, device scale 3, into
  `src/assets/go/<screen>.png` (1170 x 2532). Needs a Chromium (`CHROME_PATH` if none is installed for Playwright).
- `src/assets/go/<screen>.png`: the rendered output, committed with the page that made it. The site imports these files
  (`src/content/go-shots.ts`), so each picture's address carries a fingerprint of its contents.

## Starting a page

    <!doctype html>
    <html lang="en" class="m-property">   <!-- the module accent: m-property, m-leasing, m-field, m-forms, m-inspection, m-oppie; none for Home -->
    <head><meta charset="utf-8"><title>Property Management</title>
    <link rel="stylesheet" href="/scripts/go-shots/shell.css">
    <style>/* page-specific rules only */</style></head>
    <body>
      <div class="status"><span>9:41</span><span class="glyphs"><span class="bars"><i></i><i></i><i></i><i></i></span><svg class="icon i16" viewBox="0 0 24 24"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg><span class="battery"></span></span></div>
      <div class="appbar">
        <img class="app-icon" src="/public/brand/operogo/operogo-icon-rounded.svg" alt="">
        <span class="divider"></span>
        <div class="titles"><div class="title">OperoGo</div><div class="subtitle">Wrenfield Property Management</div></div>
        <div class="avatar">PR</div>
      </div>
      <div class="content"><div class="glow"></div> the screen </div>
      <div class="banner"><div class="bar"><svg class="icon i24" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg><div><div class="t">Report a Building Issue</div><div class="s">Leaks, outages, damage, safety</div></div><svg class="icon chev" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></div><div class="home"></div></div>
    </body></html>

A screen inside a module shows a back chevron before the icon: `<div class="back"><svg class="icon" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></div>`
as the app bar's first child, the title is the module or screen name, and the subtitle says where you are.

Geometry: status bar y 0 to 54; app bar y 54 to 114 (its accent bar is the bottom 3px); content y 114 to 760 with 16px side
padding (inner x 16 to 374); banner y 760 to 844. Content that is meant to run off the bottom runs under the banner; nothing
else is clipped. The `.glow` is the first child of `.content`.

## Marks

- The OperoGo icon: `<img class="app-icon" src="/public/brand/operogo/operogo-icon-rounded.svg" alt="">` in the app bar, 34px. Elsewhere size it with a width and height; the file's own corners are rounded.
- Oppie at rest: `<img class="oppie" src="/public/brand/oppie/oppie-rest-dark.svg" width="N" height="N" alt="">`, 56px inside the listening ring (`<div class="oppie-ring">`), 22px beside an answer, 16px in a chip. Never drawn by hand, never an orb of its own.
- Icons: inline SVG on a 24 viewBox, paths copied from `node_modules/lucide-react/dist/esm/icons/<name>.mjs`. No icon fonts.
- Photos: none. A photo thumbnail is a drawn placeholder, a rounded rectangle with a soft gradient and a camera glyph.

## Rules

- Copy: say property management, never the two-word phrase realtors use. No competitor product or outside software brand, no file-format brand. No em or en dashes anywhere in the file, comments and attributes included (`npm run check:copy`); separators are the middot, the comma and the colon. No calendar dates, weekdays, months or years ("in 12 days", "this week"). No prices and no dollar signs. Nothing about the books: no mention of that discipline or any such system. The assistant is Oppie, spelled so. The app is OperoGo, one word. The platform's modules by their bare names.
- Data: the firm, its properties, people, residents and lessees are fictional, the same ones the module screenshots use: Wrenfield Property Management; properties Horizon, Parkside Commons, Millbrook Plaza, Maple Row, Fenwick Lofts, Juniper Flats; lessees Aldergrove Dental, Pinecrest Analytics, Stonebridge Legal, Lakeshore Optometry, Fernhill Architects, Copperline Coffee, Birchwood Therapy, Northgate Insurance, Summit Engineering, Redbud Bakery, Granite Peak Fitness; people Dana Kowalski, Marcus Bell, Priya Raman, Theo Lindqvist, Luis Moreno, Elena Vasquez, Sam Okafor; vendors Brightline Painting, Kestrel Carpet, Northwind HVAC. Never the firm Opero was built inside, never a real company or person. The people who live or lease are residents and lessees.
- Assets: no photos, no external resources, no icon fonts. The only font is the self-hosted Plus Jakarta Sans. Marks come from `public/brand` and are never drawn by hand.
- Files: a builder owns exactly one `<screen>.html` and its PNG. Never touch `render.mjs`, `shell.css`, the other pages, `src/theme/tokens.ts` or anything under `public/brand`.
- Finish: render with `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/go-shots/render.mjs <screen>` and look at `src/assets/go/<screen>.png`. Nothing overlaps, nothing is clipped at the sides, every line of text fits its box, and the screen reads as a finished product someone would be proud to ship.
