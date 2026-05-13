/**
 * Single source of truth for the Early Access pill + popover.
 * Mirrors prof-frontend/lib/preview-status.ts — keep both in sync until
 * a shared workspace package is justified.
 */

export const PREVIEW_STATUS = {
  state: 'Early access · Shipping daily',
  gaPromise: 'Going public when our flagship courses are complete.',
  lastShipped: {
    date: '2026-05-13',
    title: 'Quiz that teaches — every wrong answer comes with an explanation.',
    href: 'https://prof.lexailabs.com/whats-new#may-13-2026',
  },
  comingNext: [
    'Adaptive quizzes — branching on misconception',
    'Tutor v2.0',
    'More company interview guides',
    'Voting board — vote for your favourite content',
  ],
  bugReportHref: 'mailto:puru@lexailabs.com?subject=Prof%20bug%20report',
} as const;
