import React, {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useMemo,
} from 'react';
import clsx from 'clsx';
import {
  ThemeClassNames,
  useThemeConfig,
  usePrevious,
  Collapsible,
  useCollapsible,
} from '@docusaurus/theme-common';
import { isSamePath } from '@docusaurus/theme-common/internal';
import {
  isActiveSidebarItem,
  findFirstSidebarItemLink,
  useDocSidebarItemsExpandedState,
  useVisibleSidebarItems,
} from '@docusaurus/plugin-content-docs/client';
import Link from '@docusaurus/Link';
import { translate } from '@docusaurus/Translate';
import useIsBrowser from '@docusaurus/useIsBrowser';
import DocSidebarItems from '@theme/DocSidebarItems';
import DocSidebarItemLink from '@theme/DocSidebarItem/Link';
import SidebarIcon from '@site/src/theme/DocSidebarItem/SidebarIcon';
import type { Props } from '@theme/DocSidebarItem/Category';
import type {
  PropSidebarItemCategory,
  PropSidebarItemLink,
  PropSidebarItem,
} from '@docusaurus/plugin-content-docs';
import { useProgress, type ProgressStatus } from '@site/src/context/ProgressContext';

import styles from './styles.module.css';

// Recursively collect all lesson hrefs from category items
function collectLessonIds(items: PropSidebarItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.type === 'link') {
      const match = item.href?.match(/^\/courses\/(.+?)(?:\/)?$/);
      if (match) ids.push(match[1]);
    } else if (item.type === 'category') {
      ids.push(...collectLessonIds(item.items));
    }
  }
  return ids;
}

const CIRCUMFERENCE = 2 * Math.PI * 7; // r=7 → ~44

function CourseProgressRing({
  items,
}: {
  items: PropSidebarItem[];
}): ReactNode {
  const { progress } = useProgress();
  const lessonIds = useMemo(() => collectLessonIds(items), [items]);

  if (lessonIds.length === 0) return null;

  const done = lessonIds.filter(
    (id) => progress[id] === 'READ' || progress[id] === 'MASTERED',
  ).length;
  const total = lessonIds.length;
  const pct = done / total;
  const offset = CIRCUMFERENCE * (1 - pct);

  if (done === 0) return null;

  return (
    <span className={styles.progressRing} aria-label={`${done} of ${total} lessons complete`}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        {/* Track */}
        <circle cx="9" cy="9" r="7" stroke="var(--ifm-color-emphasis-200)" strokeWidth="2" fill="none" />
        {/* Arc — rotated so it starts at top */}
        <circle
          cx="9"
          cy="9"
          r="7"
          stroke="#FF6B6B"
          strokeWidth="2"
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '9px 9px' }}
        />
      </svg>
      <span className={styles.progressRingCount}>{done}/{total}</span>
    </span>
  );
}

function useAutoExpandActiveCategory({
  isActive,
  collapsed,
  updateCollapsed,
  activePath,
}: {
  isActive: boolean;
  collapsed: boolean;
  updateCollapsed: (b: boolean) => void;
  activePath: string;
}) {
  const wasActive = usePrevious(isActive);
  const previousActivePath = usePrevious(activePath);
  useEffect(() => {
    const justBecameActive = isActive && !wasActive;
    const stillActiveButPathChanged =
      isActive && wasActive && activePath !== previousActivePath;
    if ((justBecameActive || stillActiveButPathChanged) && collapsed) {
      updateCollapsed(false);
    }
  }, [isActive, wasActive, collapsed, updateCollapsed, activePath, previousActivePath]);
}

function useCategoryHrefWithSSRFallback(
  item: Props['item'],
): string | undefined {
  const isBrowser = useIsBrowser();
  return useMemo(() => {
    if (item.href && !item.linkUnlisted) {
      return item.href;
    }
    if (isBrowser || !item.collapsible) {
      return undefined;
    }
    return findFirstSidebarItemLink(item);
  }, [item, isBrowser]);
}

function CollapseButton({
  collapsed,
  categoryLabel,
  onClick,
}: {
  collapsed: boolean;
  categoryLabel: string;
  onClick: ComponentProps<'button'>['onClick'];
}) {
  return (
    <button
      aria-label={
        collapsed
          ? translate(
              {
                id: 'theme.DocSidebarItem.expandCategoryAriaLabel',
                message: "Expand sidebar category '{label}'",
                description: 'The ARIA label to expand the sidebar category',
              },
              { label: categoryLabel },
            )
          : translate(
              {
                id: 'theme.DocSidebarItem.collapseCategoryAriaLabel',
                message: "Collapse sidebar category '{label}'",
                description: 'The ARIA label to collapse the sidebar category',
              },
              { label: categoryLabel },
            )
      }
      aria-expanded={!collapsed}
      type="button"
      className="clean-btn menu__caret"
      onClick={onClick}
    />
  );
}

function CategoryLinkLabel({ label }: { label: string }) {
  return (
    <span title={label} className={styles.categoryLinkLabel}>
      {label}
    </span>
  );
}

export default function DocSidebarItemCategory(props: Props): ReactNode {
  const visibleChildren = useVisibleSidebarItems(
    props.item.items,
    props.activePath,
  );
  if (visibleChildren.length === 0) {
    return <DocSidebarItemCategoryEmpty {...props} />;
  } else {
    return <DocSidebarItemCategoryCollapsible {...props} />;
  }
}

function isCategoryWithHref(
  category: PropSidebarItemCategory,
): category is PropSidebarItemCategory & { href: string } {
  return typeof category.href === 'string';
}

function DocSidebarItemCategoryEmpty({ item, ...props }: Props): ReactNode {
  if (!isCategoryWithHref(item)) {
    return null;
  }
  const {
    type,
    collapsed,
    collapsible,
    items,
    linkUnlisted,
    ...forwardableProps
  } = item;
  const linkItem: PropSidebarItemLink = {
    type: 'link',
    ...forwardableProps,
  };
  return <DocSidebarItemLink item={linkItem} {...props} />;
}

function DocSidebarItemCategoryCollapsible({
  item,
  onItemClick,
  activePath,
  level,
  index,
  ...props
}: Props): ReactNode {
  const { items, label, collapsible, className, href, customProps } = item;
  const iconName = (customProps as { icon?: string } | undefined)?.icon;
  const {
    docs: {
      sidebar: { autoCollapseCategories },
    },
  } = useThemeConfig();
  const hrefWithSSRFallback = useCategoryHrefWithSSRFallback(item);

  const isActive = isActiveSidebarItem(item, activePath);
  const isCurrentPage = isSamePath(href, activePath);

  const { collapsed, setCollapsed } = useCollapsible({
    initialState: () => {
      if (!collapsible) {
        return false;
      }
      return isActive ? false : item.collapsed;
    },
  });

  const { expandedItem, setExpandedItem } = useDocSidebarItemsExpandedState();
  const updateCollapsed = (toCollapsed: boolean = !collapsed) => {
    setExpandedItem(toCollapsed ? null : index);
    setCollapsed(toCollapsed);
  };
  useAutoExpandActiveCategory({
    isActive,
    collapsed,
    updateCollapsed,
    activePath,
  });
  useEffect(() => {
    if (
      collapsible &&
      expandedItem != null &&
      expandedItem !== index &&
      autoCollapseCategories
    ) {
      setCollapsed(true);
    }
  }, [collapsible, expandedItem, index, setCollapsed, autoCollapseCategories]);

  const handleItemClick: ComponentProps<'a'>['onClick'] = (e) => {
    onItemClick?.(item);
    if (collapsible) {
      if (href) {
        if (isCurrentPage) {
          e.preventDefault();
          updateCollapsed();
        } else {
          updateCollapsed(false);
        }
      } else {
        e.preventDefault();
        updateCollapsed();
      }
    }
  };

  const isCourse = className === 'sidebar-course';

  return (
    <li
      className={clsx(
        ThemeClassNames.docs.docSidebarItemCategory,
        ThemeClassNames.docs.docSidebarItemCategoryLevel(level),
        'menu__list-item',
        {
          'menu__list-item--collapsed': collapsed,
        },
        className,
      )}>
      <div
        className={clsx('menu__list-item-collapsible', {
          'menu__list-item-collapsible--active': isCurrentPage,
        })}>
        <Link
          className={clsx(styles.categoryLink, 'menu__link', {
            'menu__link--sublist': collapsible,
            'menu__link--sublist-caret': !href && collapsible,
            'menu__link--active': isActive,
          })}
          onClick={handleItemClick}
          aria-current={isCurrentPage ? 'page' : undefined}
          role={collapsible && !href ? 'button' : undefined}
          aria-expanded={collapsible && !href ? !collapsed : undefined}
          href={collapsible ? hrefWithSSRFallback ?? '#' : hrefWithSSRFallback}
          {...props}>
          <SidebarIcon name={iconName} className={styles.sidebarIcon} />
          <CategoryLinkLabel label={label} />
          {isCourse && <CourseProgressRing items={items} />}
        </Link>
        {href && collapsible && (
          <CollapseButton
            collapsed={collapsed}
            categoryLabel={label}
            onClick={(e) => {
              e.preventDefault();
              updateCollapsed();
            }}
          />
        )}
      </div>

      <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
        <DocSidebarItems
          items={items}
          tabIndex={collapsed ? -1 : 0}
          onItemClick={onItemClick}
          activePath={activePath}
          level={level + 1}
        />
      </Collapsible>
    </li>
  );
}
