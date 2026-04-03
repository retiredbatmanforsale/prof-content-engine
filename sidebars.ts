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
      label: 'AI for Leaders',
      items: [
        'ai-for-leaders/intro',
        'ai-for-leaders/llms-101/intro',
        'ai-for-leaders/genai-for-everyone/intro',
        'ai-for-leaders/prompt-engineering/intro',
        'ai-for-leaders/ai-literacy/intro',
        'ai-for-leaders/curriculum-tree',
        'ai-for-leaders/curriculum-overview',
        'ai-for-leaders/machine-learning-fundamentals',
        'ai-for-leaders/classification-regression-supervised-unsupervised',
        'ai-for-leaders/algorithms-high-level-overview',
        'ai-for-leaders/classical-ml-in-market',
      ],
    },
    {
      type: 'category',
      label: 'AI for Engineering',
      items: [
        'ai-for-engineering/deep-computer-vision-cnn/intro',
        'ai-for-engineering/deep-sequence-modelling-rnn/intro',
        'ai-for-engineering/attention-is-all-you-need/intro',
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
        'ai-for-engineering/deep-neural-networks/intro',
        'ai-for-engineering/foundations-of-regression/intro',
        'ai-for-engineering/tree-based-algorithms-classical-ml/intro',
        'ai-for-engineering/ai-research/intro',
        'ai-for-engineering/agentic-ai/intro',
      ],
    },
  ],
};

export default sidebars;