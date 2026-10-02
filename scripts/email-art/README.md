# The email invitation graphic

`invite.html` is a 1200 x 630 card for the top of an email: the Opero logo, By invitation, the home page's headline, a
Go to Opero button and operovia.com, on the dark canvas with the jewels' aurora. Its colors are literal copies of the
site's dark tokens and its words are the site's own, so nothing on it is new copy.

`node scripts/email-art/render.mjs` renders it to `public/email/opero-invite.png` (set `CHROME_PATH` to a Chromium if
none is installed for Playwright). The site serves that file to anyone at `/email/opero-invite.png`, outside the front
door's gate, so an email client can always show it.

## Sending it

1. Add the recipient's address to the guest list (Admin, Guests) with the role they should have.
2. Paste the picture into the email, or insert it from `https://operovia.com/email/opero-invite.png`.
3. Link the picture to the front door with the address filled in: `https://operovia.com/welcome?email=` and the
   address, its `@` written `%40`, for example `https://operovia.com/welcome?email=ideas%40fifthwall.com`.

Whoever follows the link, the recipient or anyone the email was forwarded to, finds the address filled in and only
presses enter, and enters with that guest's role. One picture serves every recipient; only the link changes.
