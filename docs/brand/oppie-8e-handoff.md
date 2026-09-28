# Oppie: icon and motion handoff (option 8e "Flip")

Everything needed to implement Opero's AI agent icon. Artwork is embedded below as complete SVG source; copy each block into its own `.svg` file or inline it in components.

## What Oppie is
Oppie is Opero's AI agent. Its icon is five rounded pills standing side by side, one for each Opero module: **Build, Studios, Playbook, University, Compass**. Each pill is a deep jewel tone at the top that fades into a shared graphite base, so the five read as one family rather than a rainbow. The middle pill is tallest; the set is symmetrical, like a voice level.

## How it behaves
- **At rest (not engaged):** the pills stand still, facing forward. Oppie is present and available without drawing attention.
- **Thinking:** each pill spins on its own vertical axis, one after another from left to right, like a row of coins being turned over. One full turn takes 1.6s and each pill starts 0.16s after the one before it, so the motion ripples across the row and never stops while Oppie is working.
- The pills have thickness. As one turns edge-on it narrows to about half its width (never to a line), darkens on its side, and its white highlight slides across the curved surface. That is what makes the turn read as three-dimensional.
- When the answer arrives, let the current turn finish and settle facing forward rather than cutting the animation mid-spin.

## States
| State | When | Motion |
|---|---|---|
| Rest | Idle on a page, chat closed, waiting for input | Static SVG |
| Thinking | Request received, forming or streaming an answer | Animated SVG (Flip) |

Switch states by swapping the `oppie-bar`/`oppie-shade`/`oppie-glint` animations on and off on the same element (e.g. toggle a class on the wrapper), not by swapping images, so there's no flicker or layout shift. Both SVGs share identical geometry.

## Colours
| Module | Light-mode tip | Dark-mode tip | Pill height (of 100) |
|---|---|---|---|
| Build | #a8231c | #c8342a | 36 |
| Studios | #4b2382 | #7446b8 | 60 |
| Playbook | #a86f0c | #c88a1a | 80 |
| University | #1d6b43 | #2a8a58 | 60 |
| Compass | #136c78 | #1d8c9a | 36 |

Graphite base: #23262b on light backgrounds, #3a3d45 on dark. Dark-mode tips are brighter so purple stays visible on dark UI.

## Geometry
- viewBox 0 0 100 100. Pills are 12 wide, 5 apart, vertically centred at y=50, fully rounded (rx 6).
- Heights left to right: 36, 60, 80, 60, 36.
- Shading layers per pill: horizontal gradient (curved surface), vertical gradient (jewel top to graphite base), a black side-shade overlay (0 at rest), a white glint stripe, a thin rim stroke.

## Sizes and contexts
- 40px and up: full animation.
- 24 to 39px: animation still reads; keep it.
- Below 24px (favicon, dense lists): static only.
- Email, print, social images: static only.
- If several Oppie icons are on screen, only the one for the active conversation animates.

## Accessibility
- `prefers-reduced-motion: reduce` disables the spin (built into the animated SVG). Show "Oppie is thinking…" as text instead.
- Use `aria-label` "Oppie" at rest and "Oppie is thinking" while animating; announce changes through an `aria-live="polite"` region.
- Pause animation when the tab is hidden.

## Don'ts
- Don't change pill order, count, or colours.
- Don't spin the whole icon; each pill turns on its own axis.
- Don't use the flip as a generic loading spinner for non-Oppie content.

## Implementation note
Some image pipelines and CDNs strip `<style>` from SVG files, which silently removes the animation. If the animated file stops moving in production, inline the SVG in the page/component instead of loading it with `<img>`.

---

## Artwork

### oppie-thinking-light.svg
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Oppie is thinking">
  <style>
    .oppie-bar{transform-box:fill-box;transform-origin:center;animation:oppie-spin 1.6s linear infinite}
    .oppie-shade{opacity:0;animation:oppie-side 1.6s linear infinite}
    .oppie-glint{animation:oppie-glint 1.6s linear infinite}
    @keyframes oppie-spin{0.00%{transform:scaleX(1.000)}2.08%{transform:scaleX(0.994)}4.17%{transform:scaleX(0.976)}6.25%{transform:scaleX(0.947)}8.33%{transform:scaleX(0.908)}10.42%{transform:scaleX(0.861)}12.50%{transform:scaleX(0.806)}14.58%{transform:scaleX(0.748)}16.67%{transform:scaleX(0.689)}18.75%{transform:scaleX(0.634)}20.83%{transform:scaleX(0.589)}22.92%{transform:scaleX(0.559)}25.00%{transform:scaleX(0.548)}27.08%{transform:scaleX(0.559)}29.17%{transform:scaleX(0.589)}31.25%{transform:scaleX(0.634)}33.33%{transform:scaleX(0.689)}35.42%{transform:scaleX(0.748)}37.50%{transform:scaleX(0.806)}39.58%{transform:scaleX(0.861)}41.67%{transform:scaleX(0.908)}43.75%{transform:scaleX(0.947)}45.83%{transform:scaleX(0.976)}47.92%{transform:scaleX(0.994)}50.00%{transform:scaleX(1.000)}52.08%{transform:scaleX(0.994)}54.17%{transform:scaleX(0.976)}56.25%{transform:scaleX(0.947)}58.33%{transform:scaleX(0.908)}60.42%{transform:scaleX(0.861)}62.50%{transform:scaleX(0.806)}64.58%{transform:scaleX(0.748)}66.67%{transform:scaleX(0.689)}68.75%{transform:scaleX(0.634)}70.83%{transform:scaleX(0.589)}72.92%{transform:scaleX(0.559)}75.00%{transform:scaleX(0.548)}77.08%{transform:scaleX(0.559)}79.17%{transform:scaleX(0.589)}81.25%{transform:scaleX(0.634)}83.33%{transform:scaleX(0.689)}85.42%{transform:scaleX(0.748)}87.50%{transform:scaleX(0.806)}89.58%{transform:scaleX(0.861)}91.67%{transform:scaleX(0.908)}93.75%{transform:scaleX(0.947)}95.83%{transform:scaleX(0.976)}97.92%{transform:scaleX(0.994)}100.00%{transform:scaleX(1.000)}}@keyframes oppie-side{0.00%{opacity:0.000}2.08%{opacity:0.055}4.17%{opacity:0.109}6.25%{opacity:0.161}8.33%{opacity:0.210}10.42%{opacity:0.256}12.50%{opacity:0.297}14.58%{opacity:0.333}16.67%{opacity:0.364}18.75%{opacity:0.388}20.83%{opacity:0.406}22.92%{opacity:0.416}25.00%{opacity:0.420}27.08%{opacity:0.416}29.17%{opacity:0.406}31.25%{opacity:0.388}33.33%{opacity:0.364}35.42%{opacity:0.333}37.50%{opacity:0.297}39.58%{opacity:0.256}41.67%{opacity:0.210}43.75%{opacity:0.161}45.83%{opacity:0.109}47.92%{opacity:0.055}50.00%{opacity:0.000}52.08%{opacity:0.055}54.17%{opacity:0.109}56.25%{opacity:0.161}58.33%{opacity:0.210}60.42%{opacity:0.256}62.50%{opacity:0.297}64.58%{opacity:0.333}66.67%{opacity:0.364}68.75%{opacity:0.388}70.83%{opacity:0.406}72.92%{opacity:0.416}75.00%{opacity:0.420}77.08%{opacity:0.416}79.17%{opacity:0.406}81.25%{opacity:0.388}83.33%{opacity:0.364}85.42%{opacity:0.333}87.50%{opacity:0.297}89.58%{opacity:0.256}91.67%{opacity:0.210}93.75%{opacity:0.161}95.83%{opacity:0.109}97.92%{opacity:0.055}100.00%{opacity:0.000}}@keyframes oppie-glint{0.00%{transform:translateX(0.00px);opacity:1.000}2.08%{transform:translateX(-0.42px);opacity:0.994}4.17%{transform:translateX(-0.83px);opacity:0.978}6.25%{transform:translateX(-1.22px);opacity:0.951}8.33%{transform:translateX(-1.60px);opacity:0.913}10.42%{transform:translateX(-1.95px);opacity:0.866}12.50%{transform:translateX(-2.26px);opacity:0.810}14.58%{transform:translateX(-2.54px);opacity:0.746}16.67%{transform:translateX(-2.77px);opacity:0.675}18.75%{transform:translateX(-2.96px);opacity:0.599}20.83%{transform:translateX(-3.09px);opacity:0.518}22.92%{transform:translateX(-3.17px);opacity:0.435}25.00%{transform:translateX(-3.20px);opacity:0.350}27.08%{transform:translateX(-3.17px);opacity:0.435}29.17%{transform:translateX(-3.09px);opacity:0.518}31.25%{transform:translateX(-2.96px);opacity:0.599}33.33%{transform:translateX(-2.77px);opacity:0.675}35.42%{transform:translateX(-2.54px);opacity:0.746}37.50%{transform:translateX(-2.26px);opacity:0.810}39.58%{transform:translateX(-1.95px);opacity:0.866}41.67%{transform:translateX(-1.60px);opacity:0.913}43.75%{transform:translateX(-1.22px);opacity:0.951}45.83%{transform:translateX(-0.83px);opacity:0.978}47.92%{transform:translateX(-0.42px);opacity:0.994}50.00%{transform:translateX(-0.00px);opacity:1.000}52.08%{transform:translateX(0.42px);opacity:0.994}54.17%{transform:translateX(0.83px);opacity:0.978}56.25%{transform:translateX(1.22px);opacity:0.951}58.33%{transform:translateX(1.60px);opacity:0.913}60.42%{transform:translateX(1.95px);opacity:0.866}62.50%{transform:translateX(2.26px);opacity:0.810}64.58%{transform:translateX(2.54px);opacity:0.746}66.67%{transform:translateX(2.77px);opacity:0.675}68.75%{transform:translateX(2.96px);opacity:0.599}70.83%{transform:translateX(3.09px);opacity:0.518}72.92%{transform:translateX(3.17px);opacity:0.435}75.00%{transform:translateX(3.20px);opacity:0.350}77.08%{transform:translateX(3.17px);opacity:0.435}79.17%{transform:translateX(3.09px);opacity:0.518}81.25%{transform:translateX(2.96px);opacity:0.599}83.33%{transform:translateX(2.77px);opacity:0.675}85.42%{transform:translateX(2.54px);opacity:0.746}87.50%{transform:translateX(2.26px);opacity:0.810}89.58%{transform:translateX(1.95px);opacity:0.866}91.67%{transform:translateX(1.60px);opacity:0.913}93.75%{transform:translateX(1.22px);opacity:0.951}95.83%{transform:translateX(0.83px);opacity:0.978}97.92%{transform:translateX(0.42px);opacity:0.994}100.00%{transform:translateX(0.00px);opacity:1.000}}
    @media (prefers-reduced-motion:reduce){.oppie-bar,.oppie-shade,.oppie-glint{animation:none!important}.oppie-shade{opacity:0}}
  </style>
  <defs>
    <linearGradient id="oppie-f0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c130f"/><stop offset=".18" stop-color="#a8231c"/><stop offset=".42" stop-color="#f43329"/><stop offset=".7" stop-color="#a8231c"/><stop offset="1" stop-color="#4c100d"/></linearGradient><linearGradient id="oppie-v0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#291348"/><stop offset=".18" stop-color="#4b2382"/><stop offset=".42" stop-color="#6d33bd"/><stop offset=".7" stop-color="#4b2382"/><stop offset="1" stop-color="#22103b"/></linearGradient><linearGradient id="oppie-v1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c3d07"/><stop offset=".18" stop-color="#a86f0c"/><stop offset=".42" stop-color="#f4a111"/><stop offset=".7" stop-color="#a86f0c"/><stop offset="1" stop-color="#4c3205"/></linearGradient><linearGradient id="oppie-v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#103b25"/><stop offset=".18" stop-color="#1d6b43"/><stop offset=".42" stop-color="#2a9b61"/><stop offset=".7" stop-color="#1d6b43"/><stop offset="1" stop-color="#0d301e"/></linearGradient><linearGradient id="oppie-v3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f4" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a3b42"/><stop offset=".18" stop-color="#136c78"/><stop offset=".42" stop-color="#1c9dae"/><stop offset=".7" stop-color="#136c78"/><stop offset="1" stop-color="#093136"/></linearGradient><linearGradient id="oppie-v4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
  </defs>
  <g class="oppie-bar" style="animation-delay:0.00s"><!-- Build -->
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-f0)"/>
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-v0)"/>
    <rect class="oppie-shade" style="animation-delay:0.00s" x="10" y="32" width="12" height="36" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.00s"><rect x="14" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="10.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.16s"><!-- Studios -->
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-f1)"/>
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-v1)"/>
    <rect class="oppie-shade" style="animation-delay:0.16s" x="27" y="20" width="12" height="60" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.16s"><rect x="31" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="27.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.32s"><!-- Playbook -->
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-f2)"/>
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-v2)"/>
    <rect class="oppie-shade" style="animation-delay:0.32s" x="44" y="10" width="12" height="80" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.32s"><rect x="48" y="13" width="2.6" height="74" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="44.5" y="10.5" width="11" height="79" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.48s"><!-- University -->
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-f3)"/>
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-v3)"/>
    <rect class="oppie-shade" style="animation-delay:0.48s" x="61" y="20" width="12" height="60" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.48s"><rect x="65" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="61.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.64s"><!-- Compass -->
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-f4)"/>
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-v4)"/>
    <rect class="oppie-shade" style="animation-delay:0.64s" x="78" y="32" width="12" height="36" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.64s"><rect x="82" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="78.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
</svg>
```

### oppie-thinking-dark.svg
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Oppie is thinking">
  <style>
    .oppie-bar{transform-box:fill-box;transform-origin:center;animation:oppie-spin 1.6s linear infinite}
    .oppie-shade{opacity:0;animation:oppie-side 1.6s linear infinite}
    .oppie-glint{animation:oppie-glint 1.6s linear infinite}
    @keyframes oppie-spin{0.00%{transform:scaleX(1.000)}2.08%{transform:scaleX(0.994)}4.17%{transform:scaleX(0.976)}6.25%{transform:scaleX(0.947)}8.33%{transform:scaleX(0.908)}10.42%{transform:scaleX(0.861)}12.50%{transform:scaleX(0.806)}14.58%{transform:scaleX(0.748)}16.67%{transform:scaleX(0.689)}18.75%{transform:scaleX(0.634)}20.83%{transform:scaleX(0.589)}22.92%{transform:scaleX(0.559)}25.00%{transform:scaleX(0.548)}27.08%{transform:scaleX(0.559)}29.17%{transform:scaleX(0.589)}31.25%{transform:scaleX(0.634)}33.33%{transform:scaleX(0.689)}35.42%{transform:scaleX(0.748)}37.50%{transform:scaleX(0.806)}39.58%{transform:scaleX(0.861)}41.67%{transform:scaleX(0.908)}43.75%{transform:scaleX(0.947)}45.83%{transform:scaleX(0.976)}47.92%{transform:scaleX(0.994)}50.00%{transform:scaleX(1.000)}52.08%{transform:scaleX(0.994)}54.17%{transform:scaleX(0.976)}56.25%{transform:scaleX(0.947)}58.33%{transform:scaleX(0.908)}60.42%{transform:scaleX(0.861)}62.50%{transform:scaleX(0.806)}64.58%{transform:scaleX(0.748)}66.67%{transform:scaleX(0.689)}68.75%{transform:scaleX(0.634)}70.83%{transform:scaleX(0.589)}72.92%{transform:scaleX(0.559)}75.00%{transform:scaleX(0.548)}77.08%{transform:scaleX(0.559)}79.17%{transform:scaleX(0.589)}81.25%{transform:scaleX(0.634)}83.33%{transform:scaleX(0.689)}85.42%{transform:scaleX(0.748)}87.50%{transform:scaleX(0.806)}89.58%{transform:scaleX(0.861)}91.67%{transform:scaleX(0.908)}93.75%{transform:scaleX(0.947)}95.83%{transform:scaleX(0.976)}97.92%{transform:scaleX(0.994)}100.00%{transform:scaleX(1.000)}}@keyframes oppie-side{0.00%{opacity:0.000}2.08%{opacity:0.055}4.17%{opacity:0.109}6.25%{opacity:0.161}8.33%{opacity:0.210}10.42%{opacity:0.256}12.50%{opacity:0.297}14.58%{opacity:0.333}16.67%{opacity:0.364}18.75%{opacity:0.388}20.83%{opacity:0.406}22.92%{opacity:0.416}25.00%{opacity:0.420}27.08%{opacity:0.416}29.17%{opacity:0.406}31.25%{opacity:0.388}33.33%{opacity:0.364}35.42%{opacity:0.333}37.50%{opacity:0.297}39.58%{opacity:0.256}41.67%{opacity:0.210}43.75%{opacity:0.161}45.83%{opacity:0.109}47.92%{opacity:0.055}50.00%{opacity:0.000}52.08%{opacity:0.055}54.17%{opacity:0.109}56.25%{opacity:0.161}58.33%{opacity:0.210}60.42%{opacity:0.256}62.50%{opacity:0.297}64.58%{opacity:0.333}66.67%{opacity:0.364}68.75%{opacity:0.388}70.83%{opacity:0.406}72.92%{opacity:0.416}75.00%{opacity:0.420}77.08%{opacity:0.416}79.17%{opacity:0.406}81.25%{opacity:0.388}83.33%{opacity:0.364}85.42%{opacity:0.333}87.50%{opacity:0.297}89.58%{opacity:0.256}91.67%{opacity:0.210}93.75%{opacity:0.161}95.83%{opacity:0.109}97.92%{opacity:0.055}100.00%{opacity:0.000}}@keyframes oppie-glint{0.00%{transform:translateX(0.00px);opacity:1.000}2.08%{transform:translateX(-0.42px);opacity:0.994}4.17%{transform:translateX(-0.83px);opacity:0.978}6.25%{transform:translateX(-1.22px);opacity:0.951}8.33%{transform:translateX(-1.60px);opacity:0.913}10.42%{transform:translateX(-1.95px);opacity:0.866}12.50%{transform:translateX(-2.26px);opacity:0.810}14.58%{transform:translateX(-2.54px);opacity:0.746}16.67%{transform:translateX(-2.77px);opacity:0.675}18.75%{transform:translateX(-2.96px);opacity:0.599}20.83%{transform:translateX(-3.09px);opacity:0.518}22.92%{transform:translateX(-3.17px);opacity:0.435}25.00%{transform:translateX(-3.20px);opacity:0.350}27.08%{transform:translateX(-3.17px);opacity:0.435}29.17%{transform:translateX(-3.09px);opacity:0.518}31.25%{transform:translateX(-2.96px);opacity:0.599}33.33%{transform:translateX(-2.77px);opacity:0.675}35.42%{transform:translateX(-2.54px);opacity:0.746}37.50%{transform:translateX(-2.26px);opacity:0.810}39.58%{transform:translateX(-1.95px);opacity:0.866}41.67%{transform:translateX(-1.60px);opacity:0.913}43.75%{transform:translateX(-1.22px);opacity:0.951}45.83%{transform:translateX(-0.83px);opacity:0.978}47.92%{transform:translateX(-0.42px);opacity:0.994}50.00%{transform:translateX(-0.00px);opacity:1.000}52.08%{transform:translateX(0.42px);opacity:0.994}54.17%{transform:translateX(0.83px);opacity:0.978}56.25%{transform:translateX(1.22px);opacity:0.951}58.33%{transform:translateX(1.60px);opacity:0.913}60.42%{transform:translateX(1.95px);opacity:0.866}62.50%{transform:translateX(2.26px);opacity:0.810}64.58%{transform:translateX(2.54px);opacity:0.746}66.67%{transform:translateX(2.77px);opacity:0.675}68.75%{transform:translateX(2.96px);opacity:0.599}70.83%{transform:translateX(3.09px);opacity:0.518}72.92%{transform:translateX(3.17px);opacity:0.435}75.00%{transform:translateX(3.20px);opacity:0.350}77.08%{transform:translateX(3.17px);opacity:0.435}79.17%{transform:translateX(3.09px);opacity:0.518}81.25%{transform:translateX(2.96px);opacity:0.599}83.33%{transform:translateX(2.77px);opacity:0.675}85.42%{transform:translateX(2.54px);opacity:0.746}87.50%{transform:translateX(2.26px);opacity:0.810}89.58%{transform:translateX(1.95px);opacity:0.866}91.67%{transform:translateX(1.60px);opacity:0.913}93.75%{transform:translateX(1.22px);opacity:0.951}95.83%{transform:translateX(0.83px);opacity:0.978}97.92%{transform:translateX(0.42px);opacity:0.994}100.00%{transform:translateX(0.00px);opacity:1.000}}
    @media (prefers-reduced-motion:reduce){.oppie-bar,.oppie-shade,.oppie-glint{animation:none!important}.oppie-shade{opacity:0}}
  </style>
  <defs>
    <linearGradient id="oppie-f0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e1d17"/><stop offset=".18" stop-color="#c8342a"/><stop offset=".42" stop-color="#ff4b3d"/><stop offset=".7" stop-color="#c8342a"/><stop offset="1" stop-color="#5a1713"/></linearGradient><linearGradient id="oppie-v0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#402765"/><stop offset=".18" stop-color="#7446b8"/><stop offset=".42" stop-color="#a866ff"/><stop offset=".7" stop-color="#7446b8"/><stop offset="1" stop-color="#342053"/></linearGradient><linearGradient id="oppie-v1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4c0e"/><stop offset=".18" stop-color="#c88a1a"/><stop offset=".42" stop-color="#ffc826"/><stop offset=".7" stop-color="#c88a1a"/><stop offset="1" stop-color="#5a3e0c"/></linearGradient><linearGradient id="oppie-v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#174c30"/><stop offset=".18" stop-color="#2a8a58"/><stop offset=".42" stop-color="#3dc880"/><stop offset=".7" stop-color="#2a8a58"/><stop offset="1" stop-color="#133e28"/></linearGradient><linearGradient id="oppie-v3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f4" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#104d55"/><stop offset=".18" stop-color="#1d8c9a"/><stop offset=".42" stop-color="#2acbdf"/><stop offset=".7" stop-color="#1d8c9a"/><stop offset="1" stop-color="#0d3f45"/></linearGradient><linearGradient id="oppie-v4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
  </defs>
  <g class="oppie-bar" style="animation-delay:0.00s"><!-- Build -->
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-f0)"/>
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-v0)"/>
    <rect class="oppie-shade" style="animation-delay:0.00s" x="10" y="32" width="12" height="36" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.00s"><rect x="14" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="10.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.16s"><!-- Studios -->
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-f1)"/>
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-v1)"/>
    <rect class="oppie-shade" style="animation-delay:0.16s" x="27" y="20" width="12" height="60" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.16s"><rect x="31" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="27.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.32s"><!-- Playbook -->
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-f2)"/>
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-v2)"/>
    <rect class="oppie-shade" style="animation-delay:0.32s" x="44" y="10" width="12" height="80" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.32s"><rect x="48" y="13" width="2.6" height="74" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="44.5" y="10.5" width="11" height="79" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.48s"><!-- University -->
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-f3)"/>
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-v3)"/>
    <rect class="oppie-shade" style="animation-delay:0.48s" x="61" y="20" width="12" height="60" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.48s"><rect x="65" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="61.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar" style="animation-delay:0.64s"><!-- Compass -->
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-f4)"/>
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-v4)"/>
    <rect class="oppie-shade" style="animation-delay:0.64s" x="78" y="32" width="12" height="36" rx="6" fill="#000"/>
    <g class="oppie-glint" style="animation-delay:0.64s"><rect x="82" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="78.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
</svg>
```

### oppie-rest-light.svg
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Oppie">
  <defs>
    <linearGradient id="oppie-f0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c130f"/><stop offset=".18" stop-color="#a8231c"/><stop offset=".42" stop-color="#f43329"/><stop offset=".7" stop-color="#a8231c"/><stop offset="1" stop-color="#4c100d"/></linearGradient><linearGradient id="oppie-v0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#291348"/><stop offset=".18" stop-color="#4b2382"/><stop offset=".42" stop-color="#6d33bd"/><stop offset=".7" stop-color="#4b2382"/><stop offset="1" stop-color="#22103b"/></linearGradient><linearGradient id="oppie-v1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5c3d07"/><stop offset=".18" stop-color="#a86f0c"/><stop offset=".42" stop-color="#f4a111"/><stop offset=".7" stop-color="#a86f0c"/><stop offset="1" stop-color="#4c3205"/></linearGradient><linearGradient id="oppie-v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#103b25"/><stop offset=".18" stop-color="#1d6b43"/><stop offset=".42" stop-color="#2a9b61"/><stop offset=".7" stop-color="#1d6b43"/><stop offset="1" stop-color="#0d301e"/></linearGradient><linearGradient id="oppie-v3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f4" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a3b42"/><stop offset=".18" stop-color="#136c78"/><stop offset=".42" stop-color="#1c9dae"/><stop offset=".7" stop-color="#136c78"/><stop offset="1" stop-color="#093136"/></linearGradient><linearGradient id="oppie-v4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#23262b" stop-opacity="0"/><stop offset="1" stop-color="#23262b" stop-opacity=".85"/></linearGradient>
  </defs>
  <g class="oppie-bar"><!-- Build -->
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-f0)"/>
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-v0)"/>
    <rect class="oppie-shade" x="10" y="32" width="12" height="36" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="14" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="10.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar"><!-- Studios -->
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-f1)"/>
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-v1)"/>
    <rect class="oppie-shade" x="27" y="20" width="12" height="60" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="31" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="27.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar"><!-- Playbook -->
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-f2)"/>
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-v2)"/>
    <rect class="oppie-shade" x="44" y="10" width="12" height="80" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="48" y="13" width="2.6" height="74" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="44.5" y="10.5" width="11" height="79" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar"><!-- University -->
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-f3)"/>
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-v3)"/>
    <rect class="oppie-shade" x="61" y="20" width="12" height="60" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="65" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="61.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
  <g class="oppie-bar"><!-- Compass -->
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-f4)"/>
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-v4)"/>
    <rect class="oppie-shade" x="78" y="32" width="12" height="36" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="82" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="78.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#000" stroke-opacity="0.2"/>
  </g>
</svg>
```

### oppie-rest-dark.svg
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" role="img" aria-label="Oppie">
  <defs>
    <linearGradient id="oppie-f0" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e1d17"/><stop offset=".18" stop-color="#c8342a"/><stop offset=".42" stop-color="#ff4b3d"/><stop offset=".7" stop-color="#c8342a"/><stop offset="1" stop-color="#5a1713"/></linearGradient><linearGradient id="oppie-v0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#402765"/><stop offset=".18" stop-color="#7446b8"/><stop offset=".42" stop-color="#a866ff"/><stop offset=".7" stop-color="#7446b8"/><stop offset="1" stop-color="#342053"/></linearGradient><linearGradient id="oppie-v1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4c0e"/><stop offset=".18" stop-color="#c88a1a"/><stop offset=".42" stop-color="#ffc826"/><stop offset=".7" stop-color="#c88a1a"/><stop offset="1" stop-color="#5a3e0c"/></linearGradient><linearGradient id="oppie-v2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#174c30"/><stop offset=".18" stop-color="#2a8a58"/><stop offset=".42" stop-color="#3dc880"/><stop offset=".7" stop-color="#2a8a58"/><stop offset="1" stop-color="#133e28"/></linearGradient><linearGradient id="oppie-v3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
    <linearGradient id="oppie-f4" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#104d55"/><stop offset=".18" stop-color="#1d8c9a"/><stop offset=".42" stop-color="#2acbdf"/><stop offset=".7" stop-color="#1d8c9a"/><stop offset="1" stop-color="#0d3f45"/></linearGradient><linearGradient id="oppie-v4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".7" stop-color="#3a3d45" stop-opacity="0"/><stop offset="1" stop-color="#3a3d45" stop-opacity=".85"/></linearGradient>
  </defs>
  <g class="oppie-bar"><!-- Build -->
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-f0)"/>
    <rect x="10" y="32" width="12" height="36" rx="6" fill="url(#oppie-v0)"/>
    <rect class="oppie-shade" x="10" y="32" width="12" height="36" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="14" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="10.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar"><!-- Studios -->
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-f1)"/>
    <rect x="27" y="20" width="12" height="60" rx="6" fill="url(#oppie-v1)"/>
    <rect class="oppie-shade" x="27" y="20" width="12" height="60" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="31" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="27.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar"><!-- Playbook -->
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-f2)"/>
    <rect x="44" y="10" width="12" height="80" rx="6" fill="url(#oppie-v2)"/>
    <rect class="oppie-shade" x="44" y="10" width="12" height="80" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="48" y="13" width="2.6" height="74" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="44.5" y="10.5" width="11" height="79" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar"><!-- University -->
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-f3)"/>
    <rect x="61" y="20" width="12" height="60" rx="6" fill="url(#oppie-v3)"/>
    <rect class="oppie-shade" x="61" y="20" width="12" height="60" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="65" y="23" width="2.6" height="54" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="61.5" y="20.5" width="11" height="59" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
  <g class="oppie-bar"><!-- Compass -->
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-f4)"/>
    <rect x="78" y="32" width="12" height="36" rx="6" fill="url(#oppie-v4)"/>
    <rect class="oppie-shade" x="78" y="32" width="12" height="36" rx="6" fill="#000" opacity="0"/>
    <g class="oppie-glint"><rect x="82" y="35" width="2.6" height="30" rx="1.3" fill="#fff" fill-opacity=".55"/></g>
    <rect x="78.5" y="32.5" width="11" height="35" rx="5.5" fill="none" stroke="#fff" stroke-opacity="0.22"/>
  </g>
</svg>
```
