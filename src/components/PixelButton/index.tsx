import React, { type MouseEventHandler, type ReactNode } from 'react';
import styles from './styles.module.css';

type PixelButtonProps = {
  label: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
  // Open href in a new tab. Ignored when onClick is used.
  external?: boolean;
};

function PixelArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d="M4 10 L10 4" />
      <path d="M6 4 L10 4 L10 8" />
    </svg>
  );
}

export default function PixelButton({
  label,
  href,
  onClick,
  icon,
  className,
  ariaLabel,
  external,
}: PixelButtonProps) {
  const glyph = icon ?? <PixelArrow />;
  const classes = `${styles.button}${className ? ` ${className}` : ''}`;

  const inner = (
    <>
      <span className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.icon}>{glyph}</span>
      </span>
      <span className={styles.content} aria-hidden="true">
        <span className={styles.label}>{label}</span>
        <span className={styles.icon}>{glyph}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        onClick={onClick as MouseEventHandler<HTMLAnchorElement>}
        {...(external
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={ariaLabel}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
    >
      {inner}
    </button>
  );
}
