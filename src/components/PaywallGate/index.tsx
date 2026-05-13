import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAuthState } from '../../context/AuthContext';
import PixelButton from '@site/src/components/PixelButton';
import styles from './styles.module.css';

type Props = {
  access: string;
  title: string;
  description?: string;
};

function LockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function PaywallGate({ access, title, description }: Props) {
  const { siteConfig } = useDocusaurusContext();
  const mainPlatformUrl = (siteConfig.customFields?.mainPlatformUrl as string) || '';
  const authState = useAuthState();

  const isAnonymous = authState === 'anonymous';
  const isFreeAccount = authState === 'free-account';

  const headline = access === 'free'
    ? 'Create a free account to continue'
    : isFreeAccount
      ? 'Subscribe to unlock this lesson'
      : 'Sign in or subscribe to continue';

  const subtext = isFreeAccount
    ? 'You have a free account. Subscribe to get full access to every lesson.'
    : 'This lesson is part of a paid course. Create a free account or subscribe to access it.';

  const primaryHref = isFreeAccount
    ? `${mainPlatformUrl}/subscribe`
    : `${mainPlatformUrl}/login?tab=register`;

  const primaryLabel = isFreeAccount
    ? 'Subscribe — from ₹1,667/mo'
    : access === 'free'
      ? 'Create free account'
      : 'Get started free';

  const secondaryHref = `${mainPlatformUrl}/login`;
  const showSecondary = isAnonymous;

  return (
    <div className={styles.gate}>
      <div className={styles.card}>
        <div className={styles.lockIcon}>
          <LockIcon />
        </div>

        <div className={styles.meta}>
          <p className={styles.lessonLabel}>This lesson</p>
          <h2 className={styles.title}>{title}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>

        <div className={styles.divider} />

        <p className={styles.headline}>{headline}</p>
        <p className={styles.subtext}>{subtext}</p>

        <div className={styles.actions}>
          <PixelButton label={primaryLabel} href={primaryHref} />
          {showSecondary && (
            <Link href={secondaryHref} className={styles.secondaryBtn}>
              Sign in
            </Link>
          )}
        </div>

        {isFreeAccount && (
          <>
            <p className={styles.fineprint}>*billed annually. Monthly and quarterly plans also available.</p>
            <p className={styles.plans}>
              <Link href={`${mainPlatformUrl}/subscribe`} className={styles.plansLink}>
                View all plans →
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
