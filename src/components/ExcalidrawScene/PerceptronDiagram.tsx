import React from 'react';
import ExcalidrawScene from './index';
import { perceptronElements } from './scenes/perceptron';

interface Props {
  editable?: boolean;
  height?: number;
  caption?: string;
}

export default function PerceptronDiagram({ editable = false, height = 420, caption }: Props) {
  return (
    <ExcalidrawScene
      elements={perceptronElements as any}
      height={height}
      editable={editable}
      caption={caption}
    />
  );
}
