import React, { useEffect, useRef, type ReactNode } from 'react';
import OriginalDocItemLayout from '@theme-original/DocItem/Layout';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import SocraticTutor from '@site/src/components/SocraticTutor/SocraticTutor';
import { useProgress } from '@site/src/context/ProgressContext';
import type { Props } from '@theme/DocItem/Layout';

type FrontMatterWithTutor = {
  tutor_topic?: string;
  tutor_concepts?: string[];
  practice_mode?: boolean;
  [key: string]: unknown;
};

function ScrollSentinel({ lessonId }: { lessonId: string }) {
  const { markInProgress, markRead } = useProgress();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);

  // Mark in-progress when the lesson mounts
  useEffect(() => {
    markInProgress(lessonId);
  }, [lessonId]);

  // Mark read when sentinel enters viewport (user reached the bottom)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !firedRef.current) {
          firedRef.current = true;
          markRead(lessonId);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [lessonId]);

  return <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />;
}

export default function DocItemLayout({ children }: Props): ReactNode {
  const { frontMatter, metadata } = useDoc();
  const fm = frontMatter as FrontMatterWithTutor;
  const tutorTopic = fm.tutor_topic;
  const tutorConcepts = fm.tutor_concepts;
  const practiceMode = !!fm.practice_mode;

  // Toggle a body class so global CSS can adjust the doc chrome on practice pages
  // (collapse sidebar to a rail, hide breadcrumbs/TOC/footer, full-bleed workbench).
  useEffect(() => {
    if (!practiceMode) return;
    document.body.classList.add('practice-mode');
    return () => {
      document.body.classList.remove('practice-mode');
      document.body.classList.remove('practice-mode-sidebar-open');
    };
  }, [practiceMode]);

  // Practice pages bypass OriginalDocItemLayout entirely (which renders the
  // article + breadcrumbs + TOC + column structure we don't want). The sidebar
  // comes from DocRootLayout one level up, which we leave untouched. The body
  // class + sidebar-toggle drive the visual adjustments from inside the workbench.
  if (practiceMode) {
    return <div className="practice-page-content">{children}</div>;
  }

  return (
    <OriginalDocItemLayout>
      {children}
      {tutorTopic && tutorConcepts && tutorConcepts.length > 0 && (
        <SocraticTutor
          lessonId={metadata.id}
          topic={tutorTopic}
          concepts={tutorConcepts}
        />
      )}
      <ScrollSentinel lessonId={metadata.id} />
    </OriginalDocItemLayout>
  );
}
