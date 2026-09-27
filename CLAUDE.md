# CLAUDE.md

Guidance for every Claude Code session in this repo. The full product brief lives in `docs/brief.md`; read it before any substantial change.

Next.js notes (managed by Next.js itself): @AGENTS.md

## How to work

- Work in small, verified units. Each unit is one coherent change that typechecks and builds. Commit after every unit with a clear message. Never leave the repo in a state that does not build.
- Before committing, run `npm run verify`: typecheck, lint, copy rules, unit tests, production build, and a check that every Tailwind class used actually exists (Tailwind is limited to the tokens, so a missing token fails silently otherwise).
- Collect questions instead of scattering them through prose. Present each with the choices and a recommended answer. Proceed on the recommendation for anything low-risk while waiting. Stop and ask before any decision that is hard to reverse.
- Do not invent copy, numbers, names, or claims about the product beyond what `docs/brief.md` gives. Where placeholder text is needed, make it obviously placeholder and list it in `PLACEHOLDERS.md`.
- Report in plain language: what changed and what the owner can now do, not how the internals are wired.
- Report at the end of each build phase: what works, what is needed from the owner, and the current placeholder list.
- When brand assets or mockups arrive, applying them takes priority over the current phase.

## Facts and copy rules

- **Opero** is the product. **Operovia, Inc.** is the company (Delaware corporation, Ann Arbor, Michigan). Use "Operovia" only for company contexts: footer, legal, contact.
- Opero is an operating platform for real estate companies, built around a core CRM. The five modules are **Studios, Playbook, University, Compass, Build**. Always use the bare module names, never "Opero Studios".
- The AI assistant is **Oppie**. Always that spelling.
- Opero was built inside **Oxford Companies** in Ann Arbor, which is named publicly.
- Never claim to replace or beat Yardi or any accounting system; say nothing about accounting.
- Never name competitor products. Use categories: a board tool, a wiki, a training platform, an EOS tool, a listing marketing tool.
- No pricing and no dates anywhere on the public site (that includes copyright years and "last updated" lines).
- **No em dashes** anywhere a visitor, recipient, or admin reads: site copy, admin UI, emails, placeholders, seed data, docs. Use commas, periods, or colons. `npm run check:copy` enforces this.
- The phrase "design partner" comes from the `partnerProgramLabel` site setting. In content use the tokens `{partner}`, `{partners}`, `{Partner}`, `{Partners}` so a label change flows everywhere.

## Design system rules

- Every color, font, radius, shadow, spacing, and motion value lives in `src/theme/tokens.ts`. Components reference tokens only (Tailwind utilities generated from tokens, or CSS variables). No hex values, font stacks, or magic shadows in components.
- Brand assets live in `public/brand/` and are mapped in `public/brand/manifest.json`. Components render marks with `<BrandMark name="...">` (via `src/brand`), never by file path, so swapping a file never touches a component. Never edit the supplied artwork files. Do not draw logos; artwork still pending (the Oppie orb) uses a clearly marked placeholder.
- Brand colors come from the supplied artwork: the wordmark's metal gradient (`text-metal`), the five jewels (`jewel-*` utilities), and the favicon ground for the dark canvas. The jewels read left to right as Build, Studios, Playbook, University, Compass; that is also the brand order for showing the modules.
- In hand-written CSS, reference the per-theme `--o-*` variables, not Tailwind's `--color-*` variables, so nested `data-theme` regions resolve correctly.
- Form actions return the submitted `values` and forms render `defaultValue` from `state.values ?? saved`, because React resets uncontrolled fields after every form action.
- Light and dark themes are both wired. The public site defaults to dark.
- Headline type must feel open and generous: loosen line height and tracking, never condense. Body type must be comfortable at length.
- Motion uses transform and opacity only, holds 60fps, and fully respects `prefers-reduced-motion`. Anything that auto-cycles needs a pause control.

## Technical decisions (settled)

- Next.js App Router, TypeScript, Tailwind CSS v4, Motion (formerly Framer Motion).
- Postgres via Drizzle ORM (`pg` driver); migrations in `drizzle/`, generated with `npm run db:generate`. Never edit an applied migration; add a new one.
- The server applies migrations and seeds (admin account, settings, content) on startup, under an advisory lock. Nothing touches the database at build time.
- Email through Resend from a dedicated operovia.com subdomain. Without `RESEND_API_KEY`, emails are printed to the server log.
- Uploads go through one storage adapter: local `uploads/` folder in development, S3-compatible bucket in production.
- Standard Node service (`npm run build`, `npm run start`). Nothing platform-specific.
- Security: every admin page, action, and route calls `requireAdmin()`; mutations go through Server Actions (built-in origin check) or route handlers guarded by `assertSameOrigin()`; parameterized queries only (Drizzle); secrets only in environment variables (documented in `.env.example`); honeypot plus rate limiting on public forms; tokens from at least 32 random bytes; audit log for publishes and logins.
- Public pages render on the server from an in-memory content cache that is checked against a content version number, so a publish shows up immediately on every server instance.
