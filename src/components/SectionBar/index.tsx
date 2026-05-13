import React, { type ReactNode } from 'react';
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
    href: '/courses/ai-for-leaders/genai-for-everyone/intro',
    matchPrefixes: ['/courses/ai-for-leaders/'],
  },
  {
    id: 'foundations',
    label: 'Foundations',
    description: 'The math under every modern model — neurons, gradients, regression.',
    icon: Layers,
    href: '/courses/ai-for-engineering/deep-neural-networks/intro',
    matchPrefixes: [
      '/courses/ai-for-engineering/deep-neural-networks',
      '/courses/ai-for-engineering/foundations-of-regression',
    ],
  },
  {
    id: 'vision',
    label: 'Vision',
    description: 'How machines learn to see — convolutions, filters, and image understanding.',
    icon: Eye,
    href: '/courses/ai-for-engineering/deep-computer-vision-cnn/intro',
    matchPrefixes: ['/courses/ai-for-engineering/deep-computer-vision-cnn'],
  },
  {
    id: 'sequences',
    label: 'Sequences',
    description: 'Modeling time and language — RNNs, LSTMs, and the road to attention.',
    icon: Waves,
    href: '/courses/ai-for-engineering/deep-sequence-modelling-rnn/intro',
    matchPrefixes: ['/courses/ai-for-engineering/deep-sequence-modelling-rnn'],
  },
  {
    id: 'transformers',
    label: 'Transformers',
    description: 'The architecture behind every modern LLM — attention, self-attention, GPT-2.',
    icon: Sparkles,
    href: '/courses/ai-for-engineering/attention-is-all-you-need/intro',
    matchPrefixes: [
      '/courses/ai-for-engineering/attention-is-all-you-need',
      '/courses/ai-for-engineering/build-and-train-your-own-gpt2-model',
    ],
  },
  {
    id: 'agentic',
    label: 'Agentic AI',
    description: 'Build LLM agents that plan, use tools, and reason — from a bare loop up.',
    icon: Bot,
    href: '/courses/ai-for-engineering/agentic-ai/intro',
    matchPrefixes: ['/courses/ai-for-engineering/agentic-ai'],
  },
  {
    id: 'system-design',
    label: 'System Design',
    description: 'ML systems at scale — RecSys, RAG, ranking, fraud, ETA, multimodal search.',
    icon: Server,
    href: '/courses/ai-for-engineering/ml-system-design/intro',
    matchPrefixes: ['/courses/ai-for-engineering/ml-system-design'],
  },
  {
    id: 'practice',
    label: 'Practice',
    description: '50+ ML problems. Implement from scratch, run hidden tests in your browser.',
    icon: Code2,
    href: '/courses/practice',
    matchPrefixes: ['/courses/practice'],
  },
  {
    id: 'interview',
    label: 'Interview',
    description: 'MLE interview prep — rubrics and company guides for Meta, Google, Amazon, Apple.',
    icon: GraduationCap,
    href: '/courses/ai-for-engineering/mle-interview/intro',
    matchPrefixes: ['/courses/ai-for-engineering/mle-interview'],
  },
];

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

  return (
    <nav className={styles.sectionBar} aria-label="Section navigation">
      <div className={styles.inner}>
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
