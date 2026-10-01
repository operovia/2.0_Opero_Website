import { textToRich } from '@/lib/rich-text';
import { choice, link, list, number, rich, text, type Fields, type SectionCheck, type Values } from './fields';
import { tokenHelp } from './tokens';
import { DEMO_TARGET, DOOR_PATH, FOUNDER_PATH, INVESTOR_HUB_PATH } from './constants';

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
  description: 'The first screen: headline, button, and the Oppie console. Console questions and answers are edited under Oppie console.',
  fields: {
    headline: text('Headline', { max: 160, headline: true }),
    subhead: rich('Subhead'),
    buttonLabel: text('Button label', { max: 40 }),
    buttonTarget: link('Button link', { hint: buttonTargetHint }),
    supportingLine: text('Line under the button', { max: 200 }),
    consoleBadge: text('Console badge', { max: 20, hint: 'Shown in capitals next to a pulsing dot.' }),
    consoleFooterLeft: text('Console footer, first line', { max: 60, hint: 'Shown in capitals.' }),
    consoleFooterRight: text('Console footer, second line', { max: 60, hint: 'Shown in capitals.' }),
    consoleNote: text('Console note', { optional: true, max: 80, hint: 'Small print under the console. Leave empty to hide it.' }),
  },
  seed: {
    headline: '*The* AI-driven operating platform for property management.',
    subhead: textToRich(
      'One system, built around a core CRM, that replaces the patchwork of disconnected apps your teams run every day, with Oppie, your AI assistant, woven into every step.',
    ),
    buttonLabel: 'Book a demo',
    buttonTarget: DEMO_TARGET,
    supportingLine: 'Built by operators inside a working commercial property management firm. Not a software lab.',
    consoleBadge: 'Live',
    consoleFooterLeft: 'Ask in plain English',
    consoleFooterRight: 'Answers from your live data',
    consoleNote: 'Illustrative data',
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
  },
  seed: {
    eyebrow: 'The status quo.',
    headline: 'Your operation runs on too many apps.',
    body: textToRich(
      'A board tool for projects. A wiki for SOPs. A training platform. An EOS tool. A marketing tool for listings. Each with its own login, its own bill, and its own version of the truth, and none of them know your properties.',
    ),
    apps: [
      { label: 'Project boards' },
      { label: 'SOP wiki' },
      { label: 'Training platform' },
      { label: 'EOS tool' },
      { label: 'Listing marketing' },
      { label: 'Every login that comes with them' },
    ],
    closing: 'Opero replaces the patchwork with one platform built around your portfolio.',
  },
});

const platform = section({
  label: 'Platform',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    body: rich('Body'),
    coreTitle: text('Core CRM title', { max: 80 }),
    coreText: text('Core CRM description', { max: 240, multiline: true }),
    coreProperty: text('Drawing: property', { max: 24, hint: 'The four kinds of record in the drawing on the CRM card, under their icons.' }),
    coreSuites: text('Drawing: suites', { max: 24 }),
    coreTenants: text('Drawing: tenants', { max: 24 }),
    coreProspects: text('Drawing: prospects', { max: 24 }),
    coreLeasing: text('Drawing: leasing', { max: 30, hint: 'The three lines of work the CRM drives, joined to the drawing.' }),
    coreManagement: text('Drawing: property management', { max: 30 }),
    coreFacilities: text('Drawing: facilities', { max: 30 }),
    modules: list(
      'Modules',
      'Module',
      {
        module: choice('Module', moduleOptions, { hint: 'Its mark, jewel color and screenshot come from the brand files.' }),
        description: text('Description', { max: 160, multiline: true }),
        inside: text('Screenshot caption', {
          max: 220,
          multiline: true,
          hint: 'Under the screenshot that opens from Look inside: what the person is looking at.',
        }),
      },
      { min: 1, max: 5 },
    ),
    lookInsideLabel: text('Look inside button', { max: 30, hint: 'On each module card. Opens a screenshot of the module.' }),
    insideHeading: text('Screenshot heading', { max: 60, hint: '{module} becomes the module name, so "Inside {module}" reads Inside Studios.' }),
    oppieTitle: text('Oppie note', { max: 60, hint: 'Beside the Oppie mark, in the middle of the lines joining the CRM and the modules.' }),
    oppieDetail: text('Oppie note, second line', { optional: true, max: 80 }),
  },
  seed: {
    eyebrow: 'The platform.',
    headline: 'One platform. Every department.',
    body: textToRich(
      'At the core is a CRM built for property management: every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities. Around it, five modules run how you work. Studios for project boards and workflows. Playbook for your SOPs. University for training your team. Compass for running on EOS. And Build, where your own people create custom apps with AI, no developers required.',
    ),
    coreTitle: 'A CRM built for property management',
    coreText: 'Every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities.',
    coreProperty: 'Property',
    coreSuites: 'Suites',
    coreTenants: 'Tenants',
    coreProspects: 'Prospects',
    coreLeasing: 'Leasing',
    coreManagement: 'Property management',
    coreFacilities: 'Facilities',
    modules: [
      {
        module: 'build',
        description: 'Your own people create custom apps with AI, no developers required.',
        inside:
          'An app a property manager made by describing it to Oppie: a renewal tracker running on the live leases, with the next change already underway.',
      },
      {
        module: 'studios',
        description: 'Project boards and workflows.',
        inside:
          'A project board for the turn season: every unit with its status, owner, day of the twelve-day turn and next step, tied to the property it belongs to.',
      },
      {
        module: 'playbook',
        description: 'Your SOPs and process documentation.',
        inside: 'A procedure with its steps, owner and version, found the way you would ask a colleague: Oppie answers from the manual and opens the page.',
      },
      {
        module: 'university',
        description: 'Training for your team.',
        inside: 'A course path for a new team member: the articles in order, the one up next with its knowledge check, progress, and what is due this week.',
      },
      {
        module: 'compass',
        description: 'Running the business on EOS.',
        inside: "The weekly scorecard and this Period's Rocks on the morning before the leadership meeting, every number scored against its goal.",
      },
    ],
    lookInsideLabel: 'Look inside',
    insideHeading: 'Inside {module}',
    oppieTitle: 'Oppie knows all of it.',
    oppieDetail: 'Ask anything in plain English.',
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

const proof = section({
  label: 'Proof',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160, headline: true }),
    body: rich('Body'),
    stats: list('Stats', 'Stat', { value: text('Value', { max: 30 }), label: text('Label', { max: 80 }) }, { min: 1, max: 6 }),
  },
  seed: {
    eyebrow: '',
    headline: 'Not a demo. A daily operating system.',
    body: textToRich(
      'Opero was built inside Oxford Companies, a commercial and residential property management firm in Ann Arbor, where it runs the business every day: leasing, property management, facilities, projects, training, meetings. Seventy-plus people work in it. Six figures of annual software spend, replaced. Every feature exists because an operator needed it.',
    ),
    stats: [
      { value: '70+', label: 'People work in it daily' },
      { value: 'Six figures', label: 'Annual software spend replaced' },
      { value: 'Every day', label: 'Running a real portfolio, live' },
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
      "Opero isn't a concept. It runs Oxford Companies, a commercial and residential property management firm in Ann Arbor, every day: leasing, property management, facilities, projects, training, and meetings. Now we're opening it to a small group of firms as {partners}.\n\nFor twelve months you work directly with the team that built it, shaping the platform around how your firm actually operates, at preferred founding terms. You get the platform early, and a real say in where it goes.",
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
    "The top of the page, in the founder's voice. The public Founder page shows the same headline, photo, name, role, and LinkedIn icon, so an edit here changes both.",
  draftCopy: true,
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 120, headline: true }),
    name: text('Signed by', { max: 80 }),
    role: text('Role', { max: 80 }),
    linkedin: link('LinkedIn profile', { optional: true, hint: 'Shown as the LinkedIn icon beside your name. Leave it empty to hide the icon.' }),
    description: text('Search and share description', { max: 200, multiline: true, hint: 'Shown in search results and link previews.' }),
  },
  seed: {
    eyebrow: 'Investor Hub',
    headline: 'I lived the problem. Then I built the solution.',
    name: 'Joe Mifsud',
    role: 'Founder',
    linkedin: 'https://www.linkedin.com/in/joseph-mifsud-b7481217/',
    description: 'Twenty-five years in property management, the problem it showed, and the platform built to solve it.',
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
    solutionBody: 'Opero: one platform built around a core CRM, with Oppie, the AI assistant, in every step. It runs Oxford Companies every day.',
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
    todayBody: 'Seventy-plus people at Oxford Companies work in it every day, and it has replaced six figures of annual software spend.',
    nextLabel: 'Next',
    nextTitle: 'The commercial release',
    nextBody: 'The same system, for operators who did not build it, starting with a small group of {partners}.',
  },
});

const areaLines = 'One per line.';

const investorsPlatform = section({
  label: 'Today and on deck',
  description:
    "What runs at Oxford today against what the new build adds, area by area, from the investor room's capability table. The counts on the page are worked out from these lists.",
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
        today: text('Running at Oxford today', { max: 1200, multiline: true, hint: areaLines }),
        extended: text('Running today, extended in the new build', { optional: true, max: 1200, multiline: true, hint: areaLines }),
        next: text('New in the new build', { optional: true, max: 1200, multiline: true, hint: areaLines }),
      },
      { min: 1, max: 10 },
    ),
  },
  seed: {
    headline: "What runs at Oxford today, and what's on deck.",
    intro:
      'Described from the running system, not from a roadmap. Everything running at Oxford Companies today carries into the new build, which adds the rest.',
    todayLabel: 'Running at Oxford today',
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

const investorsContact = section({
  label: 'Contact form',
  description: 'Heading, labels, thank-you message, and the note under the form. Messages arrive in Inquiries.',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120, headline: true }),
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
    disclaimer: text('Note under the form', { max: 600, multiline: true, hint: 'Small print. Have counsel review it before the page goes live.' }),
  },
  seed: {
    headline: "Let's talk.",
    intro: 'Write to me directly. I read and answer every message myself.',
    nameLabel: 'Name',
    firmLabel: 'Firm or fund',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    messageLabel: 'Message',
    optionalLabel: '(optional)',
    submitLabel: 'Send message',
    thankYouTitle: 'Thank you.',
    thankYouBody: "I'll be in touch personally.",
    disclaimer:
      'This page is a summary for discussion purposes only. It is not an offer to sell, or a solicitation of an offer to buy, any security. Any offering will be made only to qualified investors through definitive documents.',
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
        max: 5,
        hint: `A link to ${FOUNDER_PATH} shows to visitors, and a link to ${INVESTOR_HUB_PATH} shows to guests and signed-in admins in its place, never both at once.`,
      },
    ),
    buttonLabel: text('Button label', { max: 40 }),
    buttonTarget: link('Button link', { hint: buttonTargetHint }),
  },
  seed: {
    links: [
      { label: 'Platform', href: '/#platform' },
      { label: 'Oppie', href: '/#oppie' },
      { label: '{Partners}', href: '/partners' },
      { label: 'Founder', href: FOUNDER_PATH },
      { label: 'Investor Hub', href: INVESTOR_HUB_PATH },
    ],
    buttonLabel: 'Book a demo',
    buttonTarget: DEMO_TARGET,
  },
});

const footer = section({
  label: 'Footer',
  description: 'The contact email comes from Settings.',
  fields: {
    companyName: text('Company name', { max: 80 }),
    location: text('Location', { max: 80 }),
    links: list('Links', 'Link', { label: text('Label', { max: 40 }), href: link('Link', { hint: buttonTargetHint }) }, { max: 6 }),
  },
  seed: {
    companyName: 'Operovia, Inc.',
    location: 'Ann Arbor, Michigan',
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
    'The eyebrow above the headline and the description for search results. The headline, photo, name, role, and LinkedIn are edited under Investor Hub, Introduction, and the story under Investor Hub, The story.',
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
    limitMessage: text('Too many tries message', { max: 200, hint: '{wait} becomes the time left before they can try again, up to 15 minutes.' }),
    troubleMessage: text('Server trouble message', { max: 200 }),
    helpLine: text('Lost invitation line', { max: 80 }),
    helpLinkLabel: text('Lost invitation link', { max: 40, hint: 'Opens an email to the contact address in Settings.' }),
    publicLine: text('Public site line', { max: 80 }),
    publicLinkLabel: text('Public site link', { max: 40, hint: 'Goes to the home page.' }),
    companyLine: text('Company line', { max: 80 }),
    alreadyInTitle: text('Already in: title', { max: 120, headline: true, hint: 'Shown to a guest whose browser already holds the key.' }),
    alreadyInIntro: text('Already in: line', { max: 200 }),
    alreadyInButton: text('Already in: button', { max: 40 }),
  },
  seed: {
    metaTitle: 'Welcome',
    metaDescription: 'A private door for invited guests of Opero.',
    eyebrow: 'By invitation',
    title: 'You were *invited* here.',
    intro: 'Enter the email address your invitation was sent to.',
    emailLabel: 'Email address',
    submitLabel: 'Enter',
    checkingLabel: 'Checking',
    checkingStatus: 'Checking your invitation.',
    stillCheckingStatus: 'Still checking. One moment.',
    welcomeStatus: 'Welcome. Opening Opero.',
    emptyMessage: 'Enter the email address your invitation was sent to.',
    invalidMessage: 'That does not look like a complete email address.',
    wrongMessage: 'That address did not open the door. Check the address your invitation was sent to and try again.',
    wrongHelp: 'If it should have worked, reply to your invitation and we will sort it out.',
    limitMessage: 'Too many tries for now. Please wait {wait} and try again.',
    troubleMessage: 'Something went wrong on our side. Please try again in a moment.',
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

/* ------------------------------------------------------------------------ */

export const pages = {
  home: {
    label: 'Home page',
    description: 'The main page, in seven sections.',
    path: '/',
    sections: { hero, problem, platform, oppie, proof, partner, closing },
  },
  partners: {
    label: 'Partners page',
    description: 'The page for firms applying for a founding seat.',
    path: '/partners',
    sections: { intro: partnersIntro, gets: partnersGets, asks: partnersAsks, selection: partnersSelection, apply: partnersApply },
  },
  investors: {
    label: 'Investor Hub',
    description: "The founder's story for investors, and a way to get in touch. Only guests who came through the front door and signed-in admins see it.",
    path: INVESTOR_HUB_PATH,
    sections: {
      intro: investorsIntro,
      story: investorsStory,
      next: investorsNext,
      platform: investorsPlatform,
      round: investorsRound,
      contact: investorsContact,
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
  founder: {
    label: 'Founder page',
    description:
      "The founder's introduction and story, for everyone. The headline, photo, name, role, and LinkedIn are edited under Investor Hub, Introduction, and the story under Investor Hub, The story.",
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
