import React, { createContext, useContext } from 'react';
import GuideHero from './GuideHero';
import Round from './Round';
import EvalCriteria from './EvalCriteria';
import MarkAsRead from './MarkAsRead';
import GuideTOC from './GuideTOC';
import RelatedGuides from './RelatedGuides';
import CommonQuestions from './CommonQuestions';
import RecentlyAsked from './RecentlyAsked';
import styles from './styles.module.css';

interface GuideContext {
  slug: string;
  company: string;
  level: string;
}

const Ctx = createContext<GuideContext | null>(null);
export const useGuide = () => useContext(Ctx);

interface Props {
  company: string;
  level: string;
  title?: string;
  subtitle?: string;
  slug: string;
  children: React.ReactNode;
}

export default function InterviewGuide({
  company,
  level,
  title,
  subtitle,
  slug,
  children,
}: Props) {
  return (
    <Ctx.Provider value={{ slug, company, level }}>
      <div className={styles.guide}>
        <GuideHero
          company={company}
          level={level}
          title={title}
          subtitle={subtitle}
        />
        <MarkAsRead slug={slug} />
        <div className={styles.body}>{children}</div>
      </div>
    </Ctx.Provider>
  );
}

export { GuideHero, Round, EvalCriteria, MarkAsRead, GuideTOC, RelatedGuides, CommonQuestions, RecentlyAsked };
export type { Question, RecentQuestion, QuestionType, Difficulty, Confidence, RecentlyAskedEntry } from './types';
