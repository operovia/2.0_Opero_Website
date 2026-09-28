# Placeholders

Everything on this list is a stand-in that needs a real answer or real asset. Clear items by replacing them and deleting the line.

## Brand and design

- **Color and type specification.** Not yet supplied. Colors are taken from the artwork itself (metal gradient, jewels, favicon ground) and type is Plus Jakarta Sans from the supplied font files. Adjust `src/theme/tokens.ts` when the specification arrives.
- **Page mockups.** Not yet supplied. Layouts are designed from the brief and the artwork.
- **Share image.** Until one is chosen in Admin, Settings, link previews use an image the site draws itself: the wordmark and the hero headline on the dark background. A designed image can replace it any time.

## Copy drafted for the site (flagged "Drafted copy to review" in the admin)

Review each in Admin, Content. Publishing a section clears its flag.

- **Partners page:** all five sections (introduction, what you get, what we ask, limited seats, application form wording).
- **Privacy page:** the whole notice. Worth a legal review; it makes plain statements such as "We do not sell your information".
- **Demo request form:** heading, introduction, labels, button, and thank-you message.
- **Header:** navigation labels (Platform, Oppie, and the partner label linking to the partners page).
- **Maintenance page** and **Page not found** wording.

## Copy derived from the brief (not flagged, but worth a look)

- **Platform section:** the core CRM card ("A CRM built for real estate" and its line) and the five module descriptions are condensed from the approved platform copy.
- **Oppie console note:** a small "Illustrative data" line under the console, because the answers are invented. Clear it in Content, Home page, Hero to hide it.
- **Oppie and Proof sections:** the brief gives no eyebrow, so none is shown. Each section has an optional eyebrow field.

## Invented, illustrative data

- **Oppie console answers.** The first three questions are from the brief, and the rent roll question is from the owner. The answers are invented for a Midwest office portfolio: Horizon Suite 200 (10 ft finished ceilings, 4,280 RSF, floor 2), three Guardian Building suites (910, 1400, 2215 with sizes), seven expiring leases with sample tenants Aldergrove Dental, Pinecrest Analytics, and Stonebridge Legal, and a rent roll for Parkside Commons (Copperline Coffee, Birchwood Therapy, Northgate Insurance, Summit Engineering: 16,600 RSF, $387,600 annual base rent, with the term left on each lease). Replace them in Admin, Oppie console.

## Surveys

- **Starting wording for each new survey:** the thank-you message ("Thank you. Your answers have been recorded.") and the invitation and reminder emails. Every survey's own copy is edited in its Settings and Recipients tabs; the starting text is in `src/surveys/defaults.ts`.
- **Fixed wording on survey pages:** the messages for a closed survey, an invitation-only survey, a link that does not work, and someone who has already responded; the scale notes ("1 is the lowest, 5 the highest" and "0 is not at all likely, 10 is extremely likely"); and the email line "This link is personal to you, so please do not forward this email." These live in `src/app/s/[slug]` and `src/server/surveys.ts`.

## Settings

- **Contact email** is seeded as hello@operovia.com. Confirm or change it in Admin, Settings.
