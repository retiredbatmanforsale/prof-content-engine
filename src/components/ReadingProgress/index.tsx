import React, { type ReactNode, useEffect, useState } from 'react';
import styles from './styles.module.css';

export default function ReadingProgress(): ReactNode {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const next = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
      setPct(next);
    };
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    compute();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={styles.track} aria-hidden="true">
      <div className={styles.bar} style={{ width: `${pct}%` }} />
    </div>
  );
}
