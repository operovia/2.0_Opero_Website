import { textToRich } from '@/lib/rich-text';
import { choice, link, list, number, rich, text, type Fields, type SectionCheck, type Values } from './fields';
import { tokenHelp } from './tokens';
import { DATA_ROOM_FILES_PATH, DATA_ROOM_PATH, DEMO_TARGET, DOOR_PATH, FOUNDER_PATH, GO_PATH, GO_SCREEN_LABELS, type GoScreenName } from './constants';

/**
 * Every editable section of every public page: its fields and its seed copy.
 * Home page seed copy is the approved copy from the brief, word for word.
 * Sections marked `draftCopy` were drafted for the site and are flagged in
 * the admin for review.
 *
 * Adding a section here is enough for it to appear in the admin and be
 * seeded on the next start. Renaming or removing fields is safe: stored data
 * is merged over the seed and validated when it is read.
 */

export type SectionDef<F extends Fields = Fields> = {
  label: string;
  description?: string;
  fields: F;
  seed: Values<F>;
  draftCopy?: boolean;
  /** Runs after every field has passed its own validation, for figures that must agree with each other. */
  check?: SectionCheck<F>;
};

export type PageDef = {
  label: string;
  description: string;
  /** Public path, or null for site-wide content that appears on every page. */
  path: string | null;
  sections: Record<string, SectionDef>;
};

const section = <F extends Fields>(def: SectionDef<F>): SectionDef<F> => def;

export { DEMO_TARGET };

const buttonTargetHint = `A path on this site (like /partners), a full web address, or ${DEMO_TARGET} to open the demo form.`;

export const moduleOptions = [
  { value: 'build', label: 'Build' },
  { value: 'studios', label: 'Studios' },
  { value: 'playbook', label: 'Playbook' },
  { value: 'university', label: 'University' },
  { value: 'compass', label: 'Compass' },
] as const;

/* ------------------------------------------------------------------------ */
/* Home                                                                     */
/* ------------------------------------------------------------------------ */

const hero = section({
  label: 'Hero',
  description:
    'The first screen: the headline, the points, the figures (the proof stats with a strip label) and the Oppie console. Console questions and answers are edited under Oppie console.',
  fields: {
    headline: text('Headline', { max: 160, headline: true }),
    points: list(
      'Points',
      'Point',
      { text: text('Line', { max: 160 }) },
      { min: 1, max: 4, hint: 'A short list under the headline, in place of a paragraph.' },
    ),
    consoleFooterLeft: text('Console footer, first line', { max: 60, hint: 'Shown in capitals.' }),
    consoleFooterRight: text('Console footer, second line', { max: 60, hint: 'Shown in capitals.' }),
    consoleNote: text('Console note', { optional: true, max: 80, hint: 'Small print under the console. Leave empty to hide it.' }),
    guestGreeting: text('Guest greeting', {
      max: 80,
      headline: true,
      hint: 'Above the headline, over a short red carpet, for a guest with a welcome name on the Guests page. {name} becomes their welcome name. Everyone else sees no greeting.',
    }),
  },
  seed: {
    headline: 'Integrated Intelligent Property Management',
    points: [
      { text: 'One unified system to replace the patchwork of disconnected apps your teams run every day.' },
      { text: 'Anchored by a purpose-built property management core CRM.' },
      { text: 'Harnessed AI, built in from the ground up, with Oppie, your AI assistant.' },
    ],
    consoleFooterLeft: 'Ask in plain English',
    consoleFooterRight: 'Answers from your live data',
    consoleNote: 'Illustrative data. You decide what Oppie can see and do.',
    guestGreeting: 'Welcome, *{name}*.',
  },
});

const problem = section({
  label: 'Problem',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    body: rich('Body'),
    apps: list('App chips', 'Chip', { label: text('Label', { max: 60 }) }, { min: 1, max: 10, hint: 'Shown struck through, one after another.' }),
    closing: text('Closing line', { max: 200 }),
    closingGold: text('Words in gold', {
      optional: true,
      max: 60,
      hint: 'Words of the closing line to set in shimmering gold, written as they appear there: one platform, for example. Leave it empty for none.',
    }),
  },
  seed: {
    eyebrow: 'The status quo.',
    headline: 'Your operation runs on too many apps.',
    body: textToRich(
      'A board tool for projects. A wiki for SOPs. A training platform. A meetings and goals tool. A marketing tool for listings. Each with its own login, its own bill, and its own version of the truth, and none of them know your properties.',
    ),
    apps: [
      { label: 'Project boards' },
      { label: 'SOP wiki' },
      { label: 'Training platform' },
      { label: 'Meetings and goals tool' },
      { label: 'Listing marketing' },
      { label: 'Every login that comes with them' },
    ],
    closing: 'Opero replaces the patchwork with one platform built around your portfolio.',
    closingGold: 'one platform',
  },
});

const platform = section({
  label: 'Platform',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    headlineGold: text('Words in gold', {
      optional: true,
      max: 60,
      hint: 'Words of the headline to set in shimmering gold, written as they appear there: connected, for example. Leave it empty for none.',
    }),
    body: rich('Body'),
    coreLabel: text('Core panel label', { max: 40, hint: 'On the border of the panel that holds the core data and the areas of work.' }),
    coreDataLabel: text('Core data label', { max: 40, hint: 'Under the stack of core records.' }),
    coreData: list('Core data', 'Record', { name: text('Name', { max: 30 }) }, { min: 1, max: 6 }),
    coreAreas: list(
      'Areas of work',
      'Area',
      { title: text('Title', { max: 40 }), items: text('What it covers', { max: 400, multiline: true, hint: 'One per line.' }) },
      { min: 1, max: 3 },
    ),
    modules: list(
      'Modules',
      'Module',
      {
        module: choice('Module', moduleOptions, { hint: 'Its mark, jewel color and screenshot come from the brand files.' }),
        description: text('Description', { max: 160, multiline: true }),
        inside: text('Screenshot caption', {
          max: 220,
          multiline: true,
          hint: 'Under the screenshot in the tour and in the lightbox: what the person is looking at.',
        }),
        video: link('Screen recording', {
          optional: true,
          hint: "A link to a recording of the screen (an MP4 or WebM file, uploaded under Media or hosted elsewhere). It plays in the screenshot's place in the tour, muted and looping, with the screenshot as its first frame. Leave it empty to show the screenshot.",
        }),
      },
      { min: 1, max: 5 },
    ),
    seeItLabel: text('See it label', { max: 30, hint: 'The cue on each module card; pressing the card shows that module in the tour under the diagram.' }),
    lookInsideLabel: text('Look inside label', {
      max: 30,
      hint: "Each screenshot in the tour opens large when pressed; this is the picture's tooltip and what screen readers hear.",
    }),
    coreInside: text('Core screenshot caption', {
      optional: true,
      max: 220,
      multiline: true,
      hint: 'For the Core tab of the tour, which shows once a screenshot of the core CRM exists (see src/content/module-shots.ts). Until then the tab stays hidden.',
    }),
    oppieTitle: text('Oppie note', { max: 60, hint: 'Beside the Oppie mark, in the middle of the lines joining the core and the modules.' }),
    oppieDetail: text('Oppie note, second line', { optional: true, max: 80 }),
  },
  seed: {
    eyebrow: 'The platform.',
    headline: 'One platform. Every department.',
    headlineGold: 'connected',
    body: textToRich(
      'At the core is a CRM built for property management: every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities. Around it, five modules run how you work. Studios for project canvases and workflows. Playbook for your SOPs. University for training your team. Compass for your operating rhythm: priorities, scorecards and meetings. And Build, where your own people create custom apps with AI, no developers required.',
    ),
    coreLabel: 'Core functionality',
    coreDataLabel: 'Core data',
    coreData: [{ name: 'Companies' }, { name: 'Contacts' }, { name: 'Properties' }, { name: 'Spaces' }],
    coreAreas: [
      { title: 'Leasing', items: 'Sales pipeline\nBrochure creation\nComp tracking\nAI-assisted LOI drafting\nAI-assisted lease drafting' },
      { title: 'Property management', items: 'Tenant account management\nBuilding operations manuals\nProperty inspections\nBudgeting\nFinancial reporting' },
      { title: 'Facilities', items: 'Work orders\nFleet management\nBillable time analysis\nCity inspection tracking\nAsset lists / capital' },
    ],
    modules: [
      {
        module: 'build',
        description: 'Your own people create custom apps with AI, no developers required.',
        inside:
          'An app a property manager made by describing it to Oppie: a renewal tracker running on the live leases, with the next change already underway.',
        video: '',
      },
      {
        module: 'studios',
        description: 'Project canvases and workflows.',
        inside:
          'A project canvas for the turn season: every unit with its status, owner, day of the twelve-day turn and next step, tied to the property it belongs to.',
        video: '',
      },
      {
        module: 'playbook',
        description: 'Your SOPs and process documentation.',
        inside: 'A procedure with its steps, owner and version, found the way you would ask a colleague: Oppie answers from the manual and opens the page.',
        video: '',
      },
      {
        module: 'university',
        description: 'Training for your team.',
        inside: 'A course path for a new team member: the articles in order, the one up next with its knowledge check, progress, and what is due this week.',
        video: '',
      },
      {
        module: 'compass',
        description: 'Your operating rhythm: priorities, scorecards and meetings.',
        inside: "The weekly scorecard and this Period's Rocks on the morning before the leadership meeting, every number scored against its goal.",
        video: '',
      },
    ],
    seeItLabel: 'See it',
    lookInsideLabel: 'Look inside',
    coreInside: '',
    oppieTitle: 'Oppie works across all of it.',
    oppieDetail: '',
  },
});

const oppie = section({
  label: 'Oppie',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    body: rich('Body'),
    closing: text('Closing line', { max: 200 }),
  },
  seed: {
    eyebrow: '',
    headline: 'Just ask Oppie.',
    body: textToRich(
      'Oppie is the AI assistant built into every corner of the platform, and it knows your portfolio. The ceiling height in Suite 200 at Horizon? Available spaces at the Guardian Building? Lease expirations coming up this quarter? Ask in plain English and get an answer from your live data, in seconds.',
    ),
    closing: "AI isn't a feature bolted on. It's how the platform works, every step of the way.",
  },
});

const goScreenOptions = (Object.keys(GO_SCREEN_LABELS) as GoScreenName[]).map((value) => ({ value, label: GO_SCREEN_LABELS[value] }));

const go = section({
  label: 'OperoGo',
  description: 'The mobile app: what it does, where to get it, and the phone screens that show it. The screens are drawn (scripts/go-shots), not captured.',
  draftCopy: true,
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    body: rich('Body'),
    storesLine: text('Stores line', { max: 120, hint: 'Above the store buttons, once a store link is entered.' }),
    appStoreLabel: text('App Store button', { max: 30 }),
    appStoreUrl: link('App Store link', {
      optional: true,
      hint: "The app's page on the App Store. Empty until the app is listed; until a store link is entered, the Coming soon line stands where the buttons will.",
    }),
    playLabel: text('Google Play button', { max: 30 }),
    playUrl: link('Google Play link', {
      optional: true,
      hint: "The app's page on Google Play. Empty until the app is listed; until a store link is entered, the Coming soon line stands where the buttons will.",
    }),
    comingSoonLine: text('Coming soon line', { max: 120, hint: 'In place of the stores line and the buttons until a store link is entered.' }),
    signInLine: text('Sign-in line', { optional: true, max: 160, hint: 'Under the store buttons, or the Coming soon line. How people sign in.' }),
    features: list('What it does', 'Feature', { title: text('Title', { max: 60 }), body: text('Line', { max: 240, multiline: true }) }, { min: 1, max: 6 }),
    screens: list(
      'Screens',
      'Screen',
      {
        screen: choice('Screen', goScreenOptions, { hint: 'Which drawn screen shows; the pictures come from the repo.' }),
        title: text('Title', { max: 40 }),
        caption: text('Caption', { max: 160, multiline: true }),
      },
      { min: 1, max: 4 },
    ),
    lookCloserLabel: text('Look closer label', {
      max: 30,
      hint: "Each phone opens its screen large when pressed, where it can be zoomed; this is the phone's tooltip and what screen readers hear.",
    }),
  },
  seed: {
    eyebrow: 'OperoGo',
    headline: 'Take Opero *with you*.',
    body: textToRich(
      'OperoGo is the native mobile app, built for the people who are never at a desk: property managers walking a building, leasing agents on a tour, the field team on the road. It runs on the same live data as the platform, so what you see on your phone is what the office sees, and what you record on site is in the system before you leave the parking lot.',
    ),
    storesLine: 'A native app for iPhone and Android.',
    appStoreLabel: 'App Store',
    appStoreUrl: '',
    playLabel: 'Google Play',
    comingSoonLine: 'Coming soon to the App Store and Google Play',
    playUrl: '',
    signInLine: 'Sign in with your company account, with Face ID or a fingerprint to make it quick.',
    lookCloserLabel: 'Look closer',
    features: [
      {
        title: 'Ask Oppie, hands free',
        body: 'Talk to Oppie the way you would to a colleague: ask about a property, add a note, log an activity, or call a contact, without typing a word.',
      },
      {
        title: 'Inspections that guide you',
        body: 'Walk a property stop by stop with the route on the floor plan, mark each item, take photos as you go, and turn a finding into a work order on the spot.',
      },
      {
        title: 'Leasing in your hand',
        body: 'Prospects and deals, the space directory, the stacking plan, and a deal analyzer for working a scenario on the way to the meeting.',
      },
      { title: 'Field ops and the fleet', body: 'Vehicle inspections, incident reports, and service requests, with photos, from the truck.' },
      {
        title: 'The operations manual, on site',
        body: "Every property's operations manual, from the electrical room to the roof, readable and editable where you stand.",
      },
      { title: 'Report a building issue', body: 'A leak, an outage, damage: report it with a photo and a location, and follow it to resolution.' },
    ],
    screens: [
      { screen: 'home', title: 'Home', caption: 'Everything you have access to, one tap away, and Oppie listening.' },
      { screen: 'oppie', title: 'Oppie', caption: 'Ask about a property out loud and get the answer read back.' },
      { screen: 'inspection', title: 'Guided inspection', caption: 'Stop by stop, with photos, and a finding that becomes a work order.' },
      { screen: 'leasing', title: 'Stacking plan', caption: 'Every floor and suite: what is leased, what is coming up, what is open.' },
    ],
  },
});

const proof = section({
  label: 'Proof',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    body: rich('Body'),
    stats: list(
      'Stats',
      'Stat',
      {
        value: text('Value', { max: 30, hint: 'The figure, shown large: 100+, for example.' }),
        label: text('Label', { max: 80, hint: 'What the figure counts, shown small under it: People work in it daily, for example.' }),
        short: text('Hero label', {
          optional: true,
          max: 40,
          hint: 'A few words under the figure where it stands in the hero, two by two under the points: daily users, for example. Leave it empty to keep this stat out of the hero.',
        }),
      },
      { min: 1, max: 6 },
    ),
  },
  seed: {
    eyebrow: '',
    headline: 'Not a demo. A daily operating system.',
    body: textToRich(
      "Opero was built inside the founder's former company, a commercial and residential property management firm, where it runs the business every day: leasing, property management, facilities, projects, training, meetings. Seventy-plus people work in it. Six figures of annual software spend, replaced. Every feature exists because an operator needed it.",
    ),
    stats: [
      { value: '100+', label: 'People work in it daily', short: 'daily users' },
      { value: '2.5M+', label: 'Square feet live', short: 'sq ft live' },
      { value: '850+', label: 'Residential units live', short: 'residential units' },
      { value: '$100K+', label: 'Licensing fees saved each year', short: 'a year in licensing fees replaced' },
    ],
  },
});

const partner = section({
  label: 'Design partner',
  description: tokenHelp,
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true, hint: tokenHelp }),
    body: rich('Body', { hint: tokenHelp }),
    closing: text('Closing line', { max: 200 }),
    buttonLabel: text('Button label', { max: 40 }),
    buttonTarget: link('Button link', { hint: buttonTargetHint }),
  },
  seed: {
    eyebrow: 'A founding seat.',
    headline: 'Become a {partner}.',
    body: textToRich(
      "We're opening Opero to a small group of firms as {partners}: twelve months working directly with the team that built it, shaping the platform around how your firm actually operates, at preferred founding terms. You get the platform early, and a real say in where it goes.",
    ),
    closing: 'Partner seats are limited.',
    buttonLabel: 'Apply for a seat',
    buttonTarget: '/partners',
  },
});

const closing = section({
  label: 'Closing call to action',
  fields: {
    headline: text('Headline', { max: 160, headline: true }),
    subhead: text('Subhead', { max: 240, multiline: true }),
    buttonLabel: text('Button label', { max: 40 }),
    buttonTarget: link('Button link', { hint: buttonTargetHint }),
  },
  seed: {
    headline: 'See it running.',
    subhead: 'A live walkthrough on a real portfolio. No slideware, no canned demo.',
    buttonLabel: 'Book a demo',
    buttonTarget: DEMO_TARGET,
  },
});

/* ------------------------------------------------------------------------ */
/* Partners                                                                 */
/* ------------------------------------------------------------------------ */

const itemFields = { title: text('Title', { max: 100 }), body: text('Text', { max: 400, multiline: true }) };

const partnersIntro = section({
  label: 'Introduction',
  description: tokenHelp,
  draftCopy: true,
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 80 }),
    headline: text('Headline', { max: 160, headline: true, hint: tokenHelp }),
    body: rich('Body', { hint: tokenHelp }),
  },
  seed: {
    eyebrow: 'For owner-operators and property managers',
    headline: 'Become a {partner}.',
    body: textToRich(
      "Opero isn't a concept. It runs the founder's former company, a commercial and residential property management firm, every day: leasing, property management, facilities, projects, training, and meetings. Now we're opening it to a small group of firms as {partners}.\n\nFor twelve months you work directly with the team that built it, shaping the platform around how your firm actually operates, at preferred founding terms. You get the platform early, and a real say in where it goes.",
    ),
  },
});

const partnersGets = section({
  label: 'What you get',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    items: list('Benefits', 'Benefit', itemFields, { min: 1, max: 8 }),
  },
  seed: {
    headline: 'What you get',
    items: [
      {
        title: 'The working platform, early',
        body: 'Not a prototype. You start on the same platform that runs a real portfolio every day, with Oppie built in.',
      },
      {
        title: 'A direct line to the founder',
        body: 'No support queue between you and the people building it. You work with the founder and the team directly.',
      },
      {
        title: 'A real voice in the roadmap',
        body: 'What your teams need shapes what gets built next. How your firm operates becomes part of how Opero grows.',
      },
      {
        title: 'Preferred founding terms that carry forward',
        body: 'Founding terms that stay with you as Opero grows, in recognition of the part you play in shaping it.',
      },
    ],
  },
});

const partnersAsks = section({
  label: 'What we ask',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    items: list('Requests', 'Request', itemFields, { min: 1, max: 8 }),
  },
  seed: {
    headline: 'What we ask in return',
    items: [
      { title: 'Real daily use', body: 'Run real work in Opero every day, so what we learn comes from actual operations.' },
      { title: 'A standing feedback cadence', body: "A regular, scheduled conversation about what's working and what isn't." },
      { title: 'Candor', body: 'Tell us when something falls short. Honest feedback is the point.' },
      { title: 'A reference, when it earns it', body: "If Opero earns it, a willingness to tell peers what it's done for your firm." },
    ],
  },
});

const partnersSelection = section({
  label: 'Limited seats',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    body: rich('Body'),
  },
  seed: {
    headline: 'Seats are limited',
    body: textToRich(
      "We're selecting a small number of firms, deliberately, so each one gets real attention and a real voice. If Opero fits the way you operate, we'd like to hear from you.",
    ),
  },
});

const partnersApply = section({
  label: 'Application form',
  description: 'Heading, labels, and thank-you message for the application form.',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    intro: text('Introduction', { max: 300, multiline: true }),
    nameLabel: text('Name label', { max: 60 }),
    firmLabel: text('Firm label', { max: 60 }),
    roleLabel: text('Role label', { max: 60 }),
    emailLabel: text('Email label', { max: 60 }),
    phoneLabel: text('Phone label', { max: 60 }),
    commercialLabel: text('Commercial square feet label', { max: 60 }),
    residentialLabel: text('Residential units label', { max: 60 }),
    systemsLabel: text('Systems label', { max: 80 }),
    systemsHint: text('Systems hint', { optional: true, max: 160 }),
    interestLabel: text('Why interested label', { max: 80 }),
    optionalLabel: text('Marker for optional fields', { max: 30 }),
    submitLabel: text('Submit button', { max: 40 }),
    thankYouTitle: text('Thank-you heading', { max: 120 }),
    thankYouBody: text('Thank-you message', { max: 400, multiline: true }),
  },
  seed: {
    headline: 'Apply for a seat',
    intro: 'Tell us about your firm and your portfolio. We read every application and follow up personally.',
    nameLabel: 'Name',
    firmLabel: 'Firm',
    roleLabel: 'Role',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    commercialLabel: 'Commercial square feet',
    residentialLabel: 'Residential units',
    systemsLabel: 'Systems you run today',
    systemsHint: 'Your property management, project, training, and other tools.',
    interestLabel: 'Why are you interested?',
    optionalLabel: '(optional)',
    submitLabel: 'Submit application',
    thankYouTitle: 'Thank you for applying.',
    thankYouBody: "We'll review your application and follow up with you personally.",
  },
});

/* ------------------------------------------------------------------------ */
/* Investor Hub                                                             */
/* ------------------------------------------------------------------------ */

const investorsIntro = section({
  label: 'Introduction',
  description:
    "The top of the Data Room's Founder tab, in the founder's voice. The public Founder page shows the same headline, photo, name, role, and LinkedIn icon, so an edit here changes both.",
  draftCopy: true,
  fields: {
    eyebrow: text('Eyebrow', {
      optional: true,
      max: 60,
      hint: 'Kept for the record. The Data Room shows none, since the strip above it names the room; the Founder page has its own.',
    }),
    headline: text('Headline', { max: 120, headline: true }),
    name: text('Signed by', { max: 80 }),
    role: text('Role', { max: 80 }),
    linkedin: link('LinkedIn profile', { optional: true, hint: 'Shown as the LinkedIn icon beside your name. Leave it empty to hide the icon.' }),
    description: text('Search and share description', { max: 200, multiline: true, hint: 'Shown in search results and link previews.' }),
  },
  seed: {
    eyebrow: 'Data Room',
    headline: 'I lived the problem. Then I built the solution.',
    name: 'Joe Mifsud',
    role: 'Founder',
    linkedin: 'https://www.linkedin.com/in/joseph-mifsud-b7481217/',
    description: 'Twenty-five years in property management, the problem it showed, and the platform built to solve it.',
  },
});

const investorsLetter = section({
  label: "The founder's letter",
  description:
    "Opened by the button under the headline at the top of the Data Room's Founder tab and the Founder page, so an edit here changes both. It closes with the signature, in a handwriting face, the name and role, and the Operovia logo.",
  draftCopy: true,
  fields: {
    buttonLabel: text('Button', { max: 40 }),
    title: text('Title', { max: 80 }),
    date: text('Date line', { optional: true, max: 40, hint: 'Shown under the title when filled in. Empty, since the site shows no dates.' }),
    body: rich('Letter'),
    signature: text('Signature', { max: 30, hint: 'Written in the handwriting face, above the name.' }),
    name: text('Name', { max: 80 }),
    role: text('Role', { max: 80 }),
  },
  seed: {
    buttonLabel: 'Read My Story',
    title: 'Why I built Opero',
    date: '',
    body: textToRich(
      [
        'I have spent 25 years in property and asset management. It is the only career I have ever had. Along the way I have worked beside leasing agents, property managers, accountants, maintenance teams, and asset managers, and I have learned how much skill and care it takes to run properties well.',
        'I eventually became COO of a commercial property management firm. That seat gave me a clear view of something I had felt from every seat before it. The people in this industry are very good at what they do, but the software they work in was never built for how they actually work.',
        "Most firms run on a system of record surrounded by a patchwork of other tools: one for projects, one for procedures, one for training, one for meetings and goals. Each lives in its own world, and none of them understand the properties or the people behind the work. The job of connecting it all falls on people, through spreadsheets, re-keyed data, and knowledge that lives in someone's head.",
        'The turning point was a renewal notice. One of the workflow tools we relied on came back with a price nearly 50% higher than the one they brought us in at, just a year earlier. My reaction was simple: this is ridiculous, and it is time to build our own.',
        'I started by myself, on nights, weekends, vacations...any free moment I could find, while still doing my job. I am an operator, a property manager at heart, not a software engineer. AI made it possible for me to build, and 25 years in the business told me what to build.',
        'The foundation was a CRM designed for property management. Around it I added the tools our teams relied on every day, and I built Oppie, our AI assistant, into every part of it from the first line of code. We put Opero to work at the firm, and it began replacing the tools our teams had been paying for separately, including the one that sent that renewal notice.',
        'But I had built it for one company. When I showed it to operators at other firms, they saw their own problems in it, and I understood this was bigger than one company. Bringing it to the industry meant rebuilding it from the ground up, this time to serve many firms instead of one.',
        'Leaving the COO role was not an easy decision. I worked a long time to earn that seat, and I walked away from it with my eyes open. I did it because I love this industry, and it deserves better: software built by someone who has done the work. I was not willing to wait for someone else to build it.',
        'At Operovia, we hold ourselves to a simple standard: software should be a silent partner. It should work quietly in the background, make common sense, and never become the thing your business is about. Your business is your properties, your tenants, and your people, and Opero should make that work easier and then get out of the way.',
        'Today we are a small company with a big responsibility. We are building Opero for firms across the industry, alongside operators who live this work every day. We will not get everything right the first time, and we will keep listening to the people who use it.',
        'This industry gave me a career I am proud of. Opero is my way of giving something back to the people who keep it running.',
      ].join('\n\n'),
    ),
    signature: 'joe',
    name: 'Joe Mifsud',
    role: 'Founder and CEO',
  },
});

const investorsStory = section({
  label: 'The story',
  description:
    'Two columns across the page: the problem, over a cloud of disconnected apps, and the solution, under the Opero mark. The public Founder page shows these columns too.',
  draftCopy: true,
  fields: {
    problemTitle: text('Problem: title', { max: 80 }),
    problemBody: text('Problem: text', { max: 240, multiline: true }),
    solutionTitle: text('Solution: title', { max: 80 }),
    solutionBody: text('Solution: text', { max: 240, multiline: true }),
  },
  seed: {
    problemTitle: 'The problem',
    problemBody:
      'Operators run on a patchwork of disconnected apps, each with its own login, its own bill, and its own version of the truth. None of them know the properties.',
    solutionTitle: 'The solution',
    solutionBody: 'Opero: one platform built around a core CRM, with Oppie, the AI assistant, in every step. It runs our flagship operator every day.',
  },
});

const investorsNext = section({
  label: 'What comes next',
  description: tokenHelp,
  draftCopy: true,
  fields: {
    heading: text('Heading', { max: 60, hint: 'Shown small, in capitals.' }),
    todayLabel: text('Today: label', { max: 30 }),
    todayTitle: text('Today: title', { max: 80 }),
    todayBody: text('Today: text', { max: 240, multiline: true, hint: tokenHelp }),
    nextLabel: text('Next: label', { max: 30 }),
    nextTitle: text('Next: title', { max: 80 }),
    nextBody: text('Next: text', { max: 240, multiline: true, hint: tokenHelp }),
  },
  seed: {
    heading: 'Where it goes next',
    todayLabel: 'Today',
    todayTitle: 'In production',
    todayBody: 'Seventy-plus people at our flagship operator work in it every day, and it has replaced six figures of annual software spend.',
    nextLabel: 'Next',
    nextTitle: 'The commercial release',
    nextBody: 'The same system, for operators who did not build it, starting with a small group of {partners}.',
  },
});

const areaLines = 'One per line.';

const investorsPlatform = section({
  label: 'Today and on deck',
  description:
    "What runs at our flagship operator today against what the new build adds, area by area, from the investor room's capability table. The counts on the page are worked out from these lists.",
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    intro: text('Introduction', { max: 300, multiline: true }),
    todayLabel: text('Running today: label', { max: 60 }),
    nextLabel: text('On deck: label', { max: 60 }),
    extendedLabel: text('Extended: tag', { max: 20 }),
    extendedNote: text('Extended: meaning', { max: 80 }),
    areas: list(
      'Areas',
      'Area',
      {
        name: text('Name', { max: 40 }),
        today: text('Running today', { max: 1200, multiline: true, hint: areaLines }),
        extended: text('Running today, extended in the new build', { optional: true, max: 1200, multiline: true, hint: areaLines }),
        next: text('New in the new build', { optional: true, max: 1200, multiline: true, hint: areaLines }),
      },
      { min: 1, max: 10 },
    ),
  },
  seed: {
    headline: "What runs today, and what's on deck.",
    intro:
      'Described from the running system, not from a roadmap. Everything running at our flagship operator today carries into the new build, which adds the rest.',
    todayLabel: 'Running today',
    nextLabel: 'On deck for the new build',
    extendedLabel: 'Extended',
    extendedNote: 'Running today, extended in the new build',
    areas: [
      {
        name: 'Leasing & Sales',
        today: 'Prospect management and pipeline\nAI interest scoring\nTour scheduling\nLease terms analyzer and calculator',
        extended: 'LOI and lease generation, with redline management\nBrochure management',
        next: 'Listing syndication integration\nCommission and brokerage house tracking',
      },
      {
        name: 'Tenancy',
        today: 'AI lease abstraction\nInstant answers from Oppie on lease information\nRenewals',
        extended: 'Move-in and move-out workflows\nTenant communications',
        next: 'Tenant portal\nUtility management',
      },
      {
        name: 'Budgeting and reporting',
        today: 'Budgeting and forecasting workflows',
        extended: 'Financial reporting and report builder\nActual vs. budget reporting',
        next: '',
      },
      {
        name: 'Records',
        today:
          'Global contacts and companies\nProperties, buildings, and suites\nEntity records\nAvailability and vacancy\nFloor plans and space visualization\n3D tours',
        extended: 'Document management\nVendor records and insurance certificates',
        next: '',
      },
      {
        name: 'Work management',
        today:
          'Project and task boards\nWork orders and dispatch\nInspections\nPurchase orders and approvals\nProcess and SOP library\nLearning and training\nPersonal dashboards',
        extended: '',
        next: 'Meeting capture and notes',
      },
      {
        name: 'Planning',
        today: 'Company operating system (EOS)\nQuarterly priorities and scorecards\nAcquisition pipeline',
        extended: 'Portfolio dashboards and KPIs',
        next: 'Development site finder\nValuation and DCF modeling',
      },
      {
        name: 'Oppie and AI',
        today: 'Build: describe-and-create applications',
        extended: 'Oppie across every module\nNatural-language answers on portfolio data\nAgentic task execution\nAI drafting in documents and communications',
        next: '',
      },
      {
        name: 'Trust',
        today: 'Role-based access control\nSingle sign-on\nNotification engine\nMobile apps, iOS and Android\nOpen API',
        extended: 'Third-party security assessment',
        next: 'Multi-tenant SaaS architecture\nCustomer data migration tooling\nSOC 2',
      },
    ],
  },
});

const investorsRound = section({
  label: 'The round',
  description:
    'The terms of the current round, the investment model, and the capitalization table. Shown to guests who came through the front door and to signed-in admins only, never on a public page. The figures come from the signed documents and the owner; the model works out every percentage from them.',
  draftCopy: true,
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    termsHeading: text('Headline', { max: 120, headline: true }),
    terms: list(
      'Terms',
      'Term',
      {
        value: text('Figure', { max: 30, hint: 'Shown large, like $750,000 or 180 days.' }),
        label: text('What it is', { max: 120 }),
      },
      { min: 1, max: 8 },
    ),
    getsHeading: text('What the investor gets: heading', { max: 60 }),
    getsBody: text('What the investor gets: text', { max: 600, multiline: true }),
    modelHeading: text('Model: heading', { max: 60 }),
    sliderLabel: text('Slider label', { max: 40 }),
    shareLabel: text('Share of round: label', { max: 40 }),
    ownershipLabel: text('Ownership: label', { max: 40 }),
    remainingLabel: text('Allocation remaining: label', { max: 40 }),
    raise: number('The round, in dollars', { min: 1, integer: true, hint: 'The amount being raised. The share of round and the dilution come from it.' }),
    cap: number('Valuation cap, in dollars', { min: 1, integer: true, hint: 'The post-money cap. Ownership is the investment divided by it.' }),
    minimum: number('Minimum investment, in dollars', {
      min: 1,
      integer: true,
      hint: "The smallest investment, and the slider's lower end. The minimum shown in the terms above is its own text; edit it to match.",
    }),
    maximum: number('Largest investment on the slider, in dollars', { min: 1, integer: true, hint: 'No more than the round.' }),
    step: number('Slider step, in dollars', {
      min: 1,
      integer: true,
      hint: 'Must fit a whole number of times between the minimum and the largest investment.',
    }),
    start: number('Starting amount, in dollars', {
      min: 1,
      integer: true,
      hint: 'The amount shown before the visitor moves the slider. Between the minimum and the largest investment.',
    }),
    capHeading: text('Capitalization: heading', { max: 120 }),
    holderColumn: text('Column: holder', { max: 30 }),
    classColumn: text('Column: class', { max: 30 }),
    todayColumn: text('Column: today', { max: 30 }),
    afterColumn: text('Column: after the round', { max: 30 }),
    sharesUnit: text('Unit after share counts', { max: 20, hint: 'Shown after each count, like 7,000,000 shares.' }),
    totalLabel: text('Total row: label', { max: 30 }),
    priceLabel: text('Price per share: label', { max: 120, hint: 'Worked out from the cap and the full round, so it is an illustration.' }),
    capTable: list(
      'Capitalization today',
      'Holder',
      {
        holder: text('Holder', { max: 60 }),
        class: text('Class', { max: 60 }),
        shares: number('Shares', { min: 0, integer: true }),
      },
      { min: 1, max: 12 },
    ),
    youLabel: text('Label for the reader in the table', { max: 40 }),
    othersLabel: text('Label for the rest of the round in the table', { max: 60 }),
    capNote: text('Note under the table', { max: 800, multiline: true }),
    disclaimer: text('Small print', {
      max: 600,
      multiline: true,
      hint: 'At the foot of The Raise and the Cap Table. Have counsel review it before the room goes live.',
    }),
  },
  seed: {
    eyebrow: 'The round',
    termsHeading: 'The raise',
    terms: [
      { value: '$750,000', label: 'on a standard post-money SAFE' },
      { value: '$10,000,000', label: 'valuation cap, no discount' },
      { value: '$50,000', label: 'minimum investment' },
      { value: '$250,000', label: 'and above receives pro-rata rights via side letter' },
      { value: '180 days', label: 'the round remains open, from company formation' },
    ],
    getsHeading: 'What the investor gets',
    getsBody:
      'The SAFE converts to preferred stock at the next priced equity round, at the lower of the cap or the round price. The cap is what does the work: a $100,000 check today converts as if the company were worth no more than $10 million, regardless of the price later investors pay.',
    modelHeading: 'Model your investment',
    sliderLabel: 'Your investment',
    shareLabel: 'Share of round',
    ownershipLabel: 'Your ownership',
    remainingLabel: 'Allocation remaining',
    raise: 750000,
    cap: 10000000,
    minimum: 50000,
    maximum: 750000,
    step: 25000,
    start: 50000,
    capHeading: 'Capitalization, today and after the round converts',
    holderColumn: 'Holder',
    classColumn: 'Class',
    todayColumn: 'Today',
    afterColumn: 'After the round',
    sharesUnit: 'shares',
    totalLabel: 'Total',
    priceLabel: 'Illustrative price per share, if the full round converts',
    capTable: [
      { holder: 'Founder', class: 'Common', shares: 7000000 },
      { holder: 'Flagship operator', class: 'Common', shares: 1500000 },
      { holder: 'Employee pool', class: 'Reserved, unissued', shares: 1500000 },
    ],
    youLabel: 'You',
    othersLabel: 'Other pre-seed investors',
    capNote:
      "The flagship operator's position was purchased at formation and is not part of this round. The dilution from the round falls on the holders already on the table. Your ownership is your investment divided by the cap, so it does not change if the round grows. Share counts after the round assume the full round is raised and are illustrative; the percentages are the terms.",
    disclaimer:
      'This page is a summary for discussion purposes only. It is not an offer to sell, or a solicitation of an offer to buy, any security. Any offering will be made only to qualified investors through definitive documents.',
  },
  // The slider's figures must agree with each other, or the model's sums no longer add up.
  check: ({ raise, minimum, maximum, step, start }) => {
    if (![raise, minimum, maximum, step, start].every(Number.isFinite)) return [];
    const issues = [];
    if (maximum > raise) issues.push({ field: 'maximum', message: 'The largest investment on the slider cannot be more than the round.' });
    if (minimum > maximum) issues.push({ field: 'minimum', message: 'The minimum investment cannot be more than the largest investment on the slider.' });
    if (start < minimum || start > maximum)
      issues.push({ field: 'start', message: 'The starting amount must be between the minimum and the largest investment.' });
    if (maximum >= minimum && (maximum - minimum) % step !== 0) {
      issues.push({ field: 'step', message: 'The slider step must fit a whole number of times between the minimum and the largest investment.' });
    }
    return issues;
  },
});

/* ------------------------------------------------------------------------ */
/* Privacy                                                                  */
/* ------------------------------------------------------------------------ */

const privacyNotice = section({
  label: 'Privacy notice',
  description: tokenHelp,
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    intro: rich('Introduction', { hint: tokenHelp }),
    sections: list('Sections', 'Section', { heading: text('Heading', { max: 120 }), body: rich('Text', { hint: tokenHelp }) }, { min: 1, max: 20 }),
  },
  seed: {
    headline: 'Privacy',
    intro: textToRich(
      'This notice explains what information this website collects, why we collect it, and what we do with it. Opero is a product of Operovia, Inc.',
    ),
    sections: [
      {
        heading: 'Information you give us',
        body: textToRich(
          'When you request a demo, apply to become a {partner}, or write to us from the Investor Hub, we collect what you enter in the form: your name, firm, role, email address, and phone number, plus anything else you choose to share, such as your portfolio size and the systems you use today. We use it to respond to you and to consider your application.',
        ),
      },
      {
        heading: 'Survey responses',
        body: textToRich(
          'If we invite you to a survey, we record your answers and whether you have opened and completed it, so we can follow up and avoid unnecessary reminders. Some surveys are anonymous. For those, your answers are stored without a link to your name or email address.',
        ),
      },
      {
        heading: 'Email',
        body: textToRich('We send email through an email delivery service, which handles your email address and the message content in order to deliver it.'),
      },
      {
        heading: 'Analytics',
        body: textToRich(
          'We may use an analytics service to understand, in aggregate, how visitors use this website. Where we do, it may set cookies or collect the standard information your browser sends, such as the pages you visit, the site that referred you, and your type of device.',
        ),
      },
      {
        heading: 'Cookies',
        body: textToRich(
          'This website uses a small number of cookies that it needs to work, such as keeping administrators signed in. It does not use advertising cookies.',
        ),
      },
      {
        heading: 'Who we share it with',
        body: textToRich(
          'We do not sell your information. We share it only with the service providers that help us run this website, such as hosting, email delivery, and analytics, and only as they need it to provide those services.',
        ),
      },
      {
        heading: 'How long we keep it',
        body: textToRich('We keep inquiries and survey responses for as long as we need them for the purposes above, and then delete them.'),
      },
      {
        heading: 'Your choices',
        body: textToRich('You can ask to see, correct, or delete the information you have given us by writing to {email}.'),
      },
      {
        heading: 'Contact',
        body: textToRich('Questions about this notice can go to Operovia, Inc., Ann Arbor, Michigan, at {email}.'),
      },
    ],
  },
});

/* ------------------------------------------------------------------------ */
/* Site-wide                                                                */
/* ------------------------------------------------------------------------ */

const header = section({
  label: 'Header',
  description: tokenHelp,
  draftCopy: true,
  fields: {
    links: list(
      'Navigation links',
      'Link',
      { label: text('Label', { max: 40, hint: tokenHelp }), href: link('Link', { hint: buttonTargetHint }) },
      {
        max: 6,
        hint: `A link to ${FOUNDER_PATH} shows to visitors, and a link to ${DATA_ROOM_PATH} shows to guests invited as investors and to signed-in admins in its place, never both at once.`,
      },
    ),
    buttonLabel: text('Button label', { max: 40 }),
    buttonTarget: link('Button link', { hint: buttonTargetHint }),
  },
  seed: {
    links: [
      { label: 'Platform', href: '/#platform' },
      { label: 'Oppie', href: '/#oppie' },
      { label: 'OperoGo', href: GO_PATH },
      { label: '{Partners}', href: '/partners' },
      { label: 'Founder', href: FOUNDER_PATH },
      { label: 'Data Room', href: DATA_ROOM_PATH },
    ],
    buttonLabel: 'Book a demo',
    buttonTarget: DEMO_TARGET,
  },
});

const footer = section({
  label: 'Footer',
  description: 'The contact email comes from Settings.',
  fields: {
    companyName: text('Company name', { max: 80, hint: 'In the small line at the foot of survey pages.' }),
    links: list('Links', 'Link', { label: text('Label', { max: 40 }), href: link('Link', { hint: buttonTargetHint }) }, { max: 6 }),
  },
  seed: {
    companyName: 'Operovia, Inc.',
    links: [{ label: 'Privacy', href: '/privacy' }],
  },
});

const demoForm = section({
  label: 'Demo request form',
  description: 'The form that opens from every Book a demo button.',
  draftCopy: true,
  fields: {
    title: text('Heading', { max: 80 }),
    intro: text('Introduction', { max: 300, multiline: true }),
    nameLabel: text('Name label', { max: 60 }),
    firmLabel: text('Firm label', { max: 60 }),
    emailLabel: text('Email label', { max: 60 }),
    phoneLabel: text('Phone label', { max: 60 }),
    messageLabel: text('Message label', { max: 60 }),
    optionalLabel: text('Marker for optional fields', { max: 30 }),
    submitLabel: text('Submit button', { max: 40 }),
    thankYouTitle: text('Thank-you heading', { max: 120 }),
    thankYouBody: text('Thank-you message', { max: 400, multiline: true }),
  },
  seed: {
    title: 'Book a demo',
    intro: "Tell us a little about your firm, and we'll follow up personally to set up a live walkthrough.",
    nameLabel: 'Name',
    firmLabel: 'Firm',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    messageLabel: 'Message',
    optionalLabel: '(optional)',
    submitLabel: 'Request a demo',
    thankYouTitle: 'Thank you.',
    thankYouBody: "We'll be in touch personally to set up your walkthrough.",
  },
});

const maintenance = section({
  label: 'Maintenance page',
  description: 'Shown to visitors while maintenance mode is on in Settings.',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    body: text('Message', { max: 400, multiline: true }),
  },
  seed: {
    headline: "We'll be right back.",
    body: 'The site is being updated. Please check back soon.',
  },
});

const notFound = section({
  label: 'Page not found',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
    body: text('Message', { max: 400, multiline: true }),
    buttonLabel: text('Button label', { max: 40 }),
  },
  seed: {
    headline: 'Page not found.',
    body: "The page you're looking for doesn't exist or has moved.",
    buttonLabel: 'Go to the home page',
  },
});

/* ------------------------------------------------------------------------ */
/* Founder page                                                             */
/* ------------------------------------------------------------------------ */

const founderPage = section({
  label: 'Page',
  description:
    'The eyebrow above the headline and the description for search results. The headline, photo, name, role, and LinkedIn are edited under Data Room, Introduction, and the story under Data Room, The story.',
  draftCopy: true,
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    description: text('Search and share description', { max: 200, multiline: true, hint: 'Shown in search results and link previews.' }),
  },
  seed: {
    eyebrow: 'Founder',
    description: 'Twenty-five years in property management, the problem it showed, and the platform built to solve it.',
  },
});

/* ------------------------------------------------------------------------ */
/* Front door                                                               */
/* ------------------------------------------------------------------------ */

const door = section({
  label: 'The door',
  description:
    'Everything on the private door at /welcome, where an invited guest enters the email address the invitation went to. The page is linked from nowhere and never indexed; the Guests page shows the link to share.',
  draftCopy: true,
  fields: {
    metaTitle: text('Page title', { max: 60, hint: 'The browser tab. The page is never indexed.' }),
    metaDescription: text('Search and share description', { max: 200, multiline: true }),
    eyebrow: text('Eyebrow', { optional: true, max: 60, hint: 'Optional. Small capitals above the title.' }),
    title: text('Title', { max: 120, headline: true, hint: 'Words between asterisks are set in italics.' }),
    intro: text('Introduction', { max: 200 }),
    personalTitle: text('Personal link: title', {
      max: 120,
      headline: true,
      hint: 'In place of the title for a guest who opens their personal link and has a welcome name on the Guests page, over a red carpet along the line. {name} becomes their welcome name.',
    }),
    personalIntro: text('Personal link: introduction', {
      max: 200,
      hint: 'In place of the introduction, under the personal title. Their address is already filled in.',
    }),
    confirmTitle: text('Emailed link: title', {
      max: 120,
      headline: true,
      hint: 'In place of the title for someone at a company on the Guests page who opens the link the door emailed them. With a welcome name on the company, the personal title shows instead.',
    }),
    confirmIntro: text('Emailed link: introduction', { max: 200, hint: 'Under that title. Their address is already filled in.' }),
    emailLabel: text('Email label', { max: 40 }),
    submitLabel: text('Enter button', { max: 30, hint: "The round arrow button's name for screen readers and its tooltip." }),
    checkingLabel: text('Button while checking', { max: 30 }),
    checkingStatus: text('Checking status', { max: 120, hint: 'Announced while the list is checked, and shown when motion is reduced.' }),
    stillCheckingStatus: text('Still checking status', { max: 120, hint: 'Shown if the check takes more than three seconds.' }),
    welcomeStatus: text('Welcome status', { max: 120 }),
    emptyMessage: text('Empty field message', { max: 200 }),
    invalidMessage: text('Not an address message', { max: 200 }),
    wrongMessage: text('Wrong address message', {
      max: 300,
      hint: 'Shown for every address that does not open the door. Keep it the same whether or not the address exists.',
    }),
    wrongHelp: text('Wrong address help line', { optional: true, max: 200, hint: 'Optional. A quieter line under the message.' }),
    limitMessage: text('Too many tries message', { max: 200, hint: '{wait} becomes the time left before they can try again, up to an hour.' }),
    troubleMessage: text('Server trouble message', { max: 200 }),
    sentMessage: text('Link sent message', {
      max: 200,
      hint: 'Shown when someone at a company on the Guests page enters their address: the door emails them a one-time link instead of opening. {address} becomes the address they entered.',
    }),
    sentHelp: text('Link sent help line', { optional: true, max: 200, hint: 'Optional. A quieter line under the message.' }),
    expiredMessage: text('Used link message', {
      max: 200,
      hint: 'Shown when someone opens an emailed link that was already used, or is more than a day old. Their address is filled in, so entering it sends a new link.',
    }),
    helpLine: text('Lost invitation line', { max: 80 }),
    helpLinkLabel: text('Lost invitation link', { max: 40, hint: 'Opens an email to the contact address in Settings.' }),
    publicLine: text('Public site line', { max: 80 }),
    publicLinkLabel: text('Public site link', { max: 40, hint: 'Goes to the home page.' }),
    companyLine: text('Company line', {
      max: 80,
      hint: 'Not shown: the Operovia logo stands at the foot of the door, and screen readers read this in its place.',
    }),
    alreadyInTitle: text('Already in: title', { max: 120, headline: true, hint: 'Shown to a guest whose browser already holds the key.' }),
    alreadyInIntro: text('Already in: line', { max: 200 }),
    alreadyInButton: text('Already in: button', { max: 40 }),
  },
  seed: {
    metaTitle: 'Welcome',
    metaDescription: 'A private door for invited guests of Opero.',
    eyebrow: '',
    title: 'This is *your* invitation.',
    intro: 'Enter your email address.',
    personalTitle: 'Welcome, *{name}*.',
    personalIntro: 'Your address is already filled in. Step in whenever you are ready.',
    confirmTitle: 'Your address is *confirmed*.',
    confirmIntro: 'It is already filled in. Step in whenever you are ready.',
    emailLabel: 'Email address',
    submitLabel: 'Enter',
    checkingLabel: 'Checking',
    checkingStatus: 'Checking your invitation.',
    stillCheckingStatus: 'Still checking. One moment.',
    welcomeStatus: 'Welcome. Opening Opero.',
    emptyMessage: 'Enter your email address.',
    invalidMessage: 'That does not look like a complete email address.',
    wrongMessage: 'That address did not open the door. Check the address your invitation was sent to and try again.',
    wrongHelp: 'If it should have worked, reply to your invitation and we will sort it out.',
    limitMessage: 'Too many tries for now. Please wait {wait} and try again.',
    troubleMessage: 'Something went wrong on our side. Please try again in a moment.',
    sentMessage: 'Check your inbox: we sent a link to {address}.',
    sentHelp: 'Open it to come in. It can take a minute to arrive, and it works once, within a day.',
    expiredMessage: 'That link was already used or has run out. Enter your address and we will send a new one.',
    helpLine: 'Lost your invitation?',
    helpLinkLabel: 'Write to us',
    publicLine: 'Here without an invitation?',
    publicLinkLabel: 'See Opero for everyone',
    companyLine: 'Operovia, Inc., Ann Arbor, Michigan',
    alreadyInTitle: 'You are already *in*.',
    alreadyInIntro: 'This browser remembers you.',
    alreadyInButton: 'Go to Opero',
  },
});

const dataRoomDocuments = section({
  label: 'The documents page',
  description:
    'The words around the folders and documents: the strip at the top of the Data Room, the headline, the labels. The folders and documents themselves are arranged under Data Room in the admin.',
  draftCopy: true,
  fields: {
    label: text('Name', { max: 40, hint: "The room's name: in the strip at the top of its pages, above the headline, and in the browser tab." }),
    founderTab: text('Founder tab', { max: 30, hint: "The first page: the founder's introduction and story." }),
    raiseTab: text('The Raise tab', { max: 30, hint: "The round's terms, and what runs today against what the raise builds." }),
    capTableTab: text('Cap Table tab', { max: 30, hint: 'The capitalization table, with the investment model under it.' }),
    documentsTab: text('Documents tab', { max: 30 }),
    headline: text('Headline', { max: 120, headline: true }),
    intro: text('Introduction', { max: 240, multiline: true }),
    rootLabel: text('Top of the room', { max: 40, hint: 'The name of the top level, above every folder.' }),
    foldersLabel: text('Folder list name', { max: 40, hint: 'Names the list of folders for screen readers.' }),
    folderWord: text('Folder, one', { max: 30 }),
    folderWordPlural: text('Folders, several', { max: 30 }),
    documentWord: text('Document, one', { max: 30 }),
    documentWordPlural: text('Documents, several', { max: 30 }),
    openLabel: text('Open button', { max: 30, hint: 'On PDFs and images, which open in the browser.' }),
    downloadLabel: text('Download button', { max: 30 }),
    addedLabel: text('Added label', { max: 30, hint: 'Before the date a document was added.' }),
    emptyMessage: text('Empty message', { max: 200, hint: 'In a folder with nothing in it, and in the room before anything is shared.' }),
    trackingNote: text('Recording note', {
      optional: true,
      max: 200,
      hint: 'Optional. A quiet line under the documents saying that opening and downloading them is recorded.',
    }),
    metaDescription: text('Share description', { max: 200, multiline: true, hint: 'The page is never indexed; this only fills a link preview.' }),
  },
  seed: {
    label: 'Data Room',
    founderTab: 'Founder',
    raiseTab: 'The Raise',
    capTableTab: 'Cap Table',
    documentsTab: 'Documents',
    headline: 'The *documents*.',
    intro: 'Everything shared with investors, in one place: decks, updates, and the materials behind the round.',
    rootLabel: 'All documents',
    foldersLabel: 'Folders',
    folderWord: 'folder',
    folderWordPlural: 'folders',
    documentWord: 'document',
    documentWordPlural: 'documents',
    openLabel: 'Open',
    downloadLabel: 'Download',
    addedLabel: 'Added',
    emptyMessage: 'Nothing has been shared here yet.',
    trackingNote: 'Opening and downloading documents here is recorded.',
    metaDescription: 'Documents shared with the investors of Opero.',
  },
});

/* ------------------------------------------------------------------------ */

export const pages = {
  home: {
    label: 'Home page',
    description: 'The main page, in eight sections.',
    path: '/',
    sections: { hero, problem, platform, oppie, go, proof, partner, closing },
  },
  partners: {
    label: 'Partners page',
    description: 'The page for firms applying for a founding seat.',
    path: '/partners',
    sections: { intro: partnersIntro, gets: partnersGets, asks: partnersAsks, selection: partnersSelection, apply: partnersApply },
  },
  investors: {
    label: 'Data Room',
    description:
      "The Data Room's Founder, The Raise and Cap Table tabs: the founder's story for investors, the round's terms, what runs today against what the raise builds, and the capitalization table with the investment model. Only guests invited as investors and signed-in admins see them; the documents are arranged under Data Room in the admin, and the words around them under Data Room: Documents.",
    path: DATA_ROOM_PATH,
    sections: {
      intro: investorsIntro,
      letter: investorsLetter,
      story: investorsStory,
      next: investorsNext,
      platform: investorsPlatform,
      round: investorsRound,
    },
  },
  privacy: {
    label: 'Privacy page',
    description: 'The privacy notice.',
    path: '/privacy',
    sections: { notice: privacyNotice },
  },
  site: {
    label: 'Site-wide',
    description: 'Header, footer, the demo form, and system pages.',
    path: null,
    sections: { header, footer, demoForm, maintenance, notFound },
  },
  dataRoom: {
    label: 'Data Room: Documents',
    description: 'The words around the folders and documents in the Data Room. The folders and documents themselves are arranged under Data Room in the admin.',
    path: DATA_ROOM_FILES_PATH,
    sections: { room: dataRoomDocuments },
  },
  founder: {
    label: 'Founder page',
    description:
      "The founder's introduction and story, for everyone. The headline, photo, name, role, and LinkedIn are edited under Data Room, Introduction, and the story under Data Room, The story.",
    path: FOUNDER_PATH,
    sections: { page: founderPage },
  },
  welcome: {
    label: 'Front door',
    description: 'The private door for invited guests. Linked from nowhere and never indexed; the Guests page shows the link to share.',
    path: DOOR_PATH,
    sections: { door },
  },
} satisfies Record<string, PageDef>;

export type Pages = typeof pages;
export type PageKey = keyof Pages;
export type SectionKey<P extends PageKey> = keyof Pages[P]['sections'] & string;
export type SectionData<P extends PageKey, S extends SectionKey<P>> = Pages[P]['sections'][S] extends SectionDef<infer F> ? Values<F> : never;
export type PageData<P extends PageKey> = { [S in SectionKey<P>]: SectionData<P, S> };

export function getPageDef(page: string): PageDef | undefined {
  return (pages as Record<string, PageDef>)[page];
}

export function getSectionDef(page: string, sectionKey: string): SectionDef | undefined {
  return getPageDef(page)?.sections[sectionKey];
}

/** Every page and section key, in display order. */
export function allSections(): { page: PageKey; section: string; def: SectionDef }[] {
  return (Object.keys(pages) as PageKey[]).flatMap((page) =>
    Object.entries(pages[page].sections as Record<string, SectionDef>).map(([sectionKey, def]) => ({ page, section: sectionKey, def })),
  );
}
