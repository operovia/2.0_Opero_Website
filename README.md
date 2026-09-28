# Opero marketing site

The public website for Opero, with an admin area for editing copy, reading demo requests, partner applications, and investor inquiries, and running surveys.

The product brief is in [docs/brief.md](docs/brief.md). Anything still waiting on a real answer or asset is listed in [PLACEHOLDERS.md](PLACEHOLDERS.md).

## Run it in Replit

1. **Import.** In Replit, create a new app from this GitHub repository.
2. **Add a database.** Open the Database tool and create a PostgreSQL database. Replit adds `DATABASE_URL` to your secrets automatically.
3. **Add your admin account.** In Secrets, add:
   - `ADMIN_EMAIL`: the email you will sign in with
   - `ADMIN_PASSWORD`: at least 12 characters
   - `ADMIN_NAME`: optional
4. **Run.** Press Run. The first start creates the database tables, the default content, and your admin account. The console shows `[opero] Database is ready.` when it is done.
5. **Sign in.** Open the site in its own browser tab (the arrow icon on the preview), then go to `/admin`. The admin cannot sign in inside Replit's small preview pane, because browsers block sign-in cookies inside embedded frames.

Keep that tab open while you or Claude Code work: every saved change appears there within a second or two.

To work with Claude Code in Replit, type `./cc` in the Shell. The first time, it installs Claude Code into the `.claude-tools` folder, which is kept out of GitHub because it holds your sign-in. Each session starts by checking that the site is running (starting it if needed) and giving you this address.

Everything else is optional until you publish.

This project is one Next.js app and must stay that way. `replit.md` tells Replit Agent not to restructure it; if Replit Agent ever proposes migrating or converting the project, decline.

## Investor Hub

The Investor Hub (`/investors`) tells the founder's story for investors and ends with a short contact form; messages arrive in Inquiries. It stays hidden until you switch it on in Settings: until then visitors get "page not found" and its tab is left out of the header, while you see both whenever you are signed in. Edit its copy in Content, Investor Hub.

## Surveys

In the admin, open Surveys.

1. **Write it.** Create a survey and add its questions. Preview shows it exactly as respondents will see it, without saving answers.
2. **Open it and send it.** Press Open survey. On the Recipients tab, paste names and email addresses, check the email wording, and send the invitations. Each person gets their own link, which works once. You can see who opened and who finished, and remind anyone who has not.
3. **Or share one link.** Turn on the open link in the survey's Settings to let anyone with the address respond.
4. **Read the results** as they arrive: a summary per question (including the Net Promoter Score), each individual response, and a CSV download of everything.

Once a survey has responses, only the wording of its questions can change, so every answer keeps its meaning. Deleting the responses (Settings tab) unlocks it again. Surveys are never linked from the site and never appear in search results.

## Email

Until email is set up, every email the site would send (invitations, notifications, surveys) is printed in the Replit console instead, so you can test everything.

To send for real, through [Resend](https://resend.com):

1. In Resend, add a sending domain that is a subdomain of operovia.com, such as `mail.operovia.com`. Using a subdomain keeps it separate from your Microsoft 365 email. Add the DNS records Resend shows you where operovia.com's DNS is managed.
2. Create an API key.
3. Add the secrets `RESEND_API_KEY` and `EMAIL_FROM` (for example `Opero <notifications@mail.operovia.com>`).

## Publishing

In Replit, open Deploy. The build and run commands are already configured (`npm run build`, then `npm run start`). Deployments keep their own secrets, so add these there too:

- `DATABASE_URL`: the production database
- `SITE_URL`: the public address of the site, for example `https://www.example.com`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
- `RESEND_API_KEY`, `EMAIL_FROM`
- For images uploaded in the admin: `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Published apps do not keep uploaded files, so they need an S3-compatible bucket. Cloudflare R2 works well and is inexpensive.

`SITE_URL` matters for search and sharing: the sitemap, robots file, email links, and link previews all use it. Until you choose a share image in Settings, link previews show an image the site draws from the home page headline.

The app is a standard Node.js server, so any host that can run `npm run build` and `npm run start` with Postgres works the same way. Every variable is described in [.env.example](.env.example).

## Locked out?

After six wrong passwords in fifteen minutes, sign-in pauses for that account from that connection; it lifts by itself within fifteen minutes. If you have forgotten the password, run this from the Replit shell with your email and a new password. It also lifts any pause straight away:

```
ADMIN_EMAIL=you@operovia.com ADMIN_PASSWORD='a new long password' npm run admin:reset-password
```

## For developers

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm run start` | Production build and server |
| `npm run verify` | Typecheck, lint, copy rules, unit tests, build, and a check that every Tailwind class used exists. Run before committing. |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations and first-run data (the server also does this on every start) |
| `npm test` | Unit tests |

- Stack: Next.js (App Router), TypeScript, Tailwind CSS, Motion, Postgres with Drizzle ORM, Resend.
- Design tokens (every color, font, size, radius, shadow, and motion value) live in `src/theme/tokens.ts`.
- Brand artwork lives in `public/brand/` and is mapped by name in `public/brand/manifest.json`.
- Working rules for contributors, including AI assistants, are in [CLAUDE.md](CLAUDE.md).
