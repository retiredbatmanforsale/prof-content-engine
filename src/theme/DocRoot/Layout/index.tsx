import React, { type ReactNode } from 'react';
import OriginalDocRootLayout from '@theme-original/DocRoot/Layout';

/**
 * DocRoot is the layer that renders the doc sidebar + the doc content area.
 * We always delegate to the original — stripping it removes the sidebar AND
 * exposes a dark wrapper that flashes through on tab changes.
 *
 * Practice-page visual adjustments (collapsed sidebar, full-bleed workbench,
 * hidden breadcrumbs/TOC/footer) are driven by `body.practice-mode` CSS plus
 * a sidebar-toggle button rendered inside the workbench itself.
 */
export default function DocRootLayout({ children }: { children: ReactNode }): ReactNode {
  return <OriginalDocRootLayout>{children}</OriginalDocRootLayout>;
}
