import React, { type ReactNode } from 'react';
import OriginalDocRootLayout from '@theme-original/DocRoot/Layout';
import SectionBar from '@site/src/components/SectionBar';

export default function DocRootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      <SectionBar />
      <OriginalDocRootLayout>{children}</OriginalDocRootLayout>
    </>
  );
}
