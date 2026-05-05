import { RecentlyAskedEntry } from '@site/src/components/InterviewGuide';

/**
 * Community-sourced recent interview questions, dated late 2024 – 2026.
 * Sources: Reddit, Medium, Substack, Glassdoor (last 6 months).
 *
 * Convention: keys are `{company-slug}-{level-slug}` matching the guide URL.
 * For multi-level companies, an entry without a level applies to all levels.
 */

const TODAY = '2026-05-04';

// AI labs & foundation model companies
export const openaiMTS: RecentlyAskedEntry = {
  companySlug: 'openai',
  company: 'OpenAI',
  level: 'MTS',
  signatureRound:
    'Production-oriented coding round (not algorithm puzzles). Build a small but real system component (in-memory DB, KV store with serialization, multithreaded crawler, spreadsheet engine) where one problem unfolds into 3–4 sub-problems over 60–75 minutes. The spec is intentionally underspecified — you must clarify, make assumptions, handle edge cases, and extend cleanly when the interviewer drops a new requirement.',
  bar: 'Production-leaning code under spec ambiguity. Clean extensibility is rewarded — the next sub-problem typically requires modifying your data model. System design carries enormous weight at L5/Staff: scalability, latency, cost, and safety simultaneously. Speed and clever tricks score lower than clarity, communication, and graceful handling of moving requirements.',
  trends: [
    'Shift away from LeetCode toward "real component" questions — KV stores, spreadsheet evaluators, streaming pipelines.',
    'LLM-aware system design — ChatGPT-scale chat, sharded training, LLM-powered enterprise search replace generic feed/timeline designs.',
    'Heavier weighting of an ML/research-discussion round for MTS — DL fundamentals + paper/project deep dive even for SWE-flavor MTS.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement serialize/deserialize for a key-value store where keys and values can contain any characters, including delimiters (length-prefix encoding solution expected, like Redis RESP).',
      source: 'hellointerview.com',
      href: 'https://www.hellointerview.com/blog/openai-coding-questions',
      dateObserved: '2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Design a credit-tracking service that supports adding credits, expiring credits, and consuming credits — must always consume the credits that expire soonest first.',
      source: 'hellointerview.com',
      href: 'https://www.hellointerview.com/guides/openai/l5',
      dateObserved: '2025–2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Build a model training pipeline for streaming data — must support checkpointing/resume, multiple concurrent workers, exception logging, and data consistency.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/openai-interview-process/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design a distributed training platform for foundation models — sharded training, logging, fault tolerance, model + data versioning.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/openai-interview-process/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt: 'How would you design ChatGPT to handle 100 million users?',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/openai-system-design-interview-2025-real-questions-tips',
      dateObserved: 'Dec 2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement a simplified spreadsheet API with getCell/setCell where getCell is O(1) — forcing proactive propagation of dependent updates on every write.',
      source: 'hellointerview.com',
      href: 'https://www.hellointerview.com/blog/openai-coding-questions',
      dateObserved: '2025',
      confidence: 'medium',
    },
  ],
  sources: [
    'https://www.hellointerview.com/blog/openai-coding-questions',
    'https://www.hellointerview.com/guides/openai/l5',
    'https://www.linkjob.ai/interview-questions/openai-system-design-interview-2025-real-questions-tips',
  ],
  lastUpdated: TODAY,
};

export const anthropicSWE: RecentlyAskedEntry = {
  companySlug: 'anthropic',
  company: 'Anthropic',
  level: 'SWE / Research Engineer',
  signatureRound:
    '90-minute progressive-spec coding assessment on CodeSignal: one problem with four escalating levels where each tier adds new requirements that mutate the data model. Code must pass a black-box evaluator at level N before level N+1 unlocks. In-loop coding rounds repeatedly probe data mutation, concurrency, and multithreading — first-principles thinking and writing extremely robust, safe code. The values/culture round is also a known filter on safety reasoning and Anthropic-mission fit.',
  bar: 'Production-quality robustness and adaptability under spec churn. Clean modular code that absorbs each new requirement without collapsing — 100% correctness required to advance levels. First-principles framing means throughput-style LeetCode practice does not transfer; what matters is whether you can write code an Anthropic engineer would trust in production.',
  trends: [
    'Safety/alignment values round is now a known filter — recruiters openly say it\'s where most candidates fail; expect specific probes on Responsible Scaling Policy and interpretability.',
    'LLM-serving system design has entered the loop — billion-doc + LLM-inference QPS prompts have replaced generic "design Twitter" questions.',
    'OA defenses against memorization — interviewers are alert to over-rehearsed bank-transactions solutions; variants and twist-ups (TTL, compression tier) appear more frequently.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'In-memory database with progressive levels: L1 SET/GET/DELETE; L2 add SCAN and SCAN_BY_PREFIX with sorted output; L3 add SET_AT_WITH_TTL with time-based expiration; L4 add file compression with user ownership, quota validation, and decompression state.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/anthropic-software-engineer-interview/',
      dateObserved: '2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement a banking system in tiers: Tier 1 deposits/transfers; Tier 2 top-k account metrics; later tiers add scheduled payments and rollback.',
      source: 'interviewing.io',
      href: 'https://interviewing.io/anthropic-interview-questions',
      dateObserved: '2025–2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement a BFS web crawler over a single domain, first synchronous, then optimized with multithreading/async — must handle robots.txt, rate-limiting, and circular references.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/anthropic-coding-interview/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design a distributed search system handling 1B documents and 1M QPS, while also serving LLM inference for 10K+ requests/sec.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/anthropic-software-engineer-interview/',
      dateObserved: '2026',
    },
    {
      type: 'behavioral',
      prompt:
        'Tell me about a time when you made a safety-related decision in a project. How does Anthropic\'s focus on AI safety and interpretability differ from other major AI labs?',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/anthropic-software-engineer-interview/',
      dateObserved: '2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Convert sampling-profiler stack-trace data into timeline start/end events, handling recursive calls and reverse ordering ("Stack Trace" / "Profiler Trace" problem).',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/anthropic-coding-interview/',
      dateObserved: '2026',
    },
  ],
  sources: [
    'https://www.linkjob.ai/interview-questions/anthropic-software-engineer-interview/',
    'https://interviewing.io/anthropic-interview-questions',
    'https://www.linkjob.ai/interview-questions/anthropic-coding-interview/',
  ],
  lastUpdated: TODAY,
};

export const deepmindRE: RecentlyAskedEntry = {
  companySlug: 'deepmind',
  company: 'DeepMind',
  level: 'Research Engineer',
  signatureRound:
    'ML breadth-and-depth "quiz" round — fast conversational pass through fundamentals (linear algebra, calculus, optimization, regularization, transformers, training/inference practicalities). Probes whether you can give a structured "overview" response and then go deep on any branch. Paired with an ML design round + lead-researcher conversation: research fluency, architectural reasoning, debugging an underperforming model, paper discussion.',
  bar: 'Research fluency and translation of theory to code. Coding bar is roughly LeetCode-medium with an ML twist (implement from scratch, no libraries) — about whether you can implement the math you just discussed. Lead-researcher conversation is effectively a research collaboration audition.',
  trends: [
    'From-scratch implementation rounds remain central — K-means, AUC, multi-head attention, transformer layer in vanilla Python/PyTorch.',
    'Distributed-training depth is rising — data/pipeline/tensor parallelism, quantization, KV caching in ML system design rounds (post-Gemini scale-up).',
    'Tensor-shape and broadcasting debugging — model-doesn\'t-learn diagnostic exercises (data-loader shuffle bugs, masking issues, broadcasting errors).',
  ],
  questions: [
    {
      type: 'ml-theory',
      prompt:
        'AlphaFold-like molecule modeling problem — what architecture would you choose, what normalization layers, why?',
      source: 'interviewnode.com',
      href: 'https://www.interviewnode.com/post/google-deepmind-ml-interview-prep-what-to-expect-and-how-to-prepare',
      dateObserved: '2025',
      confidence: 'medium',
    },
    {
      type: 'ml-theory',
      prompt:
        'Distinguish L1 vs. L2 regularization in practice; explain overfitting mitigation; articulate RL intuitions — fast-fire breadth-quiz format.',
      source: 'interviewnode.com',
      href: 'https://www.interviewnode.com/post/google-deepmind-ml-interview-prep-what-to-expect-and-how-to-prepare',
      dateObserved: '2025',
      confidence: 'medium',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Implement gradient descent for logistic regression from scratch (no sklearn); implement a hash map from scratch; merge overlapping intervals.',
      source: 'interviewnode.com',
      href: 'https://www.interviewnode.com/post/google-deepmind-ml-interview-prep-what-to-expect-and-how-to-prepare',
      dateObserved: '2025',
      confidence: 'medium',
    },
    {
      type: 'system-design',
      prompt:
        'Design a distributed training pipeline for terabyte-scale datasets; scale a recommendation system to billions of queries.',
      source: 'interviewnode.com',
      href: 'https://www.interviewnode.com/post/google-deepmind-ml-interview-prep-what-to-expect-and-how-to-prepare',
      dateObserved: '2025',
      confidence: 'medium',
    },
  ],
  sources: [
    'https://asmekal.github.io/blog/posts/interviews-2025-ml-research-engineer-uk',
    'https://www.interviewnode.com/post/google-deepmind-ml-interview-prep-what-to-expect-and-how-to-prepare',
    'https://www.sundeepteki.org/advice/the-ultimate-ai-research-engineer-interview-guide-cracking-openai-anthropic-google-deepmind-top-ai-labs',
  ],
  lastUpdated: TODAY,
};

export const mistralSWE: RecentlyAskedEntry = {
  companySlug: 'mistral',
  company: 'Mistral',
  level: 'SWE / MLE',
  signatureRound:
    "PyTorch live-coding round where you implement transformer components from scratch — most commonly Multi-Head Self-Attention with a causal mask, batched. Paired with an LLM fundamentals quiz (MHA vs GQA vs MQA, KV cache, RoPE, FSDP). Mistral expects you to type out a transformer block from memory and defend every design choice.",
  bar: "From-scratch model implementation is weighted more heavily than at almost any other AI lab. If you can't type a transformer block in PyTorch under time pressure, you don't pass. Research literacy is assumed; LeetCode polish is not rewarded.",
  trends: [
    'From-scratch transformer rounds are now table stakes (MHSA, then GQA/MQA variants).',
    'High-throughput inference system design has displaced classic distributed-systems prompts (batch token serving, prefix caching, tensor parallelism).',
    'On-device / edge framing is creeping in (AWQ, GPTQ, small-model distillation, serving 7B on constrained hardware).',
  ],
  questions: [
    {
      type: 'ml-theory',
      prompt:
        'Explain the difference between MHA, GQA, and MQA, and explain when KV cache applies (inference only, not training).',
      source: 'jointaro.com',
      href: 'https://www.jointaro.com/interviews/companies/mistral-ai/experiences/ai-engineer-paris-july-1-2025-no-offer-negative-1ac7b2a9/',
      dateObserved: 'Jul 2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement Multi-Head Self-Attention from scratch in PyTorch — batched, with a causal mask.',
      source: 'jointaro.com',
      href: 'https://www.jointaro.com/interviews/companies/mistral-ai/experiences/ai-engineer-paris-july-1-2025-no-offer-negative-1ac7b2a9/',
      dateObserved: 'Jul 2025',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Pair-program: debug a broken transformer block (the bug is intentionally seeded into a forward pass).',
      source: 'jointaro.com',
      href: 'https://www.jointaro.com/interviews/companies/mistral-ai/experiences/ai-engineer-paris-july-1-2025-no-offer-negative-1ac7b2a9/',
      dateObserved: 'Jul 2025',
    },
    {
      type: 'system-design',
      prompt:
        'Design a PDF-to-Markdown inference API (throughput, batching, model-serving topology).',
      source: 'prachub.com',
      href: 'https://prachub.com/companies/mistral-ai',
      dateObserved: 'Sep 2025',
    },
    {
      type: 'system-design',
      prompt: 'Build and design a Mistral-based RAG agent end-to-end.',
      source: 'prachub.com',
      href: 'https://prachub.com/companies/mistral-ai',
      dateObserved: 'Apr 2026',
    },
  ],
  sources: [
    'https://www.jointaro.com/interviews/companies/mistral-ai/experiences/ai-engineer-paris-july-1-2025-no-offer-negative-1ac7b2a9/',
    'https://prachub.com/companies/mistral-ai',
    'https://www.glassdoor.com/Interview/Mistral-AI-Interview-Questions-E9945031.htm',
  ],
  lastUpdated: TODAY,
};

export const cohereSWE: RecentlyAskedEntry = {
  companySlug: 'cohere',
  company: 'Cohere',
  level: 'SWE / MLE',
  signatureRound:
    '48-hour take-home case study sandwiched between an OA and a virtual onsite. The case is consistently a production LLM ops problem (debug a RAG system, design a freshness/citation pipeline, optimize batch inference). The follow-up onsite walks through your write-up and pushes on engineering tradeoffs (chunking strategy, retrieval evaluation, abstain logic, eval harness design).',
  bar: 'Cohere weights applied retrieval and production LLM debugging skill more than novel research. The bar is "can this person own a RAG stack in prod and reason about why it\'s hallucinating today?" System design heavily favors evals, observability, and freshness handling.',
  trends: [
    'Retrieval/RAG-as-system-design has become the dominant prompt shape; URL-shortener questions still appear but as warm-ups.',
    'Eval-first thinking — interviewers explicitly probe how you\'d measure retrieval quality and detect regressions, not just how you\'d build the bot.',
    'Take-home + onsite walkthrough is consistent across 2025–2026 reports; expect to defend data-cleaning and chunking choices, not just model choice.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Given a real-time stream of strings, remove duplicates without storing the full stream in memory.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/cohere-interview-process-and-questions/',
      dateObserved: '2026',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Find the longest substring without repeating characters (warm-up before LLM-flavored coding).',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/cohere-interview-process-and-questions/',
      dateObserved: '2026',
    },
    {
      type: 'ml-theory',
      prompt:
        'Design a mechanism that lets an LLM-based system answer questions about events that occurred after its training cutoff.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/cohere-interview-process-and-questions/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'A Cohere-based enterprise support bot with RAG over 200k internal docs gives confident wrong answers after a policy update — what do you trace, what control points (freshness filters, citation-required, abstain on low coverage) do you ship first?',
      source: 'datainterview.com',
      href: 'https://www.datainterview.com/blog/cohere-ai-engineer-interview',
      dateObserved: '2026',
    },
    {
      type: 'ml-theory',
      prompt:
        'Optimize throughput of a batch inference pipeline given fixed token-budget and batch-size constraints.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/cohere-interview-process-and-questions/',
      dateObserved: '2026',
    },
  ],
  sources: [
    'https://www.linkjob.ai/interview-questions/cohere-interview-process-and-questions/',
    'https://www.datainterview.com/blog/cohere-ai-engineer-interview',
    'https://www.glassdoor.com/Interview/Cohere-Interview-Questions-E6413613.htm',
  ],
  lastUpdated: TODAY,
};

export const huggingfaceMLE: RecentlyAskedEntry = {
  companySlug: 'huggingface',
  company: 'Hugging Face',
  level: 'MLE',
  signatureRound:
    'Open-ended, untimed take-home — "build something tangible with HF tools" (Spaces demo, dataset card, fine-tuning notebook, or for customer-facing roles a mock customer email + Python notebook). Followed by a conversational walkthrough, not adversarial grilling. No LeetCode loop. Reviewers explicitly look for open-source instincts (clean repos, good READMEs, willingness to extend HF libraries).',
  bar: 'Open-source contribution evidence and library fluency above almost everything else. The bar is "would I want to merge this person\'s PR?" Code-review literacy (reviewing a transformers PR, reasoning about backward compatibility) is a hidden but consistent signal.',
  trends: [
    'Library / framework PR review as soft interview signal — candidates discuss a real PR (theirs or HF\'s) and design tradeoffs.',
    'No LeetCode remains a stable, distinguishing feature; coding shows up only inside take-homes anchored to real HF tooling.',
    'Open-source passion in the cover letter is gatekeeping — application review explicitly filters on articulated OSS passion.',
  ],
  questions: [
    {
      type: 'behavioral',
      prompt:
        'Walk through a time you contributed to an open-source ML project — what was the PR, why did the maintainer accept or reject it, and what did you learn about the codebase?',
      source: 'interviewquery.com',
      href: 'https://www.interviewquery.com/interview-guides/huggingface-machine-learning-engineer',
      dateObserved: '2025',
    },
    {
      type: 'ml-theory',
      prompt:
        'Explain how you\'d evaluate a fine-tuned model — which metrics, which holdout strategy, and how would you detect overfitting on a small dataset?',
      source: 'interviewquery.com',
      href: 'https://www.interviewquery.com/interview-guides/huggingface-machine-learning-engineer',
      dateObserved: '2025',
    },
    {
      type: 'coding',
      prompt:
        'Take-home: imagine a customer has emailed you a question about using transformers for [task X]. Write the email reply and a Python notebook demonstrating the answer end-to-end.',
      source: 'getbridged.co',
      href: 'https://www.getbridged.co/company-reviews/hugging-face',
      dateObserved: '2025',
    },
  ],
  sources: [
    'https://www.interviewquery.com/interview-guides/huggingface-machine-learning-engineer',
    'https://www.getbridged.co/company-reviews/hugging-face',
    'https://huggingface.co/blog/lewis-tunstall-interview',
  ],
  lastUpdated: TODAY,
};

// High-bar tech companies
export const databricksSWE: RecentlyAskedEntry = {
  companySlug: 'databricks',
  company: 'Databricks',
  level: 'SWE',
  signatureRound:
    'Platform-depth round beyond generic LeetCode. Probes memory management, distributed state, and thread-safety, then layers on data-platform themes: Spark internals (executors, shuffles, skew), Delta Lake (ACID, schema evolution, time travel), and MLflow (tracking, registry, serving). For 2026, the bar shifted toward Mosaic AI / Agent Framework — LLM serving, RAG on the lakehouse, agent-orchestration correctness against Delta tables.',
  bar: 'Compound-AI / multi-model orchestration depth. They want you to talk like someone who has run an agent against a SQL warehouse (typed tool contracts, write-ahead logs, max-step budgets, deterministic run IDs) and someone who knows where Spark falls over (skew, broadcast thresholds, shuffle hashing). Hand-waving evaluation is the most common failure mode.',
  trends: [
    'Agentic system design rounds tied to Mosaic AI Agent Framework + Delta as state store.',
    'LLM-as-judge / eval pipelines are now table-stakes; "name the metric" is a real filter.',
    'Lakehouse architecture (Bronze/Silver/Gold + Unity Catalog RBAC) showing up in nearly every senior loop.',
  ],
  questions: [
    {
      type: 'system-design',
      prompt:
        'Design an agent that answers questions, runs multi-step analysis, and writes results back to a Delta table; explain how you guarantee correctness, idempotency, and debuggability when tool calls fail or the model loops.',
      source: 'datainterview.com',
      href: 'https://www.datainterview.com/blog/databricks-machine-learning-engineer-interview',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design a real-time fraud detection system using Spark Structured Streaming consuming Kafka, with MLflow model inference and Delta Lake ACID guarantees.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/databricks-system-design-interview/',
      dateObserved: '2026',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Implement a snapshot iterator over a set such that adding/removing elements does not affect existing iterators; optimize space across many snapshots.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/databricks-software-engineer-interview',
      dateObserved: '2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Build a thread-safe LRU cache with TTL handling concurrent access; defend your locking strategy under high load.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/databricks-software-engineer-interview',
      dateObserved: '2026',
    },
    {
      type: 'ml-theory',
      prompt:
        'Defend fine-tuning vs. prompting tradeoffs for a Mosaic AI use case; how do you wire faithfulness/groundedness/relevance metrics into an LLM-as-judge MLflow pipeline?',
      source: 'databricks.com',
      href: 'https://www.databricks.com/blog/mosaic-ai-announcements-data-ai-summit-2025',
      dateObserved: 'Late 2025',
    },
  ],
  sources: [
    'https://www.datainterview.com/blog/databricks-machine-learning-engineer-interview',
    'https://www.linkjob.ai/interview-questions/databricks-system-design-interview/',
    'https://www.tryexponent.com/blog/databricks-interview-process',
  ],
  lastUpdated: TODAY,
};

export const stripeSWE: RecentlyAskedEntry = {
  companySlug: 'stripe',
  company: 'Stripe',
  level: 'SWE',
  signatureRound:
    'Integration Round — dropped into a private GitHub repo with full internet access, given Stripe\'s API and docs, and asked to build something real in ~2 hours: Connect onboarding flow, webhook handler with idempotency, subscription billing with proration. The grader cares whether you read the docs before guessing, handle error paths before the happy path, and write code a teammate could ship. Paired with a Bug Squash where a generic version of a real Stripe production bug (often a race condition or idempotency violation) is dropped in front of you.',
  bar: 'Unusually writing-heavy. Bug-squash plus integration realism — production-reasonable code under time pressure with real docs in front of you. Everyone passes the LeetCode portion; the integration round is where strong candidates fail because they treat it like a coding puzzle instead of an engineering project. PCI-style security thinking and idempotency on retry paths are repeatedly graded.',
  trends: [
    'More integration prompts touching Stripe\'s own surface area (Connect, Billing, Webhooks) versus older "build a generic CSV parser" framing.',
    'AI-coding-assistant usage is allowed in the integration round but graded — candidates report being penalized for accepting AI suggestions without reading them.',
    'Bug Squash prompts increasingly target concurrency/race-condition bugs rather than null-pointer style bugs.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        '"BikeMap": read three JSON files, convert to dictionaries, perform back-and-forth ETL across 5 incremental requirements (~3.9 of 5 passing was typical at round end).',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/stripe-integration-round/',
      dateObserved: 'Dec 2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement a webhook handler for Stripe events with idempotency guarantees and correct error responses on retry.',
      source: 'prepfully.com',
      href: 'https://prepfully.com/interview-guides/stripe-software-engineer',
      dateObserved: 'Apr 2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Build a function that onboards a merchant via Stripe Connect API, handling incomplete or failed verification scenarios.',
      source: 'prepfully.com',
      href: 'https://prepfully.com/interview-guides/stripe-software-engineer',
      dateObserved: 'Apr 2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design an idempotent payment system using API-layer idempotency keys and DB unique constraints on (user_id, order_id) under concurrent requests.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/stripe-software-engineer-interview/',
      dateObserved: 'Feb 2026',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Currency conversion: model currencies as graph nodes with exchange-rate weighted edges; find a conversion path between any two currencies (BFS/DFS).',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/stripe-software-engineer-interview/',
      dateObserved: 'Feb 2026',
    },
    {
      type: 'behavioral',
      prompt:
        'Tell me about a time you received hard criticism on code you owned — paired with Stripe-values alignment probing.',
      source: 'medium.com',
      href: 'https://medium.com/@diyaag2020/my-stripe-interview-experience-2025-2026-a-journey-to-the-final-round-19990fa6876a',
      dateObserved: '2025–2026',
    },
  ],
  sources: [
    'https://medium.com/@diyaag2020/my-stripe-interview-experience-2025-2026-a-journey-to-the-final-round-19990fa6876a',
    'https://www.linkjob.ai/interview-questions/stripe-integration-round/',
    'https://prepfully.com/interview-guides/stripe-software-engineer',
  ],
  lastUpdated: TODAY,
};

export const netflixSWE: RecentlyAskedEntry = {
  companySlug: 'netflix',
  company: 'Netflix',
  level: 'Senior SWE',
  signatureRound:
    '"Dream Team" round — director-led behavioral interview, more intense than standard, that probes scale of ownership, accountability, candor, and high-risk/reward judgment. They expect you to have read (not skimmed) the culture memo and come with crisp, metric-grounded stories about owning something end-to-end and disagreeing-then-committing. System design is unusually weighted — Netflix favors "reverse system design" where the interviewer interrogates a real system you previously built at scale. Security gets its own round more often than at peer companies.',
  bar: 'No junior bar — the culture gate is real and tanks otherwise-strong candidates. Coding is medium-hard but not the discriminator; system design and Dream Team are. Interviewers explicitly look for "stars" because Netflix hires far less than other FAANGs. If you cannot tell stories with metrics and tradeoff reasoning, the loop ends regardless of how cleanly you coded.',
  trends: [
    'More security-focused system design rounds (a Netflix-unique pattern that intensified post-2024 incident landscape).',
    'Reverse system design ("walk me through a system YOU built at scale, then defend its choices") increasingly the dominant SD format.',
    'Coding rounds emphasize speed + clarifying-question quality on intentionally vague prompts; AI-assistant proficiency implicitly assumed but not formally tested.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Implement a content manager system with CRUD operations — intentionally vague; clarifying questions are scored.',
      source: 'jointaro.com',
      href: 'https://www.jointaro.com/interviews/companies/netflix/experiences/senior-software-engineer-united-states-january-22-2025-no-offer-positive-b131bf1d/',
      dateObserved: 'Jan 2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Recover a Binary Search Tree where two elements have been swapped; restore in O(1) extra space.',
      source: 'interviewing.io',
      href: 'https://interviewing.io/guides/hiring-process/netflix',
      dateObserved: '2025',
    },
    {
      type: 'system-design',
      prompt:
        'Design a fault-tolerant streaming service with regional failover; defend your availability target ("Netflix never wants to go down").',
      source: 'prepfully.com',
      href: 'https://prepfully.com/interview-guides/netflix-software-engineer',
      dateObserved: '2025',
    },
    {
      type: 'behavioral',
      prompt:
        'Tell me about a hard decision you made without complete information — probed for judgment under ambiguity.',
      source: 'prepfully.com',
      href: 'https://prepfully.com/interview-guides/netflix-software-engineer',
      dateObserved: '2025',
    },
    {
      type: 'behavioral',
      prompt:
        'What aspects of the Netflix culture memo resonated with you, and where do you disagree? Disagreement is welcomed; absence of opinion is not.',
      source: 'interviewing.io',
      href: 'https://interviewing.io/guides/hiring-process/netflix',
      dateObserved: '2025',
    },
  ],
  sources: [
    'https://interviewing.io/guides/hiring-process/netflix',
    'https://www.jointaro.com/interviews/companies/netflix/experiences/senior-software-engineer-united-states-january-22-2025-no-offer-positive-b131bf1d/',
    'https://prepfully.com/interview-guides/netflix-software-engineer',
  ],
  lastUpdated: TODAY,
};

export const airbnbSWE: RecentlyAskedEntry = {
  companySlug: 'airbnb',
  company: 'Airbnb',
  level: 'L4 / L5',
  signatureRound:
    'Cross-Functional (XFN) round — sometimes called Core Values / Values & Culture loop. Famous for tanking technically strong candidates. The on-site is 4–6 interviews on the same day (often half virtual / half SF campus) including a cross-functional partner round (PM, design, data) plus two dedicated Core Values interviews. The signal: product-mindedness, mission alignment, ability to collaborate across functions — not just technical chops. Hiring committee calibrates L4 vs L5 within 24 hours after the loop.',
  bar: 'Airbnb XFN can tank strong technical loops — most-repeated piece of community feedback. Technically the bar is medium-to-hard LeetCode plus one architecture round. What surprises people: a "fine" XFN signal is not enough. They want enthusiasm, narrative coherence about why Airbnb, demonstrated cross-functional collaboration. L4/L5 calibration happens after the loop, so candidates can\'t aim at a target.',
  trends: [
    '2025 hiring emphasizes values alignment, collaboration, adaptability to cross-functional work — increased weight on storytelling and mission-driven motivation.',
    'More architecture interviews added on top of the standard loop for senior candidates (multiple reports of "two architecture + business partner + two core values").',
    'Take-home component (HackerRank coding challenge with no pseudocode allowed) increasingly common as a pre-onsite filter.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Find all combinations of numbers in an array that sum to a target value (variant of subset-sum / combination sum).',
      source: 'interviewquery.com',
      href: 'https://www.interviewquery.com/interview-guides/airbnb',
      dateObserved: '2025',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Friendship timeline matching: given two users\' event timelines, find overlapping intervals where they were friends and active simultaneously.',
      source: 'interviewquery.com',
      href: 'https://www.interviewquery.com/interview-guides/airbnb',
      dateObserved: '2025',
    },
    {
      type: 'system-design',
      prompt:
        'Design an ETL pipeline and database schema for tracking listing-state changes over time with point-in-time queries.',
      source: 'interviewquery.com',
      href: 'https://www.interviewquery.com/interview-guides/airbnb',
      dateObserved: '2025',
      confidence: 'medium',
    },
    {
      type: 'behavioral',
      prompt:
        'Tell me about a time you disagreed with a PM or designer and how you reached a decision — STAR-method response expected; mission/belonging framing scored.',
      source: 'designgurus.io',
      href: 'https://www.designgurus.io/answers/detail/what-is-airbnb-interview-process-reddit',
      dateObserved: '2025',
    },
    {
      type: 'behavioral',
      prompt:
        'Why Airbnb specifically, and how does your work history reflect their mission of belonging? Vague answers fail this round even when coding is strong.',
      source: 'tryexponent.com',
      href: 'https://www.tryexponent.com/blog/airbnb-interview-process',
      dateObserved: '2025',
    },
  ],
  sources: [
    'https://www.interviewquery.com/interview-guides/airbnb',
    'https://www.designgurus.io/answers/detail/what-is-airbnb-interview-process-reddit',
    'https://www.tryexponent.com/blog/airbnb-interview-process',
  ],
  lastUpdated: TODAY,
};

export const uberSWE: RecentlyAskedEntry = {
  companySlug: 'uber',
  company: 'Uber',
  level: 'L4 / L5',
  signatureRound:
    'Real-time marketplace system design — almost always graded by a Staff or Sr. Staff engineer. Greenfield prompt drawn from Uber\'s actual production surfaces (dispatch, surge, ETA, real-time location ingest). Expected to clarify, estimate QPS/storage, choose a spatial index (Geohash, S2, quadtree), pick streaming substrate (Kafka + Flink), defend trade-offs around latency budgets, eventual vs strong consistency, and failure modes (ghost drivers, GPS spoofing, double-assignment race conditions). For L5, bleeds into rapid-fire deep-dive pressure-testing tech choices until reasoning breaks.',
  bar: 'Real-time-systems instinct: spatial indexing, stream processing, idempotency, graceful degradation under partial failure. L4 needs solid coding + one credible HLD; L5 must actively negotiate trade-offs (consistency models, partitioning by geo) against an interviewer who has shipped these in prod. Coding-round 1 is an elimination gate.',
  trends: [
    'Heavier emphasis on real-time ML features in the marketplace (surge prediction, ETA, fraud signals) folded into system design.',
    'Domain-specific probes: GPS spoofing detection, double-charge prevention via idempotency keys, ghost-driver detection via heartbeat state machines.',
    'Bar Raiser round increasingly weights cross-functional thinking and product reasoning across Rides / Eats / Freight.',
  ],
  questions: [
    {
      type: 'system-design',
      prompt:
        'Design Uber\'s real-time dispatch: match riders to drivers in <1–2s, support 1M concurrent users and 500K active drivers with 4-second location heartbeats.',
      source: 'techinterview.org',
      href: 'https://www.techinterview.org/post/3233460273/uber-interview-guide-2026-dispatch-systems-geospatial-algorithms-and-marketplace-engineering/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design surge pricing: aggregate supply/demand per geofence in real time using stream processing with sliding windows.',
      source: 'jobright.ai',
      href: 'https://jobright.ai/blog/uber-technical-interview-questions-complete-guide-2026/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt: 'Build a real-time heatmap of driver locations for a ride-hailing platform.',
      source: 'getsdeready.com',
      href: 'https://getsdeready.com/top-uber-system-design-interview-questions-and-how-to-prepare/',
      dateObserved: '2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'LC 787 Cheapest Flights Within K Stops, and LC 1334 Find the City With the Smallest Number of Neighbors at a Threshold Distance — graph + shortest-path patterns mirroring Uber routing.',
      source: 'techinterview.org',
      href: 'https://www.techinterview.org/post/3233460273/uber-interview-guide-2026-dispatch-systems-geospatial-algorithms-and-marketplace-engineering/',
      dateObserved: '2026',
    },
    {
      type: 'behavioral',
      prompt:
        'Walk through a previously designed system: design decisions, what you\'d change, what you learned (Manager / Bar Raiser round).',
      source: 'medium.com',
      href: 'https://medium.com/@rajatgoyal715/my-interview-experience-at-uber-l5a-offer-sr-software-engineer-c8f9fc8451b7',
      dateObserved: '2025',
    },
  ],
  sources: [
    'https://www.techinterview.org/post/3233460273/uber-interview-guide-2026-dispatch-systems-geospatial-algorithms-and-marketplace-engineering/',
    'https://medium.com/@rajatgoyal715/my-interview-experience-at-uber-l5a-offer-sr-software-engineer-c8f9fc8451b7',
    'https://www.glassdoor.com/Interview/Uber-Software-Engineer-Interview-Questions-EI_IE575263.0,4_KO5,22.htm',
  ],
  lastUpdated: TODAY,
};

export const linkedinSWE: RecentlyAskedEntry = {
  companySlug: 'linkedin',
  company: 'LinkedIn',
  level: 'Senior SWE',
  signatureRound:
    'Graph/recsys-flavored system design + centralized hiring committee review. HLD round structured around LinkedIn\'s product surfaces (feed ranking, PYMK, job recs, search) where graph traversal, multi-stage ranking (FPRs → Second Pass Ranker), and freshness-vs-cost trade-offs are core. Communication weight is unusually high — dedicated "Technical Communications" round on top of behavioral. Final decisions made by committee reading every interviewer\'s packet. New since 2025: separate "coding with AI" round.',
  bar: 'Graph/recsys depth paired with strong communication. Want a senior engineer who can speak fluently about candidate generation, ranking models, freshness, and re-ranking — not just whiteboard a Twitter clone. Hiring-committee review means weak signal on any round (especially Tech Comms or Behavioral) can kill an otherwise strong loop.',
  trends: [
    'Adoption of the 360Brew foundation model for unified ranking across feed, jobs, PYMK, and ads is fair game in system design.',
    'Formal "coding with AI" round added to onsite in 2025 — pair with an AI assistant; graded on orchestration, prompt clarity, verification rigor.',
    'AI features inside the product (AI-assisted writing, recruiter copilots) surfacing in product-design stretch questions for senior+ candidates.',
  ],
  questions: [
    {
      type: 'system-design',
      prompt:
        'Design LinkedIn\'s news feed for ~1B users, including First Pass Rankers and a Second Pass Ranker (feed mixer).',
      source: 'systemdesignhandbook.com',
      href: 'https://www.systemdesignhandbook.com/guides/linkedin-system-design-interview/',
      dateObserved: '2025–2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design People You May Know (PYMK): multi-stage ranking, diversity/fairness re-ranking, latency budget.',
      source: 'systemdesignhandbook.com',
      href: 'https://www.systemdesignhandbook.com/guides/linkedin-system-design-interview/',
      dateObserved: '2025',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Given an undirected graph, find the number of connected components / connected groups (LeetCode-medium variant).',
      source: 'prepfully.com',
      href: 'https://prepfully.com/interview-guides/linkedin-software-engineer-interview',
      dateObserved: 'Sep 2025',
    },
    {
      type: 'coding',
      difficulty: 'medium',
      prompt:
        'Max Consecutive Ones III ("flip K zeros to get the longest run of ones"), with a follow-up extending it to a circular array.',
      source: 'linkjob.ai',
      href: 'https://www.linkjob.ai/interview-questions/linkedin-software-engineer-interview-questions',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'Caching strategies (write-through vs. write-back vs. write-around) and threads vs. processes — asked alongside graph problems in the technical phone screen.',
      source: 'prepfully.com',
      href: 'https://prepfully.com/interview-guides/linkedin-software-engineer-interview',
      dateObserved: 'Sep 2025',
    },
  ],
  sources: [
    'https://www.systemdesignhandbook.com/guides/linkedin-system-design-interview/',
    'https://prepfully.com/interview-guides/linkedin-software-engineer-interview',
    'https://www.glassdoor.com/Interview/LinkedIn-Senior-Software-Engineer-Interview-Questions-EI_IE34865.0,8_KO9,33_IP6.htm',
  ],
  lastUpdated: TODAY,
};

export const nvidiaSWE: RecentlyAskedEntry = {
  companySlug: 'nvidia',
  company: 'NVIDIA',
  level: 'SWE / DL Performance',
  signatureRound:
    'GPU/CUDA kernel-optimization deep-dive. Tests an actual mental model of the hardware: thread hierarchy (thread → warp → block → grid), occupancy, memory hierarchy (registers → shared/SRAM → L1/L2 → DRAM) with realistic latency/bandwidth numbers, warp divergence, memory coalescing. After a baseline problem (GEMM, reduction, softmax), interviewer pivots: "how does this behave under memory pressure?", "where does this become bandwidth-bound vs compute-bound?", "how would you move this to Tensor Cores?". For compiler/inference roles: kernel fusion, KV-cache layout, quantization.',
  bar: 'GPU-first reasoning is non-negotiable for kernel/compiler/inference roles. Bar is not "can you write CUDA" but "can you reason about hardware — bandwidth, occupancy, divergence — without checking notes." Algorithmic correctness gets baseline; what separates hires is the follow-up dialogue about memory pressure, warp behavior, and how the same op should be rewritten for Tensor Cores or async TMA copies on Hopper/Blackwell.',
  trends: [
    'LLM inference optimization is dominant: continuous/inflight batching, paged KV-cache, speculative decoding — all surface in HLD rounds.',
    'FP8 (and emerging FP4) quantization for training and inference; picking scales per-tensor vs per-block is standard probing.',
    'Attention kernels (FlashAttention-2/3/4 lineage), softmax rescaling, async pipelining on Blackwell are mainstream interview material. vLLM and TensorRT-LLM serving internals fair game for senior inference roles.',
  ],
  questions: [
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement matrix multiplication in CUDA; discuss tiling, shared-memory usage, and memory coalescing.',
      source: 'huru.ai',
      href: 'https://huru.ai/nvidia-interview-questions-mastering-cuda-inference-systems/',
      dateObserved: '2025–2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Explain memory coalescing — why do row-major vs column-major access patterns produce drastically different throughput? Restructure a given kernel to coalesce.',
      source: 'techinterview.org',
      href: 'https://www.techinterview.org/companies/nvidia-interview-guide-2026/',
      dateObserved: '2026',
    },
    {
      type: 'ml-theory',
      prompt:
        'Tensor Cores vs CUDA Cores: which ops map to each, and why does mixed-precision (FP16/BF16, and now FP8) matter for modern ML workloads?',
      source: 'techinterview.org',
      href: 'https://www.techinterview.org/companies/nvidia-interview-guide-2026/',
      dateObserved: '2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design a low-latency LLM inference serving stack: request batching, KV-cache management, tensor parallelism, deployment via TensorRT-LLM and Triton Inference Server.',
      source: 'huru.ai',
      href: 'https://huru.ai/nvidia-interview-questions-mastering-cuda-inference-systems/',
      dateObserved: '2025–2026',
    },
    {
      type: 'ml-theory',
      prompt:
        'How would you profile a CUDA application — what tools (Nsight Systems / Nsight Compute), and what\'s your workflow when a kernel underperforms its roofline?',
      source: 'huru.ai',
      href: 'https://huru.ai/nvidia-interview-questions-mastering-cuda-inference-systems/',
      dateObserved: '2025',
    },
  ],
  sources: [
    'https://huru.ai/nvidia-interview-questions-mastering-cuda-inference-systems/',
    'https://www.techinterview.org/companies/nvidia-interview-guide-2026/',
    'https://www.linkjob.ai/interview-questions/nvidia-deep-learning-interview/',
  ],
  lastUpdated: TODAY,
};

export const teslaSWE: RecentlyAskedEntry = {
  companySlug: 'tesla',
  company: 'Tesla',
  level: 'Autopilot / SWE',
  signatureRound:
    'Vision/perception deep-dive paired with a real-time C++ engineering round. Onsite is typically four sessions: C++/algorithms, perception/ML deep dive, system design, behavioral. Perception round probes the full vision stack — multi-camera fusion, BEV transforms, occupancy networks, lane and object detection — and grades engineering judgment under hard latency budgets ("at 60 mph, 100 ms = 2.7 m of uncontrolled motion"). C++ round demands modern, production-quality code: const correctness, no extraneous copies, lock-free or carefully-locked concurrency, deterministic memory.',
  bar: 'Vision and planning depth under hard real-time constraints. Want candidates who treat latency, determinism, and safety as first-class concerns and reason about graceful degradation when a camera is occluded or a sensor fails. Interviews emphasize systems thinking, not deep-learning minutiae — knowing model architectures helps, but you must deploy them in C++ on an embedded target with predictable tail latency.',
  trends: [
    'End-to-end neural networks (FSD V12+): collapse of ~300K lines of C++ control code down to ~2–3K lines wrapping ~48 networks. SD questions probe how to structure training, validation, rollout for an end-to-end policy.',
    'Vision-only philosophy increasingly defended in interviews; expect to argue trade-offs vs LiDAR-fusion stacks (Waymo, Mobileye).',
    'MLIR-based compiler/runtime rewrite (~20% latency improvement) means inference-compiler and codegen depth is fair game for senior Autopilot infra roles.',
  ],
  questions: [
    {
      type: 'system-design',
      prompt:
        'Design a real-time perception pipeline ingesting 8 cameras at ~36 FPS, running detection + lane models, outputting to the planner within a 50 ms latency budget.',
      source: 'lockedinai.com',
      href: 'https://www.lockedinai.com/company-details/TSLA',
      dateObserved: '2025–2026',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Implement an LRU cache in C++ with O(1) get/put, then adapt it for a multithreaded real-time perception system (lock granularity, false sharing).',
      source: 'lockedinai.com',
      href: 'https://www.lockedinai.com/company-details/TSLA',
      dateObserved: '2025',
    },
    {
      type: 'coding',
      difficulty: 'hard',
      prompt:
        'Merge K sorted streams of sensor timestamps that may arrive with bounded delay D ms; preserve correct event ordering.',
      source: 'lockedinai.com',
      href: 'https://www.lockedinai.com/company-details/TSLA',
      dateObserved: '2025',
    },
    {
      type: 'ml-theory',
      prompt:
        'Design a lane detection module robust to rain and low light; discuss multi-sensor fusion vs Tesla\'s vision-only stance and the failure modes of each.',
      source: 'designgurus.io',
      href: 'https://www.designgurus.io/answers/detail/tesla-autopilot-software-interview-topics',
      dateObserved: '2025–2026',
    },
    {
      type: 'system-design',
      prompt:
        'Design an OTA update rollout for FSD using shadow mode + canary deployments — how do you safely validate a new policy on the fleet?',
      source: 'techinterview.org',
      href: 'https://www.techinterview.org/post/3233474492/system-design-design-tesla-autopilot-autonomous-driving-sensor-fusion-perception-path-planning-real-time-ml-inference/',
      dateObserved: '2026',
    },
  ],
  sources: [
    'https://www.lockedinai.com/company-details/TSLA',
    'https://www.techinterview.org/post/3233474492/system-design-design-tesla-autopilot-autonomous-driving-sensor-fusion-perception-path-planning-real-time-ml-inference/',
    'https://www.glassdoor.com/Interview/Tesla-Autopilot-Software-Engineer-Interview-Questions-EI_IE43129.0,5_KO6,33.htm',
  ],
  lastUpdated: TODAY,
};

export const allEntries: Record<string, RecentlyAskedEntry> = {
  'openai-mts': openaiMTS,
  'anthropic-swe': anthropicSWE,
  'deepmind-re': deepmindRE,
  'mistral-swe': mistralSWE,
  'cohere-swe': cohereSWE,
  'huggingface-mle': huggingfaceMLE,
  'databricks-swe': databricksSWE,
  'stripe-swe': stripeSWE,
  'netflix-swe': netflixSWE,
  'airbnb-swe': airbnbSWE,
  'uber-swe': uberSWE,
  'linkedin-swe': linkedinSWE,
  'nvidia-swe': nvidiaSWE,
  'tesla-swe': teslaSWE,
};

export function getRecentlyAsked(key: string): RecentlyAskedEntry | undefined {
  return allEntries[key];
}
