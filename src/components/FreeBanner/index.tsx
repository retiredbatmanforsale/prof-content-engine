import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAuthState } from '../../context/AuthContext';
import styles from './styles.module.css';

type Props = {
  access: 'public' | 'free';
};

export default function FreeBanner({ access }: Props) {
  const { siteConfig } = useDocusaurusContext();
  const mainPlatformUrl = (siteConfig.customFields?.mainPlatformUrl as string) || '';
  const authState = useAuthState();
  const [dismissed, setDismissed] = useState(false);

  // Only show for non-paid users — no point nagging subscribers
  if (authState === 'paid' || authState === 'checking' || dismissed) return null;

  const isAnonymous = authState === 'anonymous';

  const message = access === 'free' && isAnonymous
    ? 'Sign up free to track your progress'
    : 'Free preview';

  const ctaLabel = isAnonymous ? 'Get started free →' : 'Subscribe to unlock all →';
  const ctaHref = isAnonymous
    ? `${mainPlatformUrl}/login?tab=register`
    : `${mainPlatformUrl}/subscribe`;

  return (
    <div className={styles.banner}>
      <span className={styles.badge}>Free</span>
      <span className={styles.message}>{message}</span>
      <Link href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </Link>
      <button
        className={styles.dismiss}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
