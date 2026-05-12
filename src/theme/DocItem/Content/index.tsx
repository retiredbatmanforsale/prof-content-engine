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

  // SSR + pre-hydration: render full content so the search indexer + crawlers
  // see real markup. After client-side auth resolves to 'anonymous'/'free-account',
  // the PaywallGate kicks in below for non-accessible content. This is the
  // standard server-rendered paywall pattern (Substack / Medium / NYT).
  if (authState === 'checking') {
    return <OriginalContent {...props} />;
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
