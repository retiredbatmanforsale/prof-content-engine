import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';

const HOME_URL = 'https://prof.lexailabs.com';

type NavItem =
  | { type: 'link'; label: string; to: string }
  | { type: 'divider'; label: string };

const LEADERS_NAV: NavItem[] = [
  { type: 'link', label: 'AI for Everyone — Gen AI & use cases', to: '/courses/ai-for-leaders/genai-for-everyone/intro' },
  { type: 'link', label: 'Prompt Engineering', to: '/courses/ai-for-leaders/prompt-engineering/introduction' },
];

const ENGINEERING_NAV: NavItem[] = [
  { type: 'divider', label: 'Foundations' },
  { type: 'link', label: 'Deep Neural Networks', to: '/courses/ai-for-engineering/deep-neural-networks/intro' },
  { type: 'link', label: 'Foundations of Regression', to: '/courses/ai-for-engineering/foundations-of-regression/intro' },
  { type: 'divider', label: 'Vision & Sequences' },
  { type: 'link', label: 'Deep Computer Vision (CNN)', to: '/courses/ai-for-engineering/deep-computer-vision-cnn/intro' },
  { type: 'link', label: 'Deep Sequence Modelling (RNN)', to: '/courses/ai-for-engineering/deep-sequence-modelling-rnn/intro' },
  { type: 'divider', label: 'Transformers' },
  { type: 'link', label: 'Attention Is All You Need', to: '/courses/ai-for-engineering/attention-is-all-you-need/intro' },
  { type: 'link', label: 'Build and Train Your Own GPT-2', to: '/courses/ai-for-engineering/build-and-train-your-own-gpt2-model/intro' },
  { type: 'divider', label: 'Career' },
  { type: 'link', label: 'MLE Interview', to: '/courses/ai-for-engineering/mle-interview/intro' },
  { type: 'link', label: 'AI Research', to: '/courses/ai-for-engineering/ai-research/intro' },
];

function ChevronDown() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

type DropdownProps = {
  label: string;
  items: NavItem[];
  active: boolean;
};

function NavDropdown({ label, items, active }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={ref}
      className="prof-dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className={`prof-dropdown__trigger${active ? ' prof-dropdown__trigger--active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        type="button"
      >
        {label}
        <span className={`prof-dropdown__caret${open ? ' prof-dropdown__caret--open' : ''}`}>
          <ChevronDown />
        </span>
      </button>

      <div className={`prof-dropdown__panel${open ? ' prof-dropdown__panel--open' : ''}`} role="menu">
        {items.map((item, i) =>
          item.type === 'divider' ? (
            <span key={i} className="prof-dropdown__divider">{item.label}</span>
          ) : (
            <Link key={i} to={item.to} className="prof-dropdown__item" role="menuitem">
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

export default function NavbarContent(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const logoUrl = useBaseUrl('/img/lexailogo.svg');
  const { pathname } = useLocation();

  const isLeaders = pathname.startsWith('/courses/ai-for-leaders');
  const isEngineering = pathname.startsWith('/courses/ai-for-engineering');

  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle('prof-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="navbar__inner prof-navbar-inner">
      {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}

      <a href={HOME_URL} className="navbar__brand prof-navbar__brand">
        <img src={logoUrl} alt="Lex AI Labs" width={28} height={28} />
        <span className="prof-navbar__title">Prof</span>
      </a>

      <div className="prof-navbar__links">
        <NavDropdown label="AI for Leaders" items={LEADERS_NAV} active={isLeaders} />
        <NavDropdown label="AI for Engineering" items={ENGINEERING_NAV} active={isEngineering} />
      </div>

      <div className="navbar__items navbar__items--right prof-navbar__right">
        <a href={HOME_URL} className="prof-navbar__back">
          ← lexailabs.com
        </a>
      </div>
    </div>
  );
}
