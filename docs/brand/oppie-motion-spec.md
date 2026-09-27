# Oppie motion spec

Instructions for implementing the Oppie mark's behaviour across the Opero site and product. The existing `Oppie.jsx` / `oppie-mark.js` are reference implementations; adapt them to follow this spec.

## The idea
Oppie is a pie made of the five Opero modules. The **relay** is Oppie passing attention from one module to the next, one slice at a time, clockwise. The speed of the relay shows how engaged Oppie is: slow when resting, fast when thinking. The mark itself never changes shape or colour between states; only the relay speed changes.

## Geometry
- Five equal slices (72° each), starting at 12 o'clock, clockwise: **Build, Studios, Playbook, University, Compass**.
- Pie radius 80 units, centre 100,100. Each slice is offset 3 units outward along its bisector to create gaps.
- viewBox `-10 -10 220 220` (leaves room for the push and shadow). Never crop tighter.

## Colour
| Slice | Base | Highlight | Shadow |
|---|---|---|---|
| Build | #d43a2f | #ff5444 | #83241d |
| Studios | #6b3fa0 | #9b5be8 | #422763 |
| Playbook | #c58b1a | #ffc926 | #7a5610 |
| University | #2f8f5b | #44cf84 | #1d5938 |
| Compass | #1e8e9a | #2bcedf | #13585f |

Each slice is filled with a radial gradient (highlight → base → shadow) centred up and to the left, plus a white specular overlay, so the pie reads as one polished object. Light theme: soft drop shadow (blur 3, 18% black). Dark theme: deeper shadow (blur 5, 50% black).

## The relay
- For each slice in order, the slice pushes outward 9 units along its bisector and brightens (~135%), then settles back.
- The push takes the first 20% of the slice's turn to peak and returns by 60%. Slice *n* starts at `n × (cycle ÷ 5)`, so there is always one slice leading and the motion reads as travelling clockwise.
- Easing: ease-in-out.

## States
| State | When | Cycle (one full lap) |
|---|---|---|
| **Calm** | Oppie is present but not engaged: idle on a page, chat closed or waiting for input, nothing requested. | 5.6s |
| **Listening** | The user is interacting with Oppie: chat open and focused, typing, speaking, or hovering the Oppie entry point. | 3.3s |
| **Working** | Oppie is carrying out a request that has visible progress: running a task, fetching, streaming a reply. | 2.0s |
| **Thinking** | Oppie has received a request and is forming an answer, before any output appears. | 1.25s |

Typical sequence: Calm → (user opens chat) Listening → (user sends) Thinking → (first output appears) Working → (reply complete) Listening → (after ~10s with no input, or chat closed) Calm.

If the product only needs two states, use **Calm** for not engaged and **Thinking** for everything else.

## Transitions
- Never restart the animation when switching state; that makes slices jump. Change the playback rate of the running animation (e.g. Web Animations API `animation.updatePlaybackRate()` or by animating a CSS variable used as the duration) so the relay speeds up or slows down smoothly from wherever it is.
- Ease between speeds over ~400ms when speeding up and ~1200ms when slowing down; winding down should feel slower than waking up.
- The mark keeps the same size and position in every state. No layout shift.

## Sizes and contexts
- **≥ 40px** (chat header, empty states, marketing): full relay as specified.
- **24 to 39px** (nav, inline badges, message avatars): relay runs, but reduce the push to 6 units so it stays within bounds.
- **< 24px** (favicons, tab icons, dense lists): static mark only, no animation.
- Email, print, OG/social images: static SVG or PNG.
- When several Oppie marks are visible at once (e.g. a message list), only the one for the active conversation animates; the others stay static in Calm.

## Accessibility
- Under `prefers-reduced-motion: reduce`, show the static mark in every state. Communicate Thinking/Working with text instead (e.g. "Oppie is thinking…").
- Give the mark `role="img"` and an `aria-label` that reflects the state ("Oppie", "Oppie is thinking"). Announce state changes through an `aria-live="polite"` region, not the SVG itself.
- Pause the animation when the tab is hidden (`document.visibilityState`) to save battery.

## Don'ts
- Don't change slice order, colours, or count.
- Don't spin or rotate the whole pie; the relay is the only motion.
- Don't use the relay as a generic loading spinner for non-Oppie content.
