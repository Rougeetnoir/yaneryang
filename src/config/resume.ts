/**
 * Résumé content, transcribed from
 * Yaner_Yang_Resume_US_gap_updated_20260721.docx (confirmed 2026-07-21).
 *
 * Quantified figures are load-bearing — 75%, $200M+, 50+ accounts, zero
 * unreconciled balances, 3/204. Do not soften them when editing copy.
 *
 * Employment dates here must stay in step with the PDF *and* with LinkedIn
 * (linkedin.com/in/yangyaner). The site links all three together via the
 * `sameAs` field in the Person schema, so a mismatch is visible in one click.
 */

/** Mirrors the SUMMARY block at the top of the PDF. */
export const summary = [
  'Accountant with 8+ years of general ledger and financial reporting experience (US GAAP), including month-end close, reconciliations, and ERP migrations.',
  'Advanced Excel (PivotTables, XLOOKUP, Power Query) with working knowledge of Python and SQL; quick learner and detail-oriented.',
  'Authorized to work in the U.S.; available to start immediately.',
] as const;

/**
 * Path to the downloadable PDF in `public/`, or null to hide the download
 * button entirely.
 *
 * PENDING A DECISION: the source PDF carries a personal phone number. Publishing
 * it invites scrapers. Recommendation is to add a phone-free variant instead and
 * keep email + LinkedIn as the contact route.
 */
export const resumePdf: string | null = null;

export const experience = [
  {
    company: 'General Electric',
    location: 'Shanghai, China',
    title: 'General Ledger Advanced Accountant',
    period: 'August 2018 — August 2024',
    bullets: [
      'Led an end-to-end general ledger migration from Oracle CCL to Oracle RACES, working across finance, IT, and project teams on data mapping, validation, and cleansing. Ran UAT to keep workflows aligned as business needs shifted mid-project.',
      'Integrated renewables wind projects and service contracts into the Oracle project module, making operating expenses, cost drivers, and project-level performance individually visible. Automation here cut cost accrual and revenue recognition processing time by 75%.',
      'Owned the general ledger for the Australia Wind division — 10+ large-scale onshore wind projects with $200M+ in contract value. Ensured ASC 606 compliance for revenue recognition and accurate cost allocation against operational plans.',
      'Supported FP&A with monthly forecasts, budgets, and variance analysis reported to management under tight deadlines.',
      'Moved the close from quarterly to monthly through process redesign, consistently hitting LCD+1 for the project module and LCD+2 for trial balances.',
      'Maintained 50+ reconciliation accounts with zero unreconciled balances straight through the system transition.',
      'Designed the technical approach for physical inventory management in the Japan warehouses, including automated reporting for forecasting and cost visibility.',
    ],
  },
  {
    company: 'General Electric',
    location: 'Shanghai, China',
    title: 'General Ledger Accountant',
    period: 'July 2016 — July 2018',
    bullets: [
      'Ran general ledger operations across the Mongolia, Thailand, and Vietnam ledgers — monthly closes and quarterly reconciliations, with zero unreconciled balances.',
      'Partnered with the Bank, AR, AP, Payroll, and Fixed Assets sub-ledger teams on data integrity and US GAAP compliance.',
      'Supported audits by preparing documentation and turning around auditor queries quickly.',
      'Built automated Excel templates for financial reporting that shortened the path from data to decision.',
      'Wrote the SOPs used during work transitions so handovers did not lose institutional knowledge.',
    ],
  },
] as const;

/**
 * The current period, framed as the résumé frames it — a career break, not
 * employment. Rendered ABOVE the GE roles on the résumé page, since it is the
 * most recent entry. The projects give it evidence a résumé bullet cannot.
 */
export const currentPeriod = {
  company: 'Relocation & Professional Development',
  location: 'United States',
  title: 'Career Break / Work Authorization & Professional Development',
  period: 'September 2024 — Present',
  bullets: [
    'Relocated from China to the U.S. and completed the work authorization process; available to start immediately.',
    'Upskilled in data and reporting tools — Python and SQL for data cleaning, analysis, and reporting automation — while staying current with accounting knowledge.',
    'Maintained Excel-based bookkeeping for household spending, including categorised entries, monthly summaries, and variance tracking.',
    'Built and shipped several working applications, each with a written spec and a phased plan: a multi-bank statement processor in Python, a local-first iOS journal in React Native, and smaller learning tools.',
  ],
} as const;

export const education = [
  {
    school: 'Sun Yat-Sen University',
    detail: 'International School of Business & Finance',
    location: 'Guangzhou, China',
    degree: 'Bachelor of Economics, Finance',
    period: 'September 2012 — June 2016',
    notes: [
      'GPA 3.9/4.0 — ranked 3rd of 204',
      'National Scholarship — ranked 1st of 367',
      'First-Class Scholarship of Sun Yat-Sen University, two consecutive years',
      'AEON Scholarship — top 1%',
    ],
  },
  {
    school: 'National Taiwan University',
    detail: 'College of Management',
    location: 'Taipei, Taiwan',
    degree: 'Exchange student, Finance',
    period: 'September 2014 — February 2015',
    notes: [
      'GPA 3.9/4.0',
      'Xian Weijian Outstanding Undergraduate Overseas Study Scholarship, First Prize',
    ],
  },
] as const;

export const skills = [
  {
    label: 'Finance & accounting',
    items: [
      'Financial planning & analysis',
      'Variance analysis',
      'US GAAP',
      'ASC 606 revenue recognition',
      'SOX / internal control documentation',
    ],
  },
  {
    label: 'ERP & finance systems',
    items: ['Oracle Fusion ERP (RACES)', 'Oracle CCL', 'SAP', 'QuickBooks'],
  },
  {
    label: 'Data & automation',
    items: [
      'Excel — PivotTables, XLOOKUP, Power Query',
      'Python',
      'SQL',
      'pandas',
      'Reporting automation',
    ],
  },
  {
    label: 'Building',
    items: ['TypeScript', 'React', 'React Native / Expo', 'SQLite', 'Astro'],
  },
  {
    label: 'Languages',
    items: ['Mandarin (native)', 'English (fluent)'],
  },
] as const;
