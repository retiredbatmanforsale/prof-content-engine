import React, { useState, useCallback } from 'react';
import styles from './styles.module.css';

interface LessonVideoProps {
  src: string;
  title: string;
  aspectRatio?: number;
  thumbnail?: string;
}

export default function LessonVideo({
  src,
  title,
  aspectRatio = 56.25,
  thumbnail = '/img/prof-thumbnail.png',
}: LessonVideoProps) {
  const [playing, setPlaying] = useState(false);

  const autoplaySrc = src.includes('?') ? `${src}&autoplay=1` : `${src}?autoplay=1`;
  const handlePlay = useCallback(() => setPlaying(true), []);

  return (
    <div className={`not-prose ${styles.wrapper}`}>
      <div className={styles.container} style={{ paddingTop: `${aspectRatio}%` }}>
        {playing ? (
          <iframe
            src={autoplaySrc}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            className={styles.iframe}
            title={title}
          />
        ) : (
          <div
            className={styles.thumbnail}
            onClick={handlePlay}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && handlePlay()}
            aria-label={`Play: ${title}`}
          >
            <img src={thumbnail} alt="" className={styles.thumbImg} />
            <div className={styles.overlay} />

            <div className={styles.playWrap}>
              <div className={styles.playBtn}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32" aria-hidden>
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              </div>
            </div>

            <div className={styles.titleBar}>
              <p className={styles.videoTitle}>{title}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
