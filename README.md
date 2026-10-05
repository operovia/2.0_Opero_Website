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

The site is private until you say otherwise: everyone meets the front door (`/welcome`) and enters the email address their invitation went to. Only addresses on the guest list open it, and you see everything while signed in to the admin. That sign-in lives in the browser: a new browser, a phone, or a different address for the site (the Replit development address and the published one are separate) meets the door until you sign in at `/admin` there once, and Replit's embedded preview pane can never keep it. The door itself greets a signed-in admin, like a guest whose browser holds the key, and lets them straight in. Turn the private site off under Settings, Front door, to make the site public; the door then only opens the Data Room. The privacy notice (`/privacy`) is the one page everyone may read without a key, and the door links to it at its foot; a shared link to the site, which lands on the door while the site is private, previews with the site's own title, description and picture.

A link can bring someone to the door with their address already filled in: `https://operovia.com/welcome?email=` followed by the address, its `@` written `%40`. Whoever follows it, the person you wrote to or anyone they forward the email to, only has to press enter, and comes in with that guest's role, so add the address to the guest list first. For an email, `scripts/email-art` has a graphic to put the link on (see the README there); the site serves it at `/email/opero-invite.png`.

Each guest also has a personal link, under their address on the Guests page with Copy link and Preview beside it. It fills in their address like the link above, and more: give them a welcome name there (Fifth Wall, say) and the door their link opens says "Welcome, *Fifth Wall*." and rolls out a red carpet along the line to the enter button, and once they are in, the home page greets them by name above the headline, every visit. Everyone else sees the site as ever. The door still never says who is on the list: the link carries a secret made for that guest, which nobody can guess, and any other link gets the plain door. Preview opens their link as they will see it; while you are signed in, entering there plays the door and lands you on the home page with their greeting, without giving your browser their key or counting as their visit. A guest added before personal links existed has a Make a personal link button instead. The wording is in Content: Front door (Personal link: title and introduction) and Home page, Hero (Guest greeting); `{name}` stands for the welcome name. `scripts/email-art` can also make a card that greets one guest by name (`--name`).

Each guest has a role, chosen when you add them and changeable from the list:

- A **visitor** sees the site, with the Founder tab in the header.
- An **investor** sees the site and the Data Room, with the Data Room tab in its place.

To invite someone, open Guests in the admin, add their email address (with the role, and a note to yourself if you like), and send them the door link shown there from your own email; the page has a Copy button and a short note to paste. The site sends no invitation. The door is linked from nowhere and asks for an email address only. When a guest gives an address on the list, the site opens for them and lands them on the home page; their browser keeps the key until you remove them, and you get an email the first time each guest enters. Ask them to open the link in Safari or Chrome rather than inside a mail app's own browser, which may forget the key. Removing an address on the Guests page ends its access on every browser at once, and changing a role takes effect on their next page.

To let a whole company in, add its email domain under Companies on the Guests page (example.com, or paste anyone's address there), with the role everyone there gets and, if you like, a welcome name such as the firm's name. Then send the door link to someone there, with the note the card offers, and tell them they may forward it to anyone at the company. Anyone with an address at that domain who enters it at the door is not let in on the spot: the site emails them a link, which works once, within a day, and fills in their address at the door; entering there lets them in. So knowing someone's address there is never enough. Each person who comes in this way joins the list, marked as having come in through the company, and you get the usual email the first time. On another browser later they get a new link the same way. Changing the company's role or welcome name changes it for all of them, and removing the company ends access for everyone who came in through it and stops the links already sent. Someone you also add one by one keeps their own role and comes in by typing their address, as any guest on the list does. Email services anyone can sign up for, such as gmail.com, cannot be added as a company. These emails need `RESEND_API_KEY` and `EMAIL_FROM`, and a domain Resend has verified (see Email below); until then the door says something went wrong on its side rather than telling anyone to check an inbox nothing will reach. The door's wording for this is in Content: Front door (Emailed link, Link sent, and Used link). The door does tell anyone who tries an address at a listed company that a link went out, so it shows which companies are on the list, though never who at them.

Survey links keep working for the people they were sent to whether or not the site is private. Search engines are told to stay away while it is private.

The Founder page (`/founder`) shows the founder's introduction (headline, photo, name, role, and the LinkedIn icon) and the story in two columns. Its eyebrow and search description are edited in Content, Founder page; everything else on it comes from the Data Room's Introduction and The story sections (Content, Data Room), so an edit there changes both pages. Under the headline on both pages, Read My Story opens the founder's letter, dark, signed by hand, with the name, role and the Operovia logo beneath; its words are edited in Content, Data Room, The founder's letter, and a link to `#founder-letter` on either page opens it. Signed-in admins see the Data Room instead, so to see the site as a visitor does, press View as a visitor beside the Admin pill at the foot of any page: the header then shows the Founder page and the Data Room is hidden, until you press Leave visitor view or close the browser.

The Data Room (`/data-room`) is the private area for investors, in place of the former Investor Hub; the old `/investors` address still forwards there. Its tabs are Founder (the founder's introduction and story), The Raise (the round's terms, then what runs today against what the raise builds, area by area), Cap Table (the capitalization table with the investment model under it) and Documents. There is no contact form (investors answer your email), and the header shows no Book a demo button in the room. Its copy is edited in Content, Data Room, where the LinkedIn icon beside your name is set too (under Introduction; leave it empty to hide the icon). Its Documents tab (`/data-room/files`) holds the folders and documents you share, numbered in the order you arrange them: 1, 2, 3 at the top, 2.1 inside the second folder, and so on. Only investors on the guest list and signed-in admins see any of it; everyone else gets "page not found" there, for every document address too, and search engines never index it.

You arrange the room under Data Room in the admin: add folders, and folders inside them; drop documents into the folder on screen (PDF, Word, Excel, PowerPoint, CSV, text, images, or ZIP, up to 25 MB each); rename, move up or down, and delete. PDFs and images open in the browser and everything can be downloaded. Each time a guest opens or downloads a document it is recorded: the document's row shows how often and by whom, the Activity list at the foot of the page shows every visit newest first, and the Guests page counts the documents each guest opened. Your own visits are not recorded. The words around the documents are edited in Content, Data Room: Documents.

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
3. Add the secrets `RESEND_API_KEY` and `EMAIL_FROM` (for example `Opero <notifications@mail.operovia.com>`), and `EMAIL_REPLY_TO` with the inbox you read, so replies reach you.
4. Republish, so the published site picks them up.

The Email row of the Site health card on the Dashboard says whether email is set up, the address it sends as, when an email last went out, and the last few that did not, with the reason Resend gave (a domain it has not verified yet, for example).

## Publishing

In Replit, open Publishing. The build and run commands are already configured (`npm run build`, then `npm run start`). The published app takes its secrets from the workspace's one Secrets tab; a value meant only for the published app goes under Publishing, Adjust settings, Production app secrets. It needs:

- `DATABASE_URL`: the production database
- `SITE_URL`: the public address of the site, `https://operovia.com`. It can go in the Secrets tab: the published app uses it, while the development site always links to its own address. Without it, the published app's links, personal links on the Guests page included, use its Replit address (`operowebsite.replit.app`).
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

Under the platform diagram on the home page, the tour shows each module's screen large: one tab per module, in the diagram's order, with the caption under the picture, and the See it cue on each module card selects that module's tab. On phones the module cards and the tour's screens each stand in a row that scrolls sideways. Pressing a screenshot opens it in a lightbox. In the lightbox, Zoom in (the magnifying glass) or a click on the picture shows it closer: move the mouse across it, drag it with a finger, or use the arrow keys to look around, and click again, press Zoom out or Escape to step back. The pictures are drawn, not captured: `scripts/module-shots/<module>.html` is the screen, with fictional data, and `node scripts/module-shots/render.mjs` renders them to `src/assets/modules/<module>.png` (set `CHROME_PATH` to a Chromium if none is installed for Playwright). A re-rendered picture gets a new web address of its own, so browsers never keep showing the old one. The site serves each picture from a set of WebP files made beside the PNG (`scripts/shot-sets.mjs`, which the render scripts run), at the size the screen needs and straight from the file rather than through the image optimizer, so a picture appears as soon as it comes into view; a tab's picture is fetched the moment the tab is hovered or focused. Edit the caption under each picture, the See it and Look inside labels, and, per module, a link to a screen recording in Content, Home, Platform: a recording plays in the screenshot's place, muted and looping, with the screenshot as its first frame and a button to pause it, and never by itself for a visitor who prefers reduced motion. A Core tab, first in the tour, waits on a screenshot of the core CRM and stays hidden until one exists (`src/content/module-shots.ts` says where it goes); its caption is the Core screenshot caption in the same section.

## The OperoGo section

The home page's OperoGo section describes the mobile app and shows four phone screens. Like the module screenshots, the screens are drawn, not captured: `scripts/go-shots/<screen>.html` is each screen, with fictional data, and `node scripts/go-shots/render.mjs` renders them to `src/assets/go/<screen>.png` (set `CHROME_PATH` to a Chromium if none is installed for Playwright). On the page the screens stand in iPhones (on phones, in a row that scrolls sideways, as the six features under them do), and pressing a phone opens its screen large in the same iPhone, where Zoom in (the magnifying glass) or a click or tap on the screen looks closer, as on the module screenshots. Everything the section says, the Coming soon line, the store buttons, the caption under each phone and the Look closer label (each phone's tooltip) are edited in Content, Home page, OperoGo. Until a store link is entered there, the Coming soon line stands where the buttons will; each store's button appears, as a link, once the app's page on that store is entered.

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
