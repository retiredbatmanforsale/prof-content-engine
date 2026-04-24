import type { CourseTopicTreeData } from '@site/src/components/CourseTopicTree';

export const rnnTopicTree: CourseTopicTreeData = {
  prerequisites: [
    {
      title: 'Deep Neural Networks',
      description: 'Layers, backpropagation, activation functions, overfitting',
    },
    {
      title: 'Linear Algebra & Calculus',
      description: 'Matrix multiplication, chain rule, partial derivatives',
    },
  ],
  lessons: [
    {
      id: 'foundations-of-deep-sequence-modeling',
      title: 'Foundations of deep sequence modeling',
      oneLiner: 'History and context matter — ignore them at your peril',
      why: 'Most real data comes in sequences: words, time series, video, DNA. Treating them as independent examples throws away the temporal structure that makes them predictable. This lesson motivates why a whole new family of models is needed.',
      difficulty: 'beginner',
      minutes: 14,
      lessonPrereqs: ['Deep Neural Networks — all lessons'],
    },
    {
      id: 'from-static-networks-to-time-aware',
      title: 'From static networks to time-aware models',
      oneLiner: 'Recurrence lets a network carry memory across time steps',
      why: 'Feedforward networks are blind to history. By introducing a hidden state that recurs at each step, RNNs can accumulate information across a sequence — the conceptual leap that makes long-range dependencies tractable.',
      difficulty: 'beginner',
      minutes: 15,
      lessonPrereqs: ['Lesson 1 — Sequence foundations'],
    },
    {
      id: 'rnn-internal-mechanics',
      title: 'RNN internal mechanics & formal structure',
      oneLiner: 'Shared weights across time; tanh squashes hidden state',
      why: 'RNNs reduce to a few equations: h_t = tanh(W·x_t + U·h_{t-1} + b). Understanding this structure precisely lets you see why they are hard to train and exactly what LSTM and GRU fix.',
      difficulty: 'intermediate',
      minutes: 15,
      lessonPrereqs: ['Lesson 2 — Time-aware models'],
    },
    {
      id: 'bringing-sequence-modeling-real-world',
      title: 'Bringing sequence modeling to the real world',
      oneLiner: 'Words → tokens → embeddings → flow through the RNN',
      why: 'Theory meets practice. You need to know how to vectorise text, handle variable-length sequences, and set up next-token prediction supervision. Without this, RNNs remain abstract mathematics.',
      difficulty: 'intermediate',
      minutes: 15,
      lessonPrereqs: ['Lesson 3 — RNN mechanics'],
    },
    {
      id: 'training-rnn-backprop-through-time',
      title: 'Training RNNs: BPTT & gradient pathologies',
      oneLiner: 'Unroll the RNN through time; gradients vanish or explode',
      why: 'RNNs have a hidden curse: gradients either shrink to zero or blow up as backprop travels through many time steps. Understanding BPTT and these pathologies explains why LSTMs, GRUs, and Transformers exist at all.',
      difficulty: 'advanced',
      minutes: 16,
      lessonPrereqs: ['Lesson 4 — Real-world sequences', 'Backpropagation (DNN course)'],
    },
    {
      id: 'training-an-rnn-in-pytorch',
      title: 'Training an RNN in PyTorch',
      oneLiner: 'nn.RNN, hidden states, autograd BPTT, training loop',
      why: 'Close the gap between math and code. You will write a real training loop, inspect tensor shapes, and watch loss.backward() trigger backprop through time automatically. Theory becomes skill.',
      difficulty: 'intermediate',
      minutes: 17,
      lessonPrereqs: ['Lesson 5 — BPTT'],
    },
  ],
  unlocks: [
    {
      title: 'Attention Is All You Need',
      description: 'Replace recurrence with parallelisable self-attention',
    },
    {
      title: 'LSTMs & GRUs',
      description: 'Gated mechanisms that solve the vanishing gradient problem',
    },
  ],
};
