import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docsSidebar: [
    {
      type: 'category',
      label: 'AI writing & talks',
      link: {
        type: 'doc',
        id: 'ai-writing-and-talks/intro',
      },
      items: [
        'ai-writing-and-talks/intro',
        'ai-writing-and-talks/from-statistical-models-to-modern-ai-systems',
        'ai-writing-and-talks/what-should-we-learn-engineer-modern-ai',
      ],
    },
    {
      type: 'category',
      label: 'AI for Leaders',
      link: {
        type: 'doc',
        id: 'ai-for-leaders/genai-for-everyone/intro',
      },
      items: [
        {
          type: 'category',
          label: 'AI 4 Everyone — Gen AI & use cases',
          link: {
            type: 'doc',
            id: 'ai-for-leaders/genai-for-everyone/intro',
          },
          items: [
            'ai-for-leaders/genai-for-everyone/intro',
            'ai-for-leaders/genai-for-everyone/literacy-and-the-road-to-generative-ai',
            'ai-for-leaders/genai-for-everyone/five-layer-ai-stack',
            'ai-for-leaders/genai-for-everyone/ai-model-lifecycle-for-leaders',
            'ai-for-leaders/genai-for-everyone/llm-design-case-study',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'AI for Engineering',
      items: [
        {
          type: 'category',
          label: 'Deep Computer Vision (CNN)',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/deep-computer-vision-cnn/intro',
          },
          items: [
            'ai-for-engineering/deep-computer-vision-cnn/visual-revolution',
            'ai-for-engineering/deep-computer-vision-cnn/transformative-deep-learning-vision',
            'ai-for-engineering/deep-computer-vision-cnn/from-pixels-to-perception',
            'ai-for-engineering/deep-computer-vision-cnn/feature-detection-hierarchy',
            'ai-for-engineering/deep-computer-vision-cnn/learning-features-from-data',
            'ai-for-engineering/deep-computer-vision-cnn/preserving-spatial-structure-cnns',
            'ai-for-engineering/deep-computer-vision-cnn/filters-features-convolutions',
            'ai-for-engineering/deep-computer-vision-cnn/learning-to-see-cnns',
          ],
        },
        {
          type: 'category',
          label: 'Deep Sequence Modelling (RNN)',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/deep-sequence-modelling-rnn/intro',
          },
          items: [
            'ai-for-engineering/deep-sequence-modelling-rnn/foundations-of-deep-sequence-modeling',
            'ai-for-engineering/deep-sequence-modelling-rnn/from-static-networks-to-time-aware',
            'ai-for-engineering/deep-sequence-modelling-rnn/rnn-internal-mechanics',
            'ai-for-engineering/deep-sequence-modelling-rnn/bringing-sequence-modeling-real-world',
            'ai-for-engineering/deep-sequence-modelling-rnn/training-rnn-backprop-through-time',
            'ai-for-engineering/deep-sequence-modelling-rnn/training-an-rnn-in-pytorch',
          ],
        },
        {
          type: 'category',
          label: 'Attention Is All You Need',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/attention-is-all-you-need/intro',
          },
          items: [
            'ai-for-engineering/attention-is-all-you-need/problem-with-rnns-and-lstms',
            'ai-for-engineering/attention-is-all-you-need/token-embeddings',
            'ai-for-engineering/attention-is-all-you-need/positional-embeddings',
            'ai-for-engineering/attention-is-all-you-need/attention',
            'ai-for-engineering/attention-is-all-you-need/self-attention',
            'ai-for-engineering/attention-is-all-you-need/multi-headed-attention',
            'ai-for-engineering/attention-is-all-you-need/causal-masking',
            'ai-for-engineering/attention-is-all-you-need/residual-connections',
            'ai-for-engineering/attention-is-all-you-need/layer-normalization',
            'ai-for-engineering/attention-is-all-you-need/feed-forward-neural-networks',
            'ai-for-engineering/attention-is-all-you-need/cross-attention',
            'ai-for-engineering/attention-is-all-you-need/encoder-stack',
            'ai-for-engineering/attention-is-all-you-need/decoder-stack',
            'ai-for-engineering/attention-is-all-you-need/encoder-decoder-transformer',
          ],
        },
        {
          type: 'category',
          label: 'Build and Train Your Own GPT-2 Model',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/build-and-train-your-own-gpt2-model/intro',
          },
          items: [
            'ai-for-engineering/build-and-train-your-own-gpt2-model/problem-with-rnns-lstms',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/token-embeddings',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/positional-embeddings',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/attention-multi-head-attention',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/causal-masking',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/residual-connections',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/layer-normalization',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/feed-forward-neural-networks',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/generation-of-next-tokens',
            'ai-for-engineering/build-and-train-your-own-gpt2-model/decoder-only-transformer',
          ],
        },
        {
          type: 'category',
          label: 'Deep Neural Networks',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/deep-neural-networks/intro',
          },
          items: [
            'ai-for-engineering/deep-neural-networks/perceptron-and-neuron',
            'ai-for-engineering/deep-neural-networks/layers-in-deep-neural-networks',
            'ai-for-engineering/deep-neural-networks/activation-functions',
            'ai-for-engineering/deep-neural-networks/loss-functions',
            'ai-for-engineering/deep-neural-networks/forward-pass',
            'ai-for-engineering/deep-neural-networks/backward-pass',
            'ai-for-engineering/deep-neural-networks/trainable-parameters-and-hyperparameters',
            'ai-for-engineering/deep-neural-networks/overfitting-in-neural-networks',
            'ai-for-engineering/deep-neural-networks/neural-network-architecture',
            'ai-for-engineering/deep-neural-networks/neural-network-from-scratch',
          ],
        },
        {
          type: 'category',
          label: 'Foundations of Regression',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/foundations-of-regression/intro',
          },
          items: [
            'ai-for-engineering/foundations-of-regression/linear-regression-line-ssr-gradient-descent',
            'ai-for-engineering/foundations-of-regression/why-logistic-regression',
            'ai-for-engineering/foundations-of-regression/sigmoid-function-logistic-regression',
            'ai-for-engineering/foundations-of-regression/logistic-regression-decision-boundaries',
            'ai-for-engineering/foundations-of-regression/intuition-behind-logistic-regression',
            'ai-for-engineering/foundations-of-regression/log-likelihood-instead-of-squared-error',
          ],
        },
        {
          type: 'category',
          label: 'AI Research',
          link: {
            type: 'doc',
            id: 'ai-for-engineering/ai-research/intro',
          },
          items: ['ai-for-engineering/ai-research/aletheia-gemini-deep-think-math-research'],
        },
      ],
    },
  ],
};

export default sidebars;