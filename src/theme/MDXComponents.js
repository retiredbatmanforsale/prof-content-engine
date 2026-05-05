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
import ResidualConnectionFlowViz from '@site/src/components/viz/ResidualConnectionFlow';
import LossLandscapeViz from '@site/src/components/viz/LossLandscape';
import ChainRuleViz from '@site/src/components/viz/ChainRuleViz';
import VanishingGradient from '@site/src/components/viz/VanishingGradient';
import CausalMask from '@site/src/components/viz/CausalMask';
import PromptJourney from '@site/src/components/viz/PromptJourney';
import ExcalidrawScene from '@site/src/components/ExcalidrawScene';
import PerceptronDiagram from '@site/src/components/ExcalidrawScene/PerceptronDiagram';
import LessonHero from '@site/src/components/LessonHero';
import LessonVideo from '@site/src/components/LessonVideo';
import InterviewGuide, {
  Round as InterviewRound,
  EvalCriteria,
  GuideTOC,
  RelatedGuides,
  CommonQuestions,
  RecentlyAsked,
  MarkAsRead,
} from '@site/src/components/InterviewGuide';

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
  ResidualConnectionFlowViz,
  LossLandscapeViz,
  ChainRuleViz,
  VanishingGradient,
  CausalMask,
  PromptJourney,
  ExcalidrawScene,
  PerceptronDiagram,
  LessonHero,
  LessonVideo,
  InterviewGuide,
  InterviewRound,
  EvalCriteria,
  GuideTOC,
  RelatedGuides,
  CommonQuestions,
  RecentlyAsked,
  MarkAsRead,
};
