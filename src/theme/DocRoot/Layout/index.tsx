import React, { type ReactNode } from 'react';
import OriginalDocRootLayout from '@theme-original/DocRoot/Layout';
import { useLocation } from '@docusaurus/router';

interface Props {
  children: ReactNode;
}

/**
 * Practice problems default to the LeetCode-style IDE layout (no sidebar,
 * full-bleed dark background). The 4 unmigrated originals stay on the old
 * doc-chrome layout and are listed in the denylist below.
 *
 * Note: the practice intro page also stays on the standard layout — it's a
 * listing, not a problem.
 */
const OLD_LAYOUT_SLUGS = new Set([
  'intro',
  'scaled-dot-product-attention',
  'bpe-apply-merges',
  'top-p-sampling',
  'cross-entropy-gradient',
]);

function isPracticeIdeRoute(pathname: string): boolean {
  const match = pathname.match(/\/courses\/practice\/(.+?)\/?$/);
  if (!match) return false;
  return !OLD_LAYOUT_SLUGS.has(match[1]);
}

export default function DocRootLayout({ children }: Props): ReactNode {
  const location = useLocation();

  if (isPracticeIdeRoute(location.pathname)) {
    return (
      <div
        style={{
          background: '#020617',
          minHeight: 'calc(100vh - var(--ifm-navbar-height, 60px))',
          width: '100%',
        }}
      >
        {children}
      </div>
    );
  }

  return <OriginalDocRootLayout>{children}</OriginalDocRootLayout>;
}
