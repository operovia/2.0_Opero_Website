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

## Editing the site

Sign in at `/admin` and open Content to change the words on any page. While you are signed in, an Admin button in the bottom left corner of every page of the site takes you back to the admin; visitors never see it. In a headline, press Enter where a new line should start, and put words between asterisks, like `*this*`, to set them in italics.

## Who can see the site

The site is private until you say otherwise: everyone meets the front door (`/welcome`) and enters the email address their invitation went to. Only addresses on the guest list open it, and you see everything while signed in to the admin. That sign-in lives in the browser: a new browser, a phone, or a different address for the site (the Replit development address and the published one are separate) meets the door until you sign in at `/admin` there once, and Replit's embedded preview pane can never keep it. The door itself greets a signed-in admin, like a guest whose browser holds the key, and lets them straight in. Turn the private site off under Settings, Front door, to make the site public; the door then only opens the Investor Hub.

Each guest has a role, chosen when you add them and changeable from the list:

- A **visitor** sees the site, with the Founder tab in the header.
- An **investor** sees the site and the Investor Hub, with the Investor Hub tab in its place.

To invite someone, open Guests in the admin, add their email address (with the role, and a note to yourself if you like), and send them the door link shown there from your own email; the page has a Copy button and a short note to paste. The site sends no invitation. The door is linked from nowhere and asks for an email address only. When a guest gives an address on the list, the site opens for them and lands them on the home page; their browser keeps the key until you remove them, and you get an email the first time each guest enters. Ask them to open the link in Safari or Chrome rather than inside a mail app's own browser, which may forget the key. Removing an address on the Guests page ends its access on every browser at once, and changing a role takes effect on their next page.

Survey links keep working for the people they were sent to whether or not the site is private. Search engines are told to stay away while it is private.

The Founder page (`/founder`) shows the founder's introduction (headline, photo, name, role, and the LinkedIn icon) and the story in two columns. Its eyebrow and search description are edited in Content, Founder page; everything else on it comes from the Investor Hub's Introduction and The story sections, so an edit there changes both pages.

The Investor Hub (`/investors`) tells the whole story for investors and ends with a short contact form; messages arrive in Inquiries. Only investors on the guest list and signed-in admins see it; everyone else gets "page not found" there. Search engines never index it. Edit its copy in Content, Investor Hub. The LinkedIn icon beside your name links to the profile set there, under Introduction; leave that empty to hide the icon.

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

## If the admin says the database is not up to date

Each time the site starts, it applies any database updates that arrived with new code, then checks that each one really took: an update its record has no trace of, or whose tables are not all there, is applied again, skipping what is already in place. If that fails, a red notice at the top of every admin page says why, and the pages that need the missing update (Guests, for one) cannot load until it runs. Deal with the cause the notice names, then press Update the database now; it applies only what is missing. The Site health card on the Dashboard shows the same status and the last errors the server hit, so you can paste them to whoever is helping you.

## The module screenshots

Each module card on the home page has a magnifying glass (Look inside) that opens a screenshot of the module in a lightbox. The pictures are drawn, not captured: `scripts/module-shots/<module>.html` is the screen, with fictional data, and `node scripts/module-shots/render.mjs` renders them to `public/modules/<module>.png` (set `CHROME_PATH` to a Chromium if none is installed for Playwright). Edit the caption under each picture in Content, Home, Platform.

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
