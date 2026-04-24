import React, { type ReactNode } from 'react';
import OriginalContent from '@theme-original/DocItem/Content';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { useAuthState } from '../../../context/AuthContext';
import PaywallGate from '../../../components/PaywallGate';
import FreeBanner from '../../../components/FreeBanner';

type ContentProps = React.ComponentProps<typeof OriginalContent>;

/**
 * Access levels (set via MDX frontmatter `access` field):
 *   public  — anyone, no login required
 *   free    — any authenticated user (even without subscription)
 *   paid    — subscription required (default when field is omitted)
 */
export default function DocItemContent(props: ContentProps): ReactNode {
  const { frontMatter, metadata } = useDoc();
  const authState = useAuthState();
  const access = (frontMatter.access as string) ?? 'paid';

  const canAccess =
    access === 'public' ||
    (access === 'free' && (authState === 'free-account' || authState === 'paid')) ||
    (access === 'paid' && authState === 'paid');

  // While tokens are being validated, show nothing to avoid flashing paid content
  if (authState === 'checking') {
    return (
      <div style={{ padding: '3rem 1rem', color: '#a3a3a3', textAlign: 'center', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!canAccess) {
    return (
      <PaywallGate
        access={access}
        title={metadata.title}
        description={frontMatter.description as string | undefined}
      />
    );
  }

  const showBanner =
    (access === 'public' || access === 'free') && authState !== 'paid';

  return (
    <>
      {showBanner && <FreeBanner access={access as 'public' | 'free'} />}
      <OriginalContent {...props} />
    </>
  );
}
