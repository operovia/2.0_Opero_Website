/**
 * Seed scenes for the Oppie console. The questions come from the brief; the
 * answers are invented, illustrative data for a Midwest office portfolio
 * (listed in PLACEHOLDERS.md). Edit them in the admin under Oppie console.
 */
export const seedScenes = [
  {
    question: "What's the ceiling height in Suite 200 at Horizon?",
    thinkingMs: 1100,
    answerTag: 'Horizon · Suite 200',
    answerMain: '10 ft finished ceilings',
    answerSupport: 'Second floor, 4,280 RSF, open plan with two private offices.',
    chips: ['4,280 RSF', 'Floor 2', 'Open plan', 'Available now'],
  },
  {
    question: 'Any spaces available at the Guardian Building?',
    thinkingMs: 1300,
    answerTag: 'Guardian Building · Availability',
    answerMain: '3 suites available',
    answerSupport: 'From 1,850 to 6,400 RSF across floors 9, 14, and 22.',
    chips: ['Suite 910 · 1,850 RSF', 'Suite 1400 · 6,400 RSF', 'Suite 2215 · 3,100 RSF'],
  },
  {
    question: 'Which leases expire this quarter?',
    thinkingMs: 1500,
    answerTag: 'Lease expirations · This quarter',
    answerMain: '7 leases expiring',
    answerSupport: '21,600 SF in total. The three largest tenants:',
    chips: ['Aldergrove Dental · 6,200 SF', 'Pinecrest Analytics · 4,800 SF', 'Stonebridge Legal · 3,900 SF'],
  },
];
