# The email invitation graphic

`invite.html` is a 1200 x 630 card for an email, with rounded corners, on white with 40px all round (1280 x 710 in all, nothing
see-through), so it blends into a white email: the Opero logo, By invitation, the home page's headline, a Go to Opero
button and operovia.com, on the dark canvas with the jewels' aurora. Its colors are literal copies of the
site's dark tokens and its words are the site's own, so nothing on it is new copy.

`node scripts/email-art/render.mjs` renders it to `public/email/opero-invite.png` (set `CHROME_PATH` to a Chromium if
none is installed for Playwright). The site serves that file to anyone at `/email/opero-invite.png`, outside the front
door's gate, so an email client can always show it.

## One guest's own card

`node scripts/email-art/render.mjs --name "Fifth Wall"` renders a card for one guest instead: "Welcome, *Fifth Wall*."
over the red carpet the site rolls out for them, with the headline beneath as a smaller line, the button and the
address. It goes to `scripts/email-art/personal/` (here `opero-invite-fifth-wall.png`), never to `public/`, so the name
is not published at an address anyone could guess: paste the picture into the email. Use the same name as the guest's
welcome name on the Guests page, so the card and the door agree.

## Sending it

1. Add the recipient's address to the guest list (Admin, Guests) with the role they should have.
2. For a personal welcome, give them a welcome name on the same page and press Save.
3. Paste the picture into the email (the general card can also be inserted from
   `https://operovia.com/email/opero-invite.png`).
4. Link the picture to their personal link: Copy link beside it on the Guests page. It fills in their address and, with
   a welcome name, greets them by it. Without one, the address link works too: `https://operovia.com/welcome?email=` and
   the address, its `@` written `%40`, for example `https://operovia.com/welcome?email=ideas%40fifthwall.com`.

Whoever follows the link, the recipient or anyone the email was forwarded to, finds the address filled in and only
presses enter, and enters with that guest's role. Preview, beside the link on the Guests page, shows it as they will
see it without counting as their visit.
