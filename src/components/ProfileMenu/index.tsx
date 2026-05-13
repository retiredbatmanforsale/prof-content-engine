import React, { useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { UserCircle, Shield, LogOut, CreditCard } from 'lucide-react';
import { useAuthState } from '@site/src/context/AuthContext';
import {
  getCurrentUser,
  signOut,
  userInitial,
  type UserInfo,
} from '@site/src/lib/userInfo';
import PixelButton from '@site/src/components/PixelButton';
import styles from './styles.module.css';

export default function ProfileMenu() {
  const { siteConfig } = useDocusaurusContext();
  const mainPlatformUrl =
    (siteConfig.customFields?.mainPlatformUrl as string) ||
    'https://prof.lexailabs.com';
  const authState = useAuthState();

  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Re-read user info whenever auth state changes (e.g. after refresh, sign-in)
  useEffect(() => {
    setUser(getCurrentUser());
  }, [authState]);

  // Click-outside + Escape close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  // SSR / pre-hydration → render nothing to avoid flash
  if (authState === 'checking') return null;

  // ── Anonymous: PixelButton with slide-up reveal ─────────────────────
  if (authState === 'anonymous' || !user) {
    return (
      <PixelButton
        label="Sign in"
        href={`${mainPlatformUrl}/login`}
        ariaLabel="Sign in"
        size="sm"
      />
    );
  }

  // ── Signed-in: avatar + dropdown ────────────────────────────────────
  const isAdmin = user.role === 'ADMIN';
  const subscriptionHref = user.hasAccess
    ? `${mainPlatformUrl}/account`
    : `${mainPlatformUrl}/subscribe`;
  const subscriptionLabel = user.hasAccess ? 'Manage subscription' : 'Subscribe';

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={styles.avatar}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarInitial}>{userInitial(user)}</span>
        )}
      </button>

      <div
        className={`${styles.popover} ${open ? styles.popoverOpen : ''}`}
        role="menu"
        aria-label="Profile menu"
      >
        {/* Identity header */}
        <div className={styles.identity}>
          <p className={styles.identityName}>{user.name ?? 'Signed in'}</p>
          {user.email && <p className={styles.identityEmail}>{user.email}</p>}
        </div>

        <div className={styles.divider} />

        <a
          href={`${mainPlatformUrl}/account`}
          className={styles.menuItem}
          role="menuitem"
        >
          <UserCircle size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Account</span>
        </a>

        <a
          href={subscriptionHref}
          className={styles.menuItem}
          role="menuitem"
        >
          <CreditCard size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{subscriptionLabel}</span>
        </a>

        {isAdmin && (
          <a
            href={`${mainPlatformUrl}/admin`}
            className={styles.menuItem}
            role="menuitem"
          >
            <Shield size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>Admin panel</span>
          </a>
        )}

        <div className={styles.divider} />

        <button
          type="button"
          onClick={() => signOut(`${mainPlatformUrl}/`)}
          className={styles.menuItem}
          role="menuitem"
        >
          <LogOut size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
