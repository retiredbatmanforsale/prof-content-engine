/**
 * Single source of truth for the Early Access pill + popover.
 * Mirrors prof-frontend/lib/preview-status.ts — keep both in sync until
 * a shared workspace package is justified.
 */

export const PREVIEW_STATUS = {
  state: 'Early access · Shipping daily',
  lastShipped: {
    date: '2026-05-13',
    title: 'Quiz that teaches — every wrong answer comes with an explanation.',
    // Relative path — the pill component prepends `mainPlatformUrl` from
    // Docusaurus config at runtime so it works in both dev and prod.
    href: '/whats-new#may-13-2026',
  },
  comingNext: [
    'Adaptive quizzes — branching on misconception',
    'Tutor v2.0',
    'More company interview guides',
    'Voting board — vote for your favourite content',
  ],
  bugReportHref: 'mailto:help@lexailabs.com?subject=Prof%20%E2%80%94%20feedback%20or%20bug',
  bugReportLabel: 'Request a feature or report a bug',
} as const;
