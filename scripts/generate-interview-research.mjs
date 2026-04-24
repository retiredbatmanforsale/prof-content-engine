/**
 * Generates deep research .md files for interview readiness.
 *
 * For each course that is missing an interview-readiness.mdx, this script
 * calls Claude to produce a structured research report covering what Google,
 * Amazon, Microsoft, Meta, Apple, Netflix, Stripe, Snowflake, and Databricks
 * ask ML engineers about that topic.
 *
 * Output: research/{course-slug}.md  (one file per course)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/generate-interview-research.mjs
 *
 * After reviewing the .md files, hand them to the coding agent:
 *   "Read research/attention-is-all-you-need.md and generate
 *    docs/ai-for-engineering/attention-is-all-you-need/interview-readiness.mdx
 *    using the same InterviewQuestion component pattern as
 *    deep-neural-networks/interview-readiness.mdx"
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RESEARCH_DIR = path.join(ROOT, 'research');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Only the 4 courses missing interview-readiness.mdx.
// deep-neural-networks and foundations-of-regression already have it — skipped.
const COURSES = [
  {
    slug: 'deep-computer-vision-cnn',
    title: 'Deep Computer Vision (CNN)',
    topic: 'Convolutional Neural Networks and Computer Vision',
    keyTopics: [
      'convolution operation: stride, padding, output spatial dimensions',
      'pooling layers and spatial invariance',
      'CNN architectures: VGG, ResNet, EfficientNet — design decisions',
      'transfer learning and fine-tuning strategy',
      'object detection: YOLO, Faster R-CNN, anchor boxes',
      'semantic and instance segmentation',
      'data augmentation for vision tasks',
      'batch normalisation in CNNs',
      'filter visualisation and interpretability',
    ],
  },
  {
    slug: 'deep-sequence-modelling-rnn',
    title: 'Deep Sequence Modelling (RNN)',
    topic: 'Recurrent Neural Networks and Sequence Modelling',
    keyTopics: [
      'RNN architecture, hidden state, and the vanishing gradient problem',
      'LSTM gating: forget, input, output gates and cell state',
      'GRU as a simplified LSTM alternative',
      'backpropagation through time (BPTT) and gradient clipping',
      'sequence-to-sequence models and encoder-decoder with attention',
      'bidirectional RNNs',
      'time-series forecasting and stationarity',
      'when to choose RNN vs Transformer',
    ],
  },
  {
    slug: 'attention-is-all-you-need',
    title: 'Attention Is All You Need (Transformer)',
    topic: 'Transformer Architecture and Attention Mechanisms',
    keyTopics: [
      'self-attention: Q, K, V projections and scaled dot-product',
      'why scaling by 1/sqrt(d_k) matters',
      'multi-head attention: why multiple heads, concatenation and projection',
      'positional encodings: sinusoidal vs learned',
      'encoder stack: self-attention + FFN + LayerNorm + residual',
      'decoder stack: causal masking, cross-attention',
      'encoder-decoder vs decoder-only architectures',
      'O(n^2) complexity and efficient attention alternatives',
    ],
  },
  {
    slug: 'build-and-train-your-own-gpt2-model',
    title: 'Build and Train Your Own GPT-2',
    topic: 'Decoder-Only Transformer and Language Model Pre-training',
    keyTopics: [
      'decoder-only architecture and autoregressive training objective',
      'next-token prediction, cross-entropy loss, and perplexity',
      'byte-pair encoding (BPE) and tokenisation tradeoffs',
      'KV-cache mechanics and inference efficiency',
      'scaling laws: compute-optimal frontier (Chinchilla)',
      'RLHF and instruction fine-tuning (SFT → RM → PPO)',
      'temperature, top-p, and sampling strategies',
      'context length and positional encoding generalisation',
    ],
  },
];

const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple',
  'Netflix', 'Stripe', 'Snowflake', 'Databricks',
];

function buildPrompt(course) {
  return `You are a senior ML engineer who has conducted hundreds of technical interviews at top tech companies and coaches engineers preparing for ML roles.

Generate a comprehensive interview research report for the topic: **${course.topic}**
Course: "${course.title}"

Key concepts this course covers:
${course.keyTopics.map(t => `- ${t}`).join('\n')}

Target companies: ${COMPANIES.join(', ')}

---

Produce exactly 12 interview questions. Distribute them across these 3 thematic sections:

**Section 1 — Fundamentals and Core Mechanics** (4 questions)
Theoretical depth: derivations, mechanics, definitions a strong candidate must know cold.

**Section 2 — Training, Debugging and Optimisation** (4 questions)
Applied: diagnosing training failures, choosing hyperparameters, production tradeoffs.

**Section 3 — System Design and Production** (4 questions)
Architecture and scale: designing ML systems, MLOps, latency/throughput, real-world constraints.

---

For every question use this exact format:

### Q{number}
**Difficulty:** {Fundamentals | Training/Debugging | System Design}
**Companies:** {Company1}, {Company2}, {Company3}
**Question:** {precise, interview-quality question}

**Answer:**
{Detailed model answer. Use bullet points or short paragraphs. Include specific formulas, named techniques, and production considerations. 4–8 points. Write what a strong senior candidate would say — not a textbook, but a real answer under interview conditions.}

---

Rules:
- Assign each question to the 2-3 companies most likely to ask it given their product domain (e.g. Netflix for recommendations, Stripe for fraud/risk, Snowflake/Databricks for data infrastructure).
- Do not invent obscure questions. These should reflect real interview patterns.
- Answers should include tradeoffs, not just definitions.
- For System Design questions, include the key axes a strong answer must cover.
- Start directly with Section 1. No preamble or intro paragraph.`;
}

async function generateForCourse(course) {
  const outputPath = path.join(RESEARCH_DIR, `${course.slug}.md`);

  if (existsSync(outputPath)) {
    console.log(`  skip  ${course.slug}.md  (already exists)`);
    return;
  }

  console.log(`  researching  ${course.title} ...`);

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildPrompt(course) }],
  });

  const body = response.content[0].text;

  const file = [
    `# Interview Research: ${course.title}`,
    `**Topic:** ${course.topic}`,
    `**Generated:** ${new Date().toISOString().split('T')[0]}`,
    `**Companies covered:** ${COMPANIES.join(', ')}`,
    `**Model:** claude-opus-4-7`,
    '',
    '---',
    '',
    body,
    '',
    '---',
    '',
    '## How to use this file',
    '',
    'Review the questions above. Edit, cut, or reorder as needed.',
    'Then hand to the coding agent:',
    '',
    `> "Read research/${course.slug}.md and generate`,
    `> docs/ai-for-engineering/${course.slug}/interview-readiness.mdx`,
    `> using the same InterviewQuestion component pattern as`,
    `> docs/ai-for-engineering/deep-neural-networks/interview-readiness.mdx"`,
  ].join('\n');

  await writeFile(outputPath, file, 'utf-8');
  console.log(`  saved    research/${course.slug}.md`);
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY is not set.');
    process.exit(1);
  }

  await mkdir(RESEARCH_DIR, { recursive: true });

  console.log(`Generating interview research for ${COURSES.length} courses...\n`);

  for (const course of COURSES) {
    await generateForCourse(course);
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\nDone. Review files in research/ then use the coding agent to generate MDX.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
