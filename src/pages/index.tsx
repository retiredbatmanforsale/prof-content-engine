import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const tracks = [
  {
    title: 'AI for Engineering',
    description:
      'Deep dive into neural networks, computer vision, sequence modelling, transformers, and building your own GPT-2 from scratch.',
    link: '/courses/ai-for-engineering/deep-computer-vision-cnn/intro',
    icon: '{ }',
    accent: 'var(--lexai-blue-500)',
  },
  {
    title: 'AI for Leaders',
    description:
      'Understand LLMs, generative AI, prompt engineering, and AI literacy — built for business leaders and decision-makers.',
    link: '/courses/ai-for-leaders/llms-101/intro',
    icon: '\u25B2',
    accent: 'var(--lexai-coral-500)',
  },
];

export default function Home(): React.JSX.Element {
  return (
    <Layout title="Courses" description="Prof by Lex AI — choose your learning track">
      <main style={styles.main}>
        <h1 style={styles.heading}>Choose your track</h1>
        <p style={styles.subheading}>
          Pick a learning path that fits your role and goals.
        </p>
        <div style={styles.grid}>
          {tracks.map((track) => (
            <Link key={track.title} to={track.link} style={{textDecoration: 'none', display: 'flex'}}>
              <div style={styles.card} className="track-card">
                <span style={{...styles.icon, borderColor: track.accent, color: track.accent}}>
                  {track.icon}
                </span>
                <h2 style={styles.cardTitle}>{track.title}</h2>
                <p style={styles.cardDesc}>{track.description}</p>
                <span style={{...styles.cta, color: track.accent}}>
                  Start learning &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 24px',
    minHeight: 'calc(100vh - 64px)',
  },
  heading: {
    fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
    fontSize: '2.8rem',
    fontWeight: 400,
    margin: 0,
    color: 'var(--lexai-content-primary)',
  },
  subheading: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: '1.1rem',
    color: '#737373',
    marginTop: 12,
    marginBottom: 48,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 32,
    maxWidth: 720,
    width: '100%',
  },
  card: {
    border: '1px solid #e5e5e5',
    borderRadius: 12,
    padding: '36px 28px',
    background: '#fff',
    cursor: 'pointer',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 10,
    border: '2px solid',
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    fontFamily: "'JetBrains Mono', monospace",
  },
  cardTitle: {
    fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
    fontSize: '1.6rem',
    fontWeight: 400,
    margin: '0 0 10px',
    color: 'var(--lexai-content-primary)',
  },
  cardDesc: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#525252',
    margin: '0 0 20px',
    flex: 1,
  },
  cta: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: '0.9rem',
    fontWeight: 600,
  },
};
