import { textToRich } from '@/lib/rich-text';
import { choice, link, list, rich, text, type Fields, type Values } from './fields';
import { tokenHelp } from './tokens';
import { DEMO_TARGET } from './constants';

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
    headline: text('Headline', { max: 160 }),
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
    headline: 'The AI-driven operating platform for real estate companies.',
    subhead: textToRich(
      'One system, built around a core CRM, that replaces the patchwork of disconnected apps your teams run every day, with Oppie, your AI assistant, woven into every step.',
    ),
    buttonLabel: 'Book a demo',
    buttonTarget: DEMO_TARGET,
    supportingLine: 'Built by operators inside a working commercial real estate firm. Not a software lab.',
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
    headline: text('Headline', { max: 160 }),
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
    headline: text('Headline', { max: 160 }),
    body: rich('Body'),
    coreTitle: text('Core CRM title', { max: 80 }),
    coreText: text('Core CRM description', { max: 240, multiline: true }),
    modules: list(
      'Modules',
      'Module',
      {
        module: choice('Module', moduleOptions, { hint: 'Its mark and jewel color come from the brand files.' }),
        description: text('Description', { max: 160, multiline: true }),
      },
      { min: 1, max: 5 },
    ),
    closing: text('Closing line', { max: 200 }),
  },
  seed: {
    eyebrow: 'The platform.',
    headline: 'One platform. Every department.',
    body: textToRich(
      'At the core is a CRM built for real estate: every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities. Around it, five modules run how you work. Studios for project boards and workflows. Playbook for your SOPs. University for training your team. Compass for running on EOS. And Build, where your own people create custom apps with AI, no developers required.',
    ),
    coreTitle: 'A CRM built for real estate',
    coreText: 'Every property, suite, tenant, and prospect in one place, driving leasing, property management, and facilities.',
    modules: [
      { module: 'build', description: 'Your own people create custom apps with AI, no developers required.' },
      { module: 'studios', description: 'Project boards and workflows.' },
      { module: 'playbook', description: 'Your SOPs and process documentation.' },
      { module: 'university', description: 'Training for your team.' },
      { module: 'compass', description: 'Running the business on EOS.' },
    ],
    closing: 'And woven through all of it, Oppie.',
  },
});

const oppie = section({
  label: 'Oppie',
  fields: {
    eyebrow: text('Eyebrow', { optional: true, max: 60 }),
    headline: text('Headline', { max: 160 }),
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
    headline: text('Headline', { max: 160 }),
    body: rich('Body'),
    stats: list('Stats', 'Stat', { value: text('Value', { max: 30 }), label: text('Label', { max: 80 }) }, { min: 1, max: 6 }),
  },
  seed: {
    eyebrow: '',
    headline: 'Not a demo. A daily operating system.',
    body: textToRich(
      'Opero was built inside Oxford Companies, a commercial and residential real estate firm in Ann Arbor, where it runs the business every day: leasing, property management, facilities, projects, training, meetings. Seventy-plus people work in it. Six figures of annual software spend, replaced. Every feature exists because an operator needed it.',
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
    headline: text('Headline', { max: 160, hint: tokenHelp }),
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
    headline: text('Headline', { max: 160 }),
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
    headline: text('Headline', { max: 160, hint: tokenHelp }),
    body: rich('Body', { hint: tokenHelp }),
  },
  seed: {
    eyebrow: 'For owner-operators and property managers',
    headline: 'Become a {partner}.',
    body: textToRich(
      "Opero isn't a concept. It runs Oxford Companies, a commercial and residential real estate firm in Ann Arbor, every day: leasing, property management, facilities, projects, training, and meetings. Now we're opening it to a small group of firms as {partners}.\n\nFor twelve months you work directly with the team that built it, shaping the platform around how your firm actually operates, at preferred founding terms. You get the platform early, and a real say in where it goes.",
    ),
  },
});

const partnersGets = section({
  label: 'What you get',
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120 }),
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
    headline: text('Headline', { max: 120 }),
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
    headline: text('Headline', { max: 120 }),
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
    headline: text('Headline', { max: 120 }),
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
/* Privacy                                                                  */
/* ------------------------------------------------------------------------ */

const privacyNotice = section({
  label: 'Privacy notice',
  description: tokenHelp,
  draftCopy: true,
  fields: {
    headline: text('Headline', { max: 120 }),
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
          'When you request a demo or apply to become a {partner}, we collect what you enter in the form: your name, firm, role, email address, and phone number, plus anything else you choose to share, such as your portfolio size and the systems you use today. We use it to respond to you and to consider your application.',
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
    links: list('Navigation links', 'Link', { label: text('Label', { max: 40, hint: tokenHelp }), href: link('Link', { hint: buttonTargetHint }) }, { max: 5 }),
    buttonLabel: text('Button label', { max: 40 }),
    buttonTarget: link('Button link', { hint: buttonTargetHint }),
  },
  seed: {
    links: [
      { label: 'Platform', href: '/#platform' },
      { label: 'Oppie', href: '/#oppie' },
      { label: '{Partners}', href: '/partners' },
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
    headline: text('Headline', { max: 120 }),
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
    headline: text('Headline', { max: 120 }),
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
