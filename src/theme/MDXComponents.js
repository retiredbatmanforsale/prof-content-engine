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
import AgentLoopFlow from '@site/src/components/viz/AgentLoopFlow';
import PromptAnatomy from '@site/src/components/viz/PromptAnatomy';
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
import AnimationPlaceholder from '@site/src/components/MLSDPlaceholders/AnimationPlaceholder';
import PlaygroundPlaceholder from '@site/src/components/MLSDPlaceholders/PlaygroundPlaceholder';
import InterviewerSignal from '@site/src/components/MLSDPlaceholders/InterviewerSignal';
import CompanyLogos from '@site/src/components/MLSDPlaceholders/CompanyLogos';
import Stat from '@site/src/components/MLSDPlaceholders/Stat';
import Stepper from '@site/src/components/MLSDPlaceholders/Stepper';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import SplitCompare, {SplitLeft, SplitRight} from '@site/src/components/MLSDPlaceholders/SplitCompare';
import EmbeddingStoreSizer from '@site/src/components/MLSDPlaygrounds/EmbeddingStoreSizer';
import ABTestPower from '@site/src/components/MLSDPlaygrounds/ABTestPower';
import LatencySimulator from '@site/src/components/MLSDPlaygrounds/LatencySimulator';
import FraudThresholdOptimizer from '@site/src/components/MLSDPlaygrounds/FraudThresholdOptimizer';
import MetricTreeBuilder from '@site/src/components/MLSDPlaygrounds/MetricTreeBuilder';
import DriftSimulator from '@site/src/components/MLSDPlaygrounds/DriftSimulator';
import TwoTowerMini from '@site/src/components/MLSDPlaygrounds/TwoTowerMini';
import HybridRetrievalDemo from '@site/src/components/MLSDPlaygrounds/HybridRetrievalDemo';
import PinballLossDemo from '@site/src/components/MLSDPlaygrounds/PinballLossDemo';
import RankerMini from '@site/src/components/MLSDPlaygrounds/RankerMini';
import NegativeSampler from '@site/src/components/MLSDPlaygrounds/NegativeSampler';
import RAGPromptStudio from '@site/src/components/MLSDPlaygrounds/RAGPromptStudio';
import RAGEvalHarness from '@site/src/components/MLSDPlaygrounds/RAGEvalHarness';
import AdAuctionSimulator from '@site/src/components/MLSDPlaygrounds/AdAuctionSimulator';
import CLIPMini from '@site/src/components/MLSDPlaygrounds/CLIPMini';
import RecsysFunnel from '@site/src/components/MLSDDiagrams/RecsysFunnel';
import RAGFunnel from '@site/src/components/MLSDDiagrams/RAGFunnel';
import TwoTowerArchitecture from '@site/src/components/MLSDDiagrams/TwoTowerArchitecture';
import RankerArchitecture from '@site/src/components/MLSDDiagrams/RankerArchitecture';
import HybridRetrievalFlow from '@site/src/components/MLSDDiagrams/HybridRetrievalFlow';
import DataPipelineFlow from '@site/src/components/MLSDDiagrams/DataPipelineFlow';
import RAGLatencyBudget from '@site/src/components/MLSDDiagrams/RAGLatencyBudget';
import RAGEvalDecomposition from '@site/src/components/MLSDDiagrams/RAGEvalDecomposition';
import FeatureStoreSchema from '@site/src/components/MLSDDiagrams/FeatureStoreSchema';
import AdAuctionFlow from '@site/src/components/MLSDDiagrams/AdAuctionFlow';
import NoveltyEffect from '@site/src/components/MLSDDiagrams/NoveltyEffect';
import ModelDecayCurve from '@site/src/components/MLSDDiagrams/ModelDecayCurve';

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
  AgentLoopFlow,
  PromptAnatomy,
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
  AnimationPlaceholder,
  PlaygroundPlaceholder,
  InterviewerSignal,
  CompanyLogos,
  Stat,
  Stepper,
  Tabs,
  TabItem,
  SplitCompare,
  SplitLeft,
  SplitRight,
  EmbeddingStoreSizer,
  ABTestPower,
  LatencySimulator,
  FraudThresholdOptimizer,
  MetricTreeBuilder,
  DriftSimulator,
  TwoTowerMini,
  HybridRetrievalDemo,
  PinballLossDemo,
  RankerMini,
  NegativeSampler,
  RAGPromptStudio,
  RAGEvalHarness,
  AdAuctionSimulator,
  CLIPMini,
  RecsysFunnel,
  RAGFunnel,
  TwoTowerArchitecture,
  RankerArchitecture,
  HybridRetrievalFlow,
  DataPipelineFlow,
  RAGLatencyBudget,
  RAGEvalDecomposition,
  FeatureStoreSchema,
  AdAuctionFlow,
  NoveltyEffect,
  ModelDecayCurve,
};
