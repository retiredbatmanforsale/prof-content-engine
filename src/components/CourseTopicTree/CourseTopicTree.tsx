import React, { useState, type ReactNode } from 'react';
import styles from './CourseTopicTree.module.css';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LessonNode {
  id: string;
  title: string;
  oneLiner: string;
  why: string;
  difficulty: Difficulty;
  minutes: number;
  lessonPrereqs?: string[];
}

export interface CourseLink {
  title: string;
  description: string;
}

export interface CourseTopicTreeData {
  prerequisites: CourseLink[];
  lessons: LessonNode[];
  unlocks: CourseLink[];
}

const DIFFICULTY: Record<Difficulty, { color: string; label: string }> = {
  beginner:     { color: '#10B981', label: 'Beginner' },
  intermediate: { color: '#F59E0B', label: 'Intermediate' },
  advanced:     { color: '#EF4444', label: 'Advanced' },
};

function Badge({ difficulty }: { difficulty: Difficulty }) {
  const { color, label } = DIFFICULTY[difficulty];
  return (
    <span className={styles.badge} style={{ color, borderColor: `${color}55` }}>
      <span className={styles.badgeDot} style={{ background: color }} />
      {label}
    </span>
  );
}

function LessonCard({ node, index }: { node: LessonNode; index: number }): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const { color } = DIFFICULTY[node.difficulty];

  return (
    <div
      className={styles.node}
      style={{ borderLeftColor: color }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={styles.nodeHeader}>
        <span className={styles.lessonNum}>{String(index + 1).padStart(2, '0')}</span>
        <Badge difficulty={node.difficulty} />
      </div>
      <p className={styles.nodeTitle}>{node.title}</p>
      <p className={styles.nodeLiner}>{node.oneLiner}</p>

      {expanded && (
        <div className={styles.nodeExpanded}>
          <p className={styles.expandSection}>Why this matters</p>
          <p className={styles.expandBody}>{node.why}</p>
          {node.lessonPrereqs && node.lessonPrereqs.length > 0 && (
            <>
              <p className={styles.expandSection}>Prereqs</p>
              <p className={styles.expandPrereqs}>{node.lessonPrereqs.join(' · ')}</p>
            </>
          )}
          <p className={styles.expandTime}>⏱ {node.minutes} min read</p>
        </div>
      )}
    </div>
  );
}

function CourseCard({ link, faded }: { link: CourseLink; faded?: boolean }): ReactNode {
  return (
    <div className={`${styles.courseCard} ${faded ? styles.courseCardFaded : ''}`}>
      <p className={styles.courseCardTitle}>{link.title}</p>
      <p className={styles.courseCardDesc}>{link.description}</p>
    </div>
  );
}

function Connector(): ReactNode {
  return (
    <div className={styles.connectorWrap}>
      <div className={styles.connectorLine} />
      <div className={styles.connectorArrow} />
    </div>
  );
}

export default function CourseTopicTree({ data }: { data: CourseTopicTreeData }): ReactNode {
  const { prerequisites, lessons, unlocks } = data;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Course map</span>
        <span className={styles.headerHint}>Hover any lesson to see why it matters</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.sideCol}>
          {prerequisites.length > 0 && (
            <>
              <p className={styles.colLabel}>Prerequisites</p>
              {prerequisites.map((p) => (
                <CourseCard key={p.title} link={p} faded />
              ))}
            </>
          )}
        </div>

        <div className={styles.centerCol}>
          <p className={styles.colLabel}>Lessons</p>
          {lessons.map((lesson, i) => (
            <React.Fragment key={lesson.id}>
              <LessonCard node={lesson} index={i} />
              {i < lessons.length - 1 && <Connector />}
            </React.Fragment>
          ))}
        </div>

        <div className={styles.sideCol}>
          {unlocks.length > 0 && (
            <>
              <p className={styles.colLabel}>Unlocks</p>
              {unlocks.map((u) => (
                <CourseCard key={u.title} link={u} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
