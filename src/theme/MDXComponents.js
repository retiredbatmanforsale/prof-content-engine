import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import Quiz from '@site/src/components/Quiz';
import InterviewQuestion from '@site/src/components/InterviewQuestion';
import MLEInterviewCharts from '@site/src/components/MLEInterviewCharts';
import SocraticTutor from '@site/src/components/SocraticTutor/SocraticTutor';
import GradientDescentViz from '@site/src/components/viz/GradientDescentViz';
import ActivationViz from '@site/src/components/viz/ActivationViz';
import AttentionHeatmapViz from '@site/src/components/viz/AttentionHeatmapViz';
import DecisionBoundaryViz from '@site/src/components/viz/DecisionBoundaryViz';
import NeuralNetForwardViz from '@site/src/components/viz/NeuralNetForwardViz';
import PythonPlayground from '@site/src/components/viz/PythonPlayground';

export default {
  ...MDXComponents,
  Quiz,
  InterviewQuestion,
  MLEInterviewCharts,
  SocraticTutor,
  GradientDescentViz,
  ActivationViz,
  AttentionHeatmapViz,
  DecisionBoundaryViz,
  NeuralNetForwardViz,
  PythonPlayground,
};
