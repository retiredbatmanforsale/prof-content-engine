import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // AI Literacy track (ai-for-leaders/*) was hidden from nav 2026-05-13.
  // MDX files retained on disk — re-introduce a `literacy:` key here to
  // restore the sidebar if the track is brought back.

  // ─────────────────────────────────────────────────────────────────────────
  // Foundations
  // ─────────────────────────────────────────────────────────────────────────
  foundations: [
    {
      type: 'category',
      label: 'Deep Neural Networks',
      className: 'sidebar-course',
      customProps: { icon: 'network' },
      link: { type: 'doc', id: 'ai-for-engineering/deep-neural-networks/intro' },
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
        'ai-for-engineering/deep-neural-networks/interview-readiness',
      ],
    },
    {
      type: 'category',
      label: 'Foundations of Regression',
      className: 'sidebar-course',
      customProps: { icon: 'chart' },
      link: { type: 'doc', id: 'ai-for-engineering/foundations-of-regression/intro' },
      items: [
        'ai-for-engineering/foundations-of-regression/linear-regression-line-ssr-gradient-descent',
        'ai-for-engineering/foundations-of-regression/why-logistic-regression',
        'ai-for-engineering/foundations-of-regression/sigmoid-function-logistic-regression',
        'ai-for-engineering/foundations-of-regression/logistic-regression-decision-boundaries',
        'ai-for-engineering/foundations-of-regression/intuition-behind-logistic-regression',
        'ai-for-engineering/foundations-of-regression/log-likelihood-instead-of-squared-error',
        'ai-for-engineering/foundations-of-regression/interview-readiness',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Vision
  // ─────────────────────────────────────────────────────────────────────────
  vision: [
    {
      type: 'category',
      label: 'Deep Computer Vision (CNN)',
      className: 'sidebar-course',
      customProps: { icon: 'eye' },
      link: { type: 'doc', id: 'ai-for-engineering/deep-computer-vision-cnn/intro' },
      items: [
        'ai-for-engineering/deep-computer-vision-cnn/visual-revolution',
        'ai-for-engineering/deep-computer-vision-cnn/transformative-deep-learning-vision',
        'ai-for-engineering/deep-computer-vision-cnn/from-pixels-to-perception',
        'ai-for-engineering/deep-computer-vision-cnn/feature-detection-hierarchy',
        'ai-for-engineering/deep-computer-vision-cnn/preserving-spatial-structure-cnns',
        'ai-for-engineering/deep-computer-vision-cnn/filters-features-convolutions',
        'ai-for-engineering/deep-computer-vision-cnn/learning-to-see-cnns',
        'ai-for-engineering/deep-computer-vision-cnn/interview-readiness',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Sequences
  // ─────────────────────────────────────────────────────────────────────────
  sequences: [
    {
      type: 'category',
      label: 'Deep Sequence Modelling (RNN)',
      className: 'sidebar-course',
      customProps: { icon: 'waves' },
      link: { type: 'doc', id: 'ai-for-engineering/deep-sequence-modelling-rnn/intro' },
      items: [
        'ai-for-engineering/deep-sequence-modelling-rnn/foundations-of-deep-sequence-modeling',
        'ai-for-engineering/deep-sequence-modelling-rnn/from-static-networks-to-time-aware',
        'ai-for-engineering/deep-sequence-modelling-rnn/rnn-internal-mechanics',
        'ai-for-engineering/deep-sequence-modelling-rnn/lstm-and-gru',
        'ai-for-engineering/deep-sequence-modelling-rnn/bringing-sequence-modeling-real-world',
        'ai-for-engineering/deep-sequence-modelling-rnn/training-rnn-backprop-through-time',
        'ai-for-engineering/deep-sequence-modelling-rnn/training-an-rnn-in-pytorch',
        'ai-for-engineering/deep-sequence-modelling-rnn/interview-readiness',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Transformers
  // ─────────────────────────────────────────────────────────────────────────
  transformers: [
    {
      type: 'category',
      label: 'Attention Is All You Need',
      className: 'sidebar-course',
      customProps: { icon: 'sparkles' },
      link: { type: 'doc', id: 'ai-for-engineering/attention-is-all-you-need/intro' },
      items: [
        'ai-for-engineering/attention-is-all-you-need/problem-with-rnns-and-lstms',
        'ai-for-engineering/attention-is-all-you-need/positional-embeddings',
        'ai-for-engineering/attention-is-all-you-need/attention',
        'ai-for-engineering/attention-is-all-you-need/self-attention',
        'ai-for-engineering/attention-is-all-you-need/multi-headed-attention',
        'ai-for-engineering/attention-is-all-you-need/cross-attention',
        'ai-for-engineering/attention-is-all-you-need/encoder-stack',
        'ai-for-engineering/attention-is-all-you-need/encoder-decoder-transformer',
        'ai-for-engineering/attention-is-all-you-need/from-encoder-decoder-to-gpt',
        'ai-for-engineering/attention-is-all-you-need/interview-readiness',
      ],
    },
    {
      type: 'category',
      label: 'Build and Train Your Own GPT-2',
      className: 'sidebar-course',
      customProps: { icon: 'brain' },
      link: { type: 'doc', id: 'ai-for-engineering/build-and-train-your-own-gpt2-model/intro' },
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
        'ai-for-engineering/build-and-train-your-own-gpt2-model/interview-readiness',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Agentic AI
  // ─────────────────────────────────────────────────────────────────────────
  agentic: [
    {
      type: 'category',
      label: 'Build a Multi-Agent Research Assistant',
      className: 'sidebar-course',
      customProps: { icon: 'bot' },
      link: { type: 'doc', id: 'ai-for-engineering/agentic-ai/intro' },
      items: [
        'ai-for-engineering/agentic-ai/bare-llm-loop',
        'ai-for-engineering/agentic-ai/tool-use',
        'ai-for-engineering/agentic-ai/react-reasoning',
        'ai-for-engineering/agentic-ai/planner',
        'ai-for-engineering/agentic-ai/parallel-executors',
        'ai-for-engineering/agentic-ai/shared-memory',
        'ai-for-engineering/agentic-ai/critic',
        'ai-for-engineering/agentic-ai/full-system',
        'ai-for-engineering/agentic-ai/observability',
        'ai-for-engineering/agentic-ai/interview-readiness',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // System Design
  // ─────────────────────────────────────────────────────────────────────────
  systemDesign: [
    {
      type: 'category',
      label: 'ML System Design',
      className: 'sidebar-course',
      customProps: { icon: 'server' },
      link: { type: 'doc', id: 'ai-for-engineering/ml-system-design/intro' },
      items: [
        'ai-for-engineering/ml-system-design/the-ml-sd-interview',
        'ai-for-engineering/ml-system-design/recsys-define-the-problem',
        'ai-for-engineering/ml-system-design/recsys-data-pipeline',
        'ai-for-engineering/ml-system-design/recsys-retrieval-two-tower',
        'ai-for-engineering/ml-system-design/recsys-ranking',
        'ai-for-engineering/ml-system-design/recsys-online-serving',
        'ai-for-engineering/ml-system-design/recsys-evaluation-and-ab-testing',
        'ai-for-engineering/ml-system-design/recsys-monitoring-and-retraining',
        'ai-for-engineering/ml-system-design/rag-define-the-problem',
        'ai-for-engineering/ml-system-design/rag-retrieval-and-reranking',
        'ai-for-engineering/ml-system-design/rag-generation-and-serving',
        'ai-for-engineering/ml-system-design/rag-evaluation',
        'ai-for-engineering/ml-system-design/case-ad-ctr-prediction',
        'ai-for-engineering/ml-system-design/case-real-time-fraud-detection',
        'ai-for-engineering/ml-system-design/case-eta-prediction',
        'ai-for-engineering/ml-system-design/case-multimodal-search',
        'ai-for-engineering/ml-system-design/interview-readiness',
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Practice
  // ─────────────────────────────────────────────────────────────────────────
  practice: [
    {
      type: 'category',
      label: 'ML Coding Problems',
      className: 'sidebar-course',
      customProps: { icon: 'code' },
      link: { type: 'doc', id: 'practice/intro' },
      items: [
        {
          type: 'category',
          label: 'Series · Build a GPT',
          items: [
            'practice/build-gpt-01-token-embedding',
            'practice/build-gpt-02-positional-encoding-sinusoidal',
            'practice/build-gpt-03-scaled-dot-product-attention',
            'practice/build-gpt-04-causal-mask',
            'practice/build-gpt-05-multi-head-split-recombine',
            'practice/build-gpt-06-multi-head-attention',
            'practice/build-gpt-07-layer-norm',
            'practice/build-gpt-08-transformer-block-forward',
            // SKILL_INSERT: build-gpt
          ],
        },
        {
          type: 'category',
          label: 'Series · Build a Neural Network',
          items: [
            'practice/build-nn-01-linear-forward',
            'practice/build-nn-02-relu-and-backward',
            'practice/build-nn-03-sigmoid-and-backward',
            'practice/build-nn-04-mse-loss-and-backward',
            'practice/build-nn-05-linear-backward',
            'practice/build-nn-06-sgd-step',
            'practice/build-nn-07-train-mlp-xor',
            // SKILL_INSERT: build-nn
          ],
        },
        {
          type: 'category',
          label: 'Series · Build a CNN',
          items: [
            'practice/build-cnn-01-conv2d-naive',
            'practice/build-cnn-02-conv2d-padding-stride',
            'practice/build-cnn-03-max-pool-2d',
            'practice/build-cnn-04-avg-pool-2d',
            'practice/build-cnn-05-conv2d-backward',
            'practice/build-cnn-06-mini-cnn-forward',
            // SKILL_INSERT: build-cnn
          ],
        },
        {
          type: 'category',
          label: 'Interview Practice',
          items: [
            'practice/softmax-from-scratch',
            'practice/scaled-dot-product-attention',
            'practice/bpe-apply-merges',
            'practice/top-p-sampling',
            'practice/cross-entropy-gradient',
            'practice/temperature-scaling',
            'practice/top-k-sampling',
            'practice/greedy-decode',
            'practice/gelu-forward',
            'practice/gradient-clip-norm',
            'practice/cosine-lr-schedule',
            'practice/sgd-momentum-step',
            'practice/kl-divergence',
            'practice/f1-score',
            'practice/knn-classify',
            'practice/repetition-penalty',
            'practice/gelu-backward',
            'practice/adam-step',
            'practice/adamw-step',
            'practice/label-smoothing-loss',
            'practice/focal-loss',
            'practice/softmax-backward',
            'practice/matmul-backward',
            'practice/batch-norm-forward',
            'practice/byte-level-tokenize',
            'practice/kmeans-step',
            'practice/rnn-cell-forward',
            'practice/rotary-embedding-apply',
            'practice/bpe-train-merges',
            // SKILL_INSERT: interview
          ],
        },
      ],
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // Interview
  // ─────────────────────────────────────────────────────────────────────────
  interview: [
    {
      type: 'category',
      label: 'MLE Interview',
      className: 'sidebar-course',
      customProps: { icon: 'briefcase' },
      link: { type: 'doc', id: 'ai-for-engineering/mle-interview/intro' },
      items: [
        'ai-for-engineering/mle-interview/intro',
        'ai-for-engineering/mle-interview/rubrics-and-playbook',
        {
          type: 'category',
          label: 'Company Interview Guides',
          link: { type: 'doc', id: 'ai-for-engineering/mle-interview/guides/index' },
          items: [
            'ai-for-engineering/mle-interview/guides/recently-asked',
            {
              type: 'category',
              label: 'Meta',
              items: [
                'ai-for-engineering/mle-interview/guides/meta/e3',
                'ai-for-engineering/mle-interview/guides/meta/e4',
                'ai-for-engineering/mle-interview/guides/meta/e5',
              ],
            },
            {
              type: 'category',
              label: 'Google',
              items: [
                'ai-for-engineering/mle-interview/guides/google/l3',
                'ai-for-engineering/mle-interview/guides/google/l4',
                'ai-for-engineering/mle-interview/guides/google/l5',
              ],
            },
            {
              type: 'category',
              label: 'Amazon',
              items: [
                'ai-for-engineering/mle-interview/guides/amazon/sde-i',
                'ai-for-engineering/mle-interview/guides/amazon/sde-ii',
                'ai-for-engineering/mle-interview/guides/amazon/sde-iii',
                'ai-for-engineering/mle-interview/guides/amazon/applied-scientist',
              ],
            },
            {
              type: 'category',
              label: 'Microsoft',
              items: [
                'ai-for-engineering/mle-interview/guides/microsoft/l62',
                'ai-for-engineering/mle-interview/guides/microsoft/l63',
                'ai-for-engineering/mle-interview/guides/microsoft/l64',
                'ai-for-engineering/mle-interview/guides/microsoft/mle',
                'ai-for-engineering/mle-interview/guides/microsoft/applied-scientist',
                'ai-for-engineering/mle-interview/guides/microsoft/ml-research-engineer',
              ],
            },
            {
              type: 'category',
              label: 'Apple',
              items: [
                'ai-for-engineering/mle-interview/guides/apple/ict2',
                'ai-for-engineering/mle-interview/guides/apple/ict3',
                'ai-for-engineering/mle-interview/guides/apple/ict4',
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
