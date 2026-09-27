# Opero marketing site

The public website for Opero, with an admin area for content, inquiries, and surveys. It is one Next.js (App Router) app in a single npm package at the repository root.

## Instructions for Replit Agent

- Do not migrate, convert, or restructure this project. It is not a pnpm workspace, it has no separate API server or frontend build, and it must stay one Next.js app at the repository root. The owner decided this after an earlier migration had to be undone.
- Read `CLAUDE.md` before changing anything. It holds the working rules; `docs/brief.md` is the product brief.
- Run with `npm run dev` (port 3000). Before committing, `npm run verify` must pass.
- The database schema changes only through migrations: edit `src/db/schema.ts`, run `npm run db:generate`, and commit the new file in `drizzle/`. The server applies migrations on start. Never use `drizzle-kit push`.
