import React, { type ReactNode } from 'react';
import OriginalDocItemLayout from '@theme-original/DocItem/Layout';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import SocraticTutor from '@site/src/components/SocraticTutor/SocraticTutor';
import type { Props } from '@theme/DocItem/Layout';

type FrontMatterWithTutor = {
  tutor_topic?: string;
  tutor_concepts?: string[];
  [key: string]: unknown;
};

export default function DocItemLayout({ children }: Props): ReactNode {
  const { frontMatter, metadata } = useDoc();
  const fm = frontMatter as FrontMatterWithTutor;
  const tutorTopic = fm.tutor_topic;
  const tutorConcepts = fm.tutor_concepts;

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
    </OriginalDocItemLayout>
  );
}
