import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';
// JS import uses webpack's "development"/"production" condition (not "style") — avoids css-loader exports field error
import '@excalidraw/excalidraw/index.css';

interface ExcalidrawSceneProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elements: any[];
  height?: number;
  editable?: boolean;
  caption?: string;
}

function ExcalidrawInner({ elements, height = 380, editable = false, caption }: ExcalidrawSceneProps) {
  const { Excalidraw } = require('@excalidraw/excalidraw');

  return (
    <div className={styles.wrapper}>
      <div style={{ height }} className={`${styles.canvas} ${editable ? styles.editable : styles.readonly}`}>
        <Excalidraw
          initialData={{ elements, appState: { viewBackgroundColor: '#fafafa', gridSize: null } }}
          viewModeEnabled={!editable}
          zenModeEnabled={false}
          gridModeEnabled={false}
          UIOptions={{
            canvasActions: editable
              ? { export: false, loadScene: false, saveToActiveFile: false, saveAsImage: false }
              : { export: false, loadScene: false, saveToActiveFile: false, saveAsImage: false, clearCanvas: false, changeViewBackgroundColor: false, toggleTheme: false },
          }}
        />
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
      {editable && (
        <p className={styles.scratchpadNote}>
          ✏️ <strong>Scratchpad</strong> — draw, annotate, or erase freely. Changes stay in your browser only.
        </p>
      )}
    </div>
  );
}

export default function ExcalidrawScene(props: ExcalidrawSceneProps) {
  return (
    <BrowserOnly fallback={<div style={{ height: props.height ?? 380, background: '#f8fafc', borderRadius: 12 }} />}>
      {() => <ExcalidrawInner {...props} />}
    </BrowserOnly>
  );
}
