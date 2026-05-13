import React, { type ReactNode } from 'react';
import OriginalDocRootLayout from '@theme-original/DocRoot/Layout';
import SectionBar from '@site/src/components/SectionBar';
import ReadingProgress from '@site/src/components/ReadingProgress';

export default function DocRootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <>
      <ReadingProgress />
      <SectionBar />
      <OriginalDocRootLayout>{children}</OriginalDocRootLayout>
    </>
  );
}
