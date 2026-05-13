import React, { type CSSProperties, type ReactNode, useMemo } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import {
  Bot,
  BookOpen,
  Code2,
  Eye,
  GraduationCap,
  Layers,
  Server,
  Sparkles,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useProgress } from '@site/src/context/ProgressContext';
import styles from './styles.module.css';

type Tab = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  matchPrefixes: string[];
};

const TABS: Tab[] = [
  {
    id: 'ai-literacy',
    label: 'AI Literacy',
    description: 'For people from all backgrounds. No heavy math, no code required.',
    icon: BookOpen,
    href: '/ai-for-leaders/genai-for-everyone/intro',
    matchPrefixes: ['/ai-for-leaders/'],
  },
  {
    id: 'foundations',
    label: 'Foundations',
    description: 'The math under every modern model — neurons, gradients, regression.',
    icon: Layers,
    href: '/ai-for-engineering/deep-neural-networks/intro',
    matchPrefixes: [
      '/ai-for-engineering/deep-neural-networks',
      '/ai-for-engineering/foundations-of-regression',
    ],
  },
  {
    id: 'vision',
    label: 'Vision',
    description: 'How machines learn to see — convolutions, filters, and image understanding.',
    icon: Eye,
    href: '/ai-for-engineering/deep-computer-vision-cnn/intro',
    matchPrefixes: ['/ai-for-engineering/deep-computer-vision-cnn'],
  },
  {
    id: 'sequences',
    label: 'Sequences',
    description: 'Modeling time and language — RNNs, LSTMs, and the road to attention.',
    icon: Waves,
    href: '/ai-for-engineering/deep-sequence-modelling-rnn/intro',
    matchPrefixes: ['/ai-for-engineering/deep-sequence-modelling-rnn'],
  },
  {
    id: 'transformers',
    label: 'Transformers',
    description: 'The architecture behind every modern LLM — attention, self-attention, GPT-2.',
    icon: Sparkles,
    href: '/ai-for-engineering/attention-is-all-you-need/intro',
    matchPrefixes: [
      '/ai-for-engineering/attention-is-all-you-need',
      '/ai-for-engineering/build-and-train-your-own-gpt2-model',
    ],
  },
  {
    id: 'agentic',
    label: 'Agentic AI',
    description: 'Build LLM agents that plan, use tools, and reason — from a bare loop up.',
    icon: Bot,
    href: '/ai-for-engineering/agentic-ai/intro',
    matchPrefixes: ['/ai-for-engineering/agentic-ai'],
  },
  {
    id: 'system-design',
    label: 'System Design',
    description: 'ML systems at scale — RecSys, RAG, ranking, fraud, ETA, multimodal search.',
    icon: Server,
    href: '/ai-for-engineering/ml-system-design/intro',
    matchPrefixes: ['/ai-for-engineering/ml-system-design'],
  },
  {
    id: 'practice',
    label: 'Practice',
    description: '50+ ML problems. Implement from scratch, run hidden tests in your browser.',
    icon: Code2,
    href: '/practice',
    matchPrefixes: ['/practice'],
  },
  {
    id: 'interview',
    label: 'Interview',
    description: 'MLE interview prep — rubrics and company guides for Meta, Google, Amazon, Apple.',
    icon: GraduationCap,
    href: '/ai-for-engineering/mle-interview/intro',
    matchPrefixes: ['/ai-for-engineering/mle-interview'],
  },
];

// Strip the leading `/` so we can match against lesson IDs in ProgressContext.
// (Hrefs and matchPrefixes are baseUrl-relative — Docusaurus already strips
// the `/courses/` baseUrl from useLocation pathname for us.)
const PROGRESS_PREFIXES: Record<string, string[]> = TABS.reduce((acc, tab) => {
  acc[tab.id] = tab.matchPrefixes.map((p) => p.replace(/^\//, '').replace(/\/$/, ''));
  return acc;
}, {} as Record<string, string[]>);

function rightmostCompletedIndex(progress: Record<string, string>): number {
  let last = -1;
  TABS.forEach((tab, i) => {
    const prefixes = PROGRESS_PREFIXES[tab.id];
    const hasProgress = Object.entries(progress).some(([lessonId, status]) => {
      if (status !== 'READ' && status !== 'MASTERED') return false;
      return prefixes.some((p) => lessonId === p || lessonId.startsWith(p + '/'));
    });
    if (hasProgress) last = i;
  });
  return last;
}

function matchActiveTab(pathname: string): string | null {
  // Longest prefix wins (so /mle-interview wins over /ai-for-engineering catch-all)
  let best: { id: string; len: number } | null = null;
  for (const tab of TABS) {
    for (const prefix of tab.matchPrefixes) {
      if (pathname.startsWith(prefix) && (!best || prefix.length > best.len)) {
        best = { id: tab.id, len: prefix.length };
      }
    }
  }
  return best?.id ?? null;
}

export default function SectionBar(): ReactNode {
  const { pathname } = useLocation();
  const activeId = matchActiveTab(pathname);
  const { progress } = useProgress();

  const fillFraction = useMemo(() => {
    const last = rightmostCompletedIndex(progress);
    if (last < 0) return 0;
    return TABS.length > 1 ? last / (TABS.length - 1) : 0;
  }, [progress]);

  return (
    <nav className={styles.sectionBar} aria-label="Section navigation">
      <div
        className={styles.inner}
        style={{ ['--fill-pct' as keyof CSSProperties]: fillFraction } as CSSProperties}
      >
        <span className={styles.fillLine} aria-hidden="true" />
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeId;
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                <Icon size={14} strokeWidth={1.75} />
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
              <span className={styles.tabPopover} role="tooltip">
                <span className={styles.tabPopoverArrow} aria-hidden="true" />
                <span className={styles.tabPopoverTitle}>{tab.label}</span>
                <span className={styles.tabPopoverDesc}>{tab.description}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
