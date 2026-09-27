# Opero Marketing Site: Build Narrative for Claude Code

This is a fresh project, separate from the Opero platform repos. Read this whole document before writing any code. It covers what the site is for, what it must say, how it must be built, and how I want you to work. Where I have made a decision, treat it as settled. Where something depends on assets or answers I still owe you, build around a placeholder and keep going.

## 1. What this site is for

The site is the public front door for Opero, the product, made by Operovia, Inc., the company. It has two audiences and one job for each.

The first audience is anyone trying to understand what Opero does: a real estate executive who heard the name, a prospective investor doing homework, a candidate, a peer. For them the site has to explain the product clearly and fast, and it has to feel like the product itself: modern, confident, AI-native, and obviously built by people who run real estate operations for a living.

The second audience is a small number of firms I want to recruit as design partners. I am looking for two or three more. These are commercial and residential owner-operators and property managers who will take the platform early, work closely with me, and shape where it goes in exchange for preferred founding terms. The site needs a dedicated path for them that ends in an application I receive.

Behind the public site there is an admin area for me. I need to change any copy on the site myself without touching code, and I need to create surveys I can send out to specific people, collect their answers, and read the results.

The design (logos, colors, type, and page mockups) will come from me separately. Do not invent a brand. Build the structure so the supplied design drops in cleanly, and use a neutral placeholder theme until it arrives. Section 6 explains the handoff.

## 2. Facts you must get right

Opero is the product name. Operovia, Inc. is the company, a Delaware corporation based in Ann Arbor, Michigan. Use "Opero" everywhere the site talks about the platform and "Operovia" only where it talks about the company (footer, legal, contact).

Opero is an operating platform for real estate companies. At its core is a CRM built for real estate: every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities. Around that core are five modules: Studios (project boards and workflows), Playbook (SOPs and process documentation), University (training), Compass (running the business on EOS), and Build (where a firm's own people create custom apps with AI, no developers required). On the site the modules appear by their bare names, never as "Opero Studios" or "Opero Build."

Oppie is the AI assistant built into every corner of the platform. The spelling is Oppie, always, in every piece of site copy. Oppie is foundational to the story, not a feature. The line we use is that AI is not bolted on, it is how the platform works, every step of the way.

Opero was built inside Oxford Companies, a commercial and residential real estate firm in Ann Arbor, where it runs the business every day for seventy-plus people. That origin story is our proof and we name Oxford publicly.

Three rules on claims. We do not claim to replace or beat Yardi or any accounting system; the accounting backbone is still being built and the site stays silent on it. We never name competitor products; we refer to them by category (a board tool, a wiki, a training platform, an EOS tool, a listing marketing tool). We show no pricing and no dates anywhere on the public site.

One rule on style. No em dashes anywhere in site copy, admin copy, emails, or placeholder text. Use commas, periods, or colons instead. This is my writing voice and it applies to everything a visitor or recipient reads.

## 3. The public site

### 3.1 Home page

The home page is a single long page in seven sections, in this order: hero, problem, platform, Oppie, proof, design partner, closing call to action. Every headline, body, closing line, button label, and link on the page is editable from the admin. The copy below is the seed content you load into the database on first run. It was approved earlier and is final unless I change it in the admin.

Hero. Headline: "The AI-driven operating platform for real estate companies." Subhead: "One system, built around a core CRM, that replaces the patchwork of disconnected apps your teams run every day, with Oppie, your AI assistant, woven into every step." Primary button: "Book a demo," which opens the demo request flow described in 3.3. Supporting line under the button: "Built by operators inside a working commercial real estate firm. Not a software lab."

The hero also carries the signature element of the whole site: a live Oppie console. It is a scripted, looping demo that types a real portfolio question, pauses as if thinking, then renders an answer card with a tag line, a main answer, a supporting line, and a few chips. It cycles through scenes. The scenes are content, editable in the admin (see 4.3), and the seed scenes are: "What's the ceiling height in Suite 200 at Horizon?" answered with a height and the suite's basic facts; "Any spaces available at the Guardian Building?" answered with a short list of available suites and sizes; and "Which leases expire this quarter?" answered with a count and the top few tenants by square footage. Make the invented answer data plausible for a Midwest office portfolio and keep it clearly illustrative. Label the console with a small "LIVE" badge and the footer lines "ASK IN PLAIN ENGLISH" and "ANSWERS FROM YOUR LIVE DATA."

Problem. Eyebrow: "The status quo." Header: "Your operation runs on too many apps." Body: "A board tool for projects. A wiki for SOPs. A training platform. An EOS tool. A marketing tool for listings. Each with its own login, its own bill, and its own version of the truth, and none of them know your properties." Beneath the body, a row of app chips that visually strike out (project boards, SOP wiki, training platform, EOS tool, listing marketing, and every login that comes with them). Closing line: "Opero replaces the patchwork with one platform built around your portfolio."

Platform. Eyebrow: "The platform." Header: "One platform. Every department." Body: "At the core is a CRM built for real estate: every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities. Around it, five modules run how you work. Studios for project boards and workflows. Playbook for your SOPs. University for training your team. Compass for running on EOS. And Build, where your own people create custom apps with AI, no developers required." Show the five modules as a set of cards or tiles, each carrying its supplied module mark and its accent color from the token file. Closing line: "And woven through all of it, Oppie."

Oppie. Header: "Just ask Oppie." Body: "Oppie is the AI assistant built into every corner of the platform, and it knows your portfolio. The ceiling height in Suite 200 at Horizon? Available spaces at the Guardian Building? Lease expirations coming up this quarter? Ask in plain English and get an answer from your live data, in seconds." Closing line: "AI isn't a feature bolted on. It's how the platform works, every step of the way." This section carries the Oppie orb artwork I will supply, including its animated listening and speaking states.

Proof. Header: "Not a demo. A daily operating system." Body: "Opero was built inside Oxford Companies, a commercial and residential real estate firm in Ann Arbor, where it runs the business every day: leasing, property management, facilities, projects, training, meetings. Seventy-plus people work in it. Six figures of annual software spend, replaced. Every feature exists because an operator needed it." Three stats beneath, each a big value and a small label: "70+" with "People work in it daily"; "Six figures" with "Annual software spend replaced"; "Every day" with "Running a real portfolio, live." The stats are an editable list so I can add or change them.

Design partner. Eyebrow: "A founding seat." Header: "Become a design partner." Body: "We're opening Opero to a small group of firms as design partners: twelve months working directly with the team that built it, shaping the platform around how your firm actually operates, at preferred founding terms. You get the platform early, and a real say in where it goes." Closing line: "Partner seats are limited." Button: "Apply for a seat," linking to the partners page. The phrase "design partner" appears in a site setting called the partner program label, with "design partner" as the default, because I may switch it to "strategic customer" and I want that to be a one-field change that flows everywhere.

Closing call to action. Header: "See it running." Subhead: "A live walkthrough on a real portfolio. No slideware, no canned demo." Button: "Book a demo." Footer: company name, "Ann Arbor, Michigan," and the contact email from site settings (seed it as hello@operovia.com; I will confirm the real address).

### 3.2 Partners page

A second page at /partners expands the design partner offer for the firms I am recruiting. It restates the offer, then explains in plain language what a partner gets (the working platform early, a direct line to the founder, a real voice in the roadmap, preferred founding terms that carry forward) and what I ask in return (real daily use, a standing feedback cadence, candor, and willingness to be a reference when it earns it). It says seats are limited and that I am selecting a small number of firms deliberately. It ends with the application form. All copy on this page is editable in the admin the same way the home page is. Draft the copy from the facts above, keep it to the length of a good one-page letter, and mark it clearly as draft in the admin so I know to review it.

The application form asks for name, firm, role, email, phone, portfolio size (commercial square feet and residential units as two fields), the systems they run today (free text), and why they are interested (free text). On submit it stores the application, emails me, and shows a thank-you state. Do not redirect to a separate page; keep them in place.

### 3.3 Demo requests

"Book a demo" opens a short form in a modal or slide-over: name, firm, email, phone, and an optional message. It stores the request, emails me, and thanks them in place. No calendar integration for now; I will follow up personally.

### 3.4 Other public pages

A privacy page at /privacy with editable content, seeded with a plain, honest privacy notice covering the forms, survey responses, and analytics. Survey response pages at /s/[slug], described in section 5. A simple 404. No blog, no pricing page, no login link on the public site; the admin is reached by its own URL.

## 4. The admin

The admin lives at /admin, behind a login. I am the only user at first but the design should allow more than one admin.

### 4.1 Authentication

Email and password. Passwords hashed with argon2, sessions in a secure, httpOnly, sameSite cookie, login rate-limited, and a password change page. Seed my admin account from environment variables on first run so I never have to insert a row by hand. Provide an "add admin" function that sends an invitation email with a one-time link to set a password. No third-party identity provider for now.

### 4.2 Content management

Every section of every public page is a content block with a defined shape (headline, subhead, body, closing line, eyebrow, button label, button target, and typed lists where the section has one, such as the proof stats). The admin shows the pages, then the sections within each page, and each section opens as a form matched to its shape. Text fields that hold a paragraph get a plain editor with bold, italic, links, and line breaks, and nothing more; I do not want a full rich-text editor that lets me break the design.

Each section has a draft and a published state. I can save a draft, preview the public page with drafts applied, and publish. Keep the last twenty published versions of each section so I can roll back. Publishing regenerates the public page immediately.

### 4.3 Oppie console scenes

A dedicated admin screen for the hero console. Each scene has a question, a thinking delay in milliseconds, an answer tag, an answer main line, an answer supporting line, and up to four chips. Scenes have an order and an on/off switch. The public page loads the active scenes at build time.

### 4.4 Media

A simple media library for images I upload from the admin: upload, list, copy URL, delete. Validate type and size. Use this for any image that appears in content. The brand assets I supply are not uploaded through this; they live in the repo (section 6).

### 4.5 Site settings

A settings screen with: site name, contact email, notification recipients (a list of emails that receive demo requests and partner applications), partner program label, default social share image, meta title and description for the home page, an optional analytics snippet field, and a maintenance-mode toggle that shows a holding page to the public while I keep admin access.

### 4.6 Inquiries

A single inbox for demo requests and partner applications, filterable by type, with a status (new, contacted, closed) and a notes field on each. Show the newest first and badge the count of new items in the admin navigation.

### 4.7 Dashboard

The admin home shows new inquiries, surveys with recent responses, and the last few content publishes. Nothing fancier.

## 5. Surveys

I need to write a survey, send it to a list of people, and read the results. This is a real feature, not a stub.

A survey has a title, a slug, an intro paragraph, a thank-you message, a status (draft, open, closed), and an anonymity setting. It has ordered questions. Question types: short text, long text, single choice, multiple choice, rating on a one-to-five scale, NPS on a zero-to-ten scale, and yes or no. Each question has a prompt, optional help text, a required flag, and options where the type needs them.

The builder lets me add, reorder, edit, and delete questions, and preview the survey as a respondent will see it. Once a survey has responses, lock structural changes so results stay coherent; allow only text edits.

Distribution works two ways. The first is a recipient list: I add names and emails (typed in or pasted as lines), each recipient gets a unique tokenized link, and I send invitations from the admin with an editable subject and message. I can see who was invited, who opened, who completed, and I can resend or send a reminder to anyone who has not finished. A tokenized link can submit once. The second is an open link for the survey that anyone can use; open responses are marked as such and duplicate protection is a best effort only.

Results show each question summarized in the way that fits it: counts and bars for choices, average and distribution for ratings, a proper NPS score for NPS, and a readable list for text answers. I can view individual responses and export everything to CSV. Surveys are never linked from the public site and are not indexed.

## 6. Design handoff

I will supply the brand separately: the Opero master wordmark, the Operovia company wordmark, the five module marks, the Oppie orb in light and dark versions with animated listening and speaking states, a color and type specification, and page mockups. Until those arrive, build with a neutral placeholder theme and a text wordmark, and do not draw logos of your own.

Structure the front end so the design drops in without rework. Put every color, font, radius, shadow, and spacing value in one tokens file and reference tokens everywhere; nothing hardcoded in components. Put brand assets under public/brand with a small manifest that maps each mark to its file, so swapping a file never touches a component. Keep a light and a dark theme wired from the start, with dark as the default for the public site.

Two type rules that survive whatever design I send. Headline type must feel open and generous, never tight or condensed; loosen line height and tracking rather than cramming. Body type must be highly readable at length.

Motion is part of the mandate. The bar for this site is the most technically forward, polished, beautiful marketing site you can build. Scroll-triggered reveals, a gradient or aurora background treatment driven by the brand palette, the typing Oppie console, and a module showcase with real presence. All motion uses transform and opacity only, runs at sixty frames per second on a mid-range laptop, and fully respects reduced-motion preferences.

## 7. Technical decisions

Framework: Next.js with the App Router, TypeScript throughout, Tailwind for styling, and Framer Motion for animation. The public pages are server-rendered and cached, revalidated whenever content is published, so the site is fast and search engines see real HTML.

Database: Postgres, accessed through Drizzle ORM with migrations in the repo. Development uses a Neon database; production will point at whatever Postgres the environment provides.

Email: Resend, sending from a dedicated subdomain of operovia.com so it never interferes with our Microsoft 365 mail. Every outbound email (demo notification, partner application notification, admin invitation, survey invitation, survey reminder) gets a simple, branded template.

Uploads: an S3-compatible bucket in production, a local uploads folder in development, behind one small adapter.

Hosting: the app must build and run as a standard Node service so it can deploy anywhere. I develop and verify in Replit and will deploy from there first; assume nothing platform-specific.

Security: all admin routes and APIs require a session; CSRF protection on mutations; parameterized queries only; every secret in environment variables with a documented .env.example and nothing sensitive ever committed; upload validation; honeypot fields and rate limiting on public forms; survey and invitation tokens generated from at least thirty-two random bytes; an audit log of content publishes and admin logins.

Search, performance, and accessibility: proper metadata, Open Graph image, sitemap, and robots; Lighthouse scores of ninety or better in every category on the home page; self-hosted fonts; optimized images; WCAG AA contrast, full keyboard navigation, visible focus states, and labeled form controls.

## 8. How I want you to work

Start by creating a CLAUDE.md at the repo root that captures the rules in this section, so every future session picks them up automatically.

Work in small, verified units. Each unit is one coherent change that typechecks and builds. Commit after every unit with a clear message. Never leave the repo in a state that does not build.

When you have questions, do not scatter them through prose. Collect them, present each with the choices and your recommended answer, and proceed on your recommendation for anything low-risk while you wait. Stop and ask before any decision that is hard to reverse.

Do not invent copy, numbers, names, or claims about the product beyond what this document gives you. Where you need placeholder text, make it obviously placeholder and list every placeholder in a PLACEHOLDERS.md file so I can clear them.

Explain your work in plain language when you report back. Tell me what changed and what I can now do, not how the internals are wired.

## 9. Build order

Phase one: scaffold the project, database, migrations, authentication, and the empty admin shell with settings and my seeded account. Phase two: the content model, the home page with all seven sections loading from the database with the seed copy above, the Oppie console with editable scenes, and content editing with draft, preview, publish, and rollback. Phase three: the partners page, the demo and partner application forms, the inquiries inbox, and email notifications. Phase four: surveys end to end, from builder to distribution to results and export. Phase five: apply the supplied design when it arrives, then the motion pass, search metadata, performance work, and accessibility review.

The design handoff may land during any phase. When it does, applying it takes priority over the current phase.

Report at the end of each phase with a short summary of what is working, what you need from me, and the current placeholder list.
