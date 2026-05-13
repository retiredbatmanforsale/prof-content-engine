import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { isActiveSidebarItem } from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import isInternalUrl from '@docusaurus/isInternalUrl';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type { Props } from '@theme/DocSidebarItem/Link';
import { useProgress, type ProgressStatus } from '@site/src/context/ProgressContext';
import SidebarIcon from '@site/src/theme/DocSidebarItem/SidebarIcon';

import styles from './styles.module.css';

function ProgressIcon({ status }: { status: ProgressStatus | undefined }): ReactNode {
  if (!status) return null;

  if (status === 'IN_PROGRESS') {
    return (
      <span className={styles.progressIcon} aria-label="In progress">
        <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
          <circle cx="3.5" cy="3.5" r="3.5" fill="#F59E0B" />
        </svg>
      </span>
    );
  }

  if (status === 'READ') {
    return (
      <span className={styles.progressIcon} aria-label="Read">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === 'MASTERED') {
    return (
      <span className={styles.progressIcon} aria-label="Mastered">
        <svg width="11" height="10" viewBox="0 0 11 10" fill="none">
          <path d="M5.5 0.5L6.796 3.629L10.163 3.927L7.6 6.121L8.427 9.395L5.5 7.6L2.573 9.395L3.4 6.121L0.837 3.927L4.204 3.629L5.5 0.5Z" fill="#F59E0B" />
        </svg>
      </span>
    );
  }

  return null;
}

function hrefToLessonId(href: string): string | null {
  // Convert /courses/ai-for-engineering/deep-neural-networks/intro → ai-for-engineering/deep-neural-networks/intro
  const match = href.match(/^\/courses\/(.+?)(?:\/)?$/);
  return match ? match[1] : null;
}

export default function DocSidebarItemLink({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const { href, label, className, autoAddBaseUrl, customProps } = item;
  const isActive = isActiveSidebarItem(item, activePath);
  const isInternalLink = isInternalUrl(href);

  const { progress } = useProgress();
  const lessonId = isInternalLink ? hrefToLessonId(href) : null;
  const status = lessonId ? progress[lessonId] : undefined;
  const iconName = (customProps as { icon?: string } | undefined)?.icon;

  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemLink,
        ThemeClassNames.docs.docSidebarItemLinkLevel(level),
        'menu__list-item',
        className,
      )}
      key={label}>
      <Link
        className={clsx(
          'menu__link',
          !isInternalLink && styles.menuExternalLink,
          {
            'menu__link--active': isActive,
          },
        )}
        autoAddBaseUrl={autoAddBaseUrl}
        aria-current={isActive ? 'page' : undefined}
        to={href}
        {...(isInternalLink && {
          onClick: onItemClick ? () => onItemClick(item) : undefined,
        })}
        {...props}>
        <SidebarIcon name={iconName} className={styles.sidebarIcon} />
        <ProgressIcon status={status} />
        <span title={label} className={styles.linkLabel}>
          {label}
        </span>
        {!isInternalLink && <IconExternalLink />}
      </Link>
    </li>
  );
}
