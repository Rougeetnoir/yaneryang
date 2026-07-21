/**
 * Single source of truth for identity and positioning copy.
 *
 * Target roles are deliberately still open (Financial Systems / ERP Analyst,
 * technical FP&A, Product / Data). Retargeting the site at one of them should be
 * an edit to THIS FILE ONLY — never a hunt through page markup.
 */

export const site = {
  name: 'Yaner Yang',
  /** Used in <title> suffix and structured data. */
  jobTitle: 'Finance Systems & Automation',
  url: 'https://yaneryang.pages.dev',
  locale: 'en',

  /** Hero. Keep the headline under ~60 characters so it holds one line on desktop. */
  headline: 'Finance systems, built by someone who lived in them.',
  subheadline:
    'Five years of general ledger and ERP work at GE — Oracle migrations, ASC 606 revenue recognition, $200M+ renewables projects. Now I build the automation I used to file tickets for.',

  /** One-sentence description for meta tags and social cards. */
  description:
    'Accountant turned builder. Five years of GL and ERP work at GE, now building finance automation, learning tools, and mobile apps in Python and TypeScript.',

  /**
   * The three-beat argument the whole site is making. Rendered on the home page.
   * This is what a portfolio can say that a LinkedIn profile structurally cannot.
   */
  pillars: [
    {
      title: 'I know where the numbers come from',
      body: 'Five years owning general ledgers across Australia, Mongolia, Thailand and Vietnam. Led an Oracle CCL to RACES migration end to end — data mapping, validation, cleansing, UAT. Closed 50+ reconciliation accounts with zero unreconciled balances straight through a system transition.',
    },
    {
      title: 'I build the tools instead of requesting them',
      body: 'At GE, automating cost accrual and revenue recognition cut processing time by 75%. That instinct did not switch off when I left. I now write the software myself — Python for finance pipelines, TypeScript and React for interfaces, SQLite for local-first apps.',
    },
    {
      title: 'I work with AI deliberately, not casually',
      body: 'Every project here ships with a written spec, a phased plan, and conventions the model has to follow. The interesting part is not that AI writes code — it is what has to be true about your thinking before it writes the right code.',
    },
  ],

  contact: {
    email: 'yangyaner1@gmail.com',
    github: 'https://github.com/Rougeetnoir',
    // TODO: confirm the LinkedIn URL with Yaner before launch.
    linkedin: '',
  },

  nav: [
    { label: 'Projects', href: '/projects' },
    { label: 'Writing', href: '/writing' },
    { label: 'Résumé', href: '/resume' },
    { label: 'Now', href: '/now' },
  ],
} as const;

export type Site = typeof site;
