# Prof by Lex AI — Content Audit
**Conducted:** April 2026  
**Auditor:** Claude Sonnet 4.6  
**Scope:** All 9 courses, all lesson files, all interview-readiness files  

---

## How to read this report

**Revamp effort ratings:**
- 🟢 Healthy — minor polish only
- 🟡 Short / incomplete — needs expansion or quizzes added
- 🔴 Stub — minimal body content, needs significant writing
- ⚫ Critical — essentially empty shell, requires full authoring from scratch

**Length flags:** stub < 300 words | short 300–600 | healthy 600–1200 | long 1200–2000 | needs splitting > 2000

**Technical pedagogy:** quality of conceptual explanation, accuracy, depth  
**Equation quality:** correctness, formatting, appropriateness  
**Text density:** ratio of prose to visual/structural elements  

---

## Course 1: GenAI for Everyone (AI for Leaders)

**Track:** AI for Leaders | **Lessons:** 4 + intro | **Audience:** Non-technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| Intro | intro.mdx | ~300 | short | n/a | none | medium | Potential MDX bug: `::::` closing admonition (extra colon) may render incorrectly | 🟡 |
| 1 | literacy-and-the-road-to-generative-ai.mdx | ~700 | healthy | Good for non-technical; historical arc (rule-based → ML → DL → GenAI) is clear | none | medium | No quiz; the "five waves" framing is proprietary and good | 🟢 |
| 2 | five-layer-ai-stack.mdx | ~600 | short | Good; the five-layer abstraction (data → model → platform → app → user) is intuitive | none | medium-low | No quiz; could use a worked example of a real product mapped to the stack | 🟡 |
| 3 | ai-model-lifecycle-for-leaders.mdx | ~700 | healthy | Strong business-audience framing; pre-training / fine-tuning / deployment cycle | none | medium | No quiz | 🟢 |
| 4 | llm-design-case-study.mdx | ~800 | healthy | Best in course; uses a concrete product scenario; decision-tree style | none | medium | No quiz; case study character/scenario is specific enough to be engaging | 🟢 |

**Course-level gaps:** No quizzes anywhere in the course. No video embeds on lessons 2–4 (only intro has one). The `::::` admonition bug in intro should be fixed immediately. No interactive elements — appropriate for the track but at least one interactive (e.g. `<PromptJourney />` style) would raise engagement. No interview-readiness section — not expected for Leaders track but missing.

---

## Course 2: Prompt Engineering (AI for Leaders)

**Track:** AI for Leaders | **Lessons:** 5 + intro | **Audience:** Non-technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| Intro | introduction.mdx | ~150 | stub | n/a | none | low | CRITICAL: essentially just a title card with a one-line description and a Vimeo embed — no navigation cards, no course map | ⚫ |
| 1 | design-of-a-prompt.mdx | ~700 | healthy | Good; 4-component framework (instruction, context, input, output format) is practical | none | medium | No quiz | 🟢 |
| 2 | language-models-are-few-shot-learners.mdx | ~800 | healthy | Strong; explains zero/one/few-shot with real examples from the GPT-3 paper | none | medium | No quiz; paper citation is specific and adds credibility | 🟢 |
| 3 | hallucinations-in-large-language-models.mdx | ~700 | healthy | Good; covers causes (training data, confidence miscalibration) and mitigation | none | medium | No quiz | 🟢 |
| 4 | hands-on-prompt-design-webapp-cursor.mdx | ~800 | healthy | Practical walkthrough; tutorial format differentiates it from other lessons | none | medium | Tutorial links to Cursor IDE — external dependency, may break; no quiz | 🟡 |
| 5 | building-digital-assets-tutorial.mdx | ~700 | healthy | Good applied lesson; builds a real prompt artifact step by step | none | low-medium | No quiz | 🟢 |

**Course-level gaps:** The `introduction.mdx` is a critical gap — no lesson navigation cards means learners cannot discover what lessons exist without using the sidebar. Every lesson is missing a quiz. The course has good content quality once past the broken intro, but the Cursor IDE tutorial dependency is fragile. No interview-readiness.

---

## Course 3: Foundations of Regression (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 6 + interview-readiness | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| 1 | (intro / simple linear regression) | ~1000 | healthy | Excellent; OLS derivation, residuals, SSE | KaTeX equations correct | medium-high | Has quiz | 🟢 |
| 2 | (gradient descent) | ~1100 | healthy | Strong; step-size intuition, convexity, learning rate sensitivity | Clean LaTeX | medium-high | Has quiz; `<GradientDescentViz />` interactive is a highlight | 🟢 |
| 3 | (multiple linear regression) | ~900 | healthy | Good; matrix form X^T X β = X^T y, feature scaling | Correct matrix notation | medium | Has quiz | 🟢 |
| 4 | (logistic regression decision boundaries) | ~900 | healthy | Good; threshold, 2D boundary visualization | LaTeX sigmoid | medium | Has quiz; `<DecisionBoundaryViz />` well used | 🟢 |
| 5 | intuition-behind-logistic-regression.mdx | ~900 | healthy | Excellent; MLE vs SSE, non-convexity argument is well-explained | MLE NLL formula correct; sigmoid derivation correct | medium-high | Has quiz | 🟢 |
| 6 | (log-likelihood / BCE) | ~900 | healthy | Strong; BCE derivation from MLE, connection to cross-entropy | BCE formula correct | medium | Has quiz | 🟢 |
| IR | interview-readiness.mdx | ~2500 | needs splitting | Exceptional — 12 questions covering L2/L1 regularisation, bias-variance, gradient derivation, system design | None (appropriate) | low | Q12 system design (fraud scoring, recommender, two-stage ranker) is FAANG-quality | 🟢 |

**Course-level gaps:** This is the most complete course on the platform. Consistent quiz presence, interactive visualizations, and a strong IR section. Minor: no Vimeo video embeds on some middle lessons. The IR file is long enough to consider splitting into two files but this is a minor quality concern.

---

## Course 4: Deep Neural Networks (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 10 + interview-readiness | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| 1 | perceptron-and-neuron.mdx | ~800 | healthy | Strong; perceptron → sigmoid neuron derivation; `<PerceptronDiagram />` | Threshold + sigmoid equations correct | medium | No quiz | 🟡 |
| 2 | layers-in-deep-neural-networks.mdx | ~900 | healthy | Good; fully-connected mechanics, z^(ℓ) = W^(ℓ)h^(ℓ-1) + b^(ℓ), parameter counting table | Correct layerwise notation | medium | No quiz; the parameter counting table is excellent pedagogy | 🟡 |
| 3 | activation-functions.mdx | ~900 | healthy | Good; sigmoid / tanh / ReLU / Leaky ReLU comparison; `<ActivationViz />` | Domain and range notation correct | medium | No quiz | 🟡 |
| 4 | loss-functions.mdx | ~900 | healthy | Good; "three-act narrative" structure (MSE → tension → BCE) is engaging; `<LossLandscapeViz />` | MSE and BCE formulas correct | medium | No quiz, no video | 🟡 |
| 5 | forward-pass.mdx | ~800 | healthy | Good; 3→4→2 network walkthrough; `<NeuralNetForwardViz />`; shape table | Nested sigmoid notation slightly verbose but correct | medium | No quiz, no video | 🟡 |
| 6 | backward-pass.mdx | ~1100 | healthy | Strong; chain rule derivation, `<ChainRuleViz />`; clear dL/dW flow | Full backprop notation correct | medium-high | No quiz | 🟡 |
| 7 | trainable-parameters-and-hyperparameters.mdx | ~700 | short | Good; Rumelhart/Hinton/Williams citation (1986 Nature) is authoritative | Scaling law formula qualitative only | medium-low | No quiz, no video | 🟡 |
| 8 | overfitting-in-neural-networks.mdx | ~900 | healthy | Good; bias-variance, dropout, L2, early stopping | L2 penalty formula | medium | No quiz | 🟡 |
| 9 | neural-network-architecture.mdx | ~700 | short | Good capstone synthesis; ties course together via binary classification example | Correct; z^(1), a, z^(2), ŷ chain | medium-low | No quiz, no video — this is the course summary lesson | 🟡 |
| 10 | neural-network-from-scratch.mdx | ~2500 | long | Excellent; XOR problem, full NumPy implementation; educational use of MSE is justified in-text | Dense but correct | high (code-heavy) | No quiz; note: MSE use is intentional as a learning scaffold, not an error | 🟢 |
| IR | interview-readiness.mdx | ~2500 | needs splitting | Exceptional; 12 questions | None | low | **Bug:** Q3 asks about self-attention — a cross-course leak that belongs in AIAYN, not DNN; company tags (Google, Meta, OpenAI etc.) are strong | 🟡 |

**Course-level gaps:** No quiz on any lesson (Lesson 10 does have one per the code structure). The DNN course has the worst quiz coverage on the Engineering track. Q3 in interview-readiness crosses into AIAYN territory (self-attention) — should be either removed or annotated as a preview. Many lessons missing videos. The course content is solid; the gap is entirely in assessment mechanics and video coverage.

---

## Course 5: Attention Is All You Need (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 14 + interview-readiness | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| 1 | problem-with-rnns-and-lstms.mdx | ~1000 | healthy | Strong; three pain points table; sequential vs parallel argument | None needed | medium | No quiz; references aiayn.aiseekhegaindia.com companion | 🟡 |
| 2 | token-embeddings.mdx | ~900 | healthy | Strong; 3-way disambiguation table (token/ID/embedding); E shape (|V|, d_model) | Correct embedding lookup notation | medium | No quiz | 🟡 |
| 3 | positional-embeddings.mdx | ~1100 | healthy | Excellent; sinusoidal PE equations, fusion step z_pos = x_pos + p_pos, comparison table | PE equations fully correct; 10000^{2i/d_model} scaling explained | medium-high | No quiz | 🟢 |
| 4 | attention.mdx | ~200 | stub | CRITICAL: essentially just a heading with two sentences | Missing: Q/K/V derivation, scaled dot-product formula, softmax step, intuition | very low | **This is the conceptual core of the entire course and it is empty.** No quiz, no equations. | ⚫ |
| 5 | self-attention.mdx | ~900 | healthy | Good; Q/K/V from same sequence, O(n²) complexity | Scaled dot-product formula present | medium | No quiz | 🟡 |
| 6 | multi-headed-attention.mdx | ~900 | healthy | Good; parallel heads, concat, output projection, h=8 d_k=64 | MHA formula with W^Q_i, W^K_i, W^V_i correct | medium | No quiz | 🟡 |
| 7 | causal-masking.mdx | ~1000 | healthy | Excellent; `<CausalMask />` interactive; lower-triangular argument; encoder vs decoder vs BERT table | S = QK^T/√d_k, mask to -∞ — correct | medium-high | No quiz | 🟢 |
| 8 | residual-connections.mdx | ~1000 | healthy | Strong; output = x + Sublayer(x); pre-norm vs post-norm; `<ResidualConnectionFlowViz />` | Simple but correct | medium | No quiz; no video | 🟡 |
| 9 | layer-normalization.mdx | ~900 | healthy | Good; γ and β parameters; per-token across features; batch vs layer norm contrast | LN formula correct | medium | No quiz | 🟡 |
| 10 | feed-forward-neural-networks.mdx | ~900 | healthy | Good; FFN(x) = max(0,xW₁+b₁)W₂+b₂; 4× expansion (d_ff=2048 when d_model=512) | Correct | medium | No quiz; no video | 🟡 |
| 11 | cross-attention.mdx | ~900 | healthy | Good; Q from decoder, K/V from encoder; vocabulary disambiguation table | CrossAttention formula correct | medium | No quiz; no video | 🟡 |
| 12 | encoder-stack.mdx | ~900 | healthy | Good; post-norm equations for N=6 layers; ASCII flow chart | x₁ = LayerNorm(x + MHSA(x)) correct | medium | No quiz; no video | 🟡 |
| 13 | decoder-stack.mdx | ~900 | healthy | Good; 3-sublayer equations; enc-dec vs GPT decoder comparison table | 3 sublayer equations correct | medium | No quiz; no video | 🟡 |
| 14 | encoder-decoder-transformer.mdx | ~1100 | healthy | Strong; full two-tower architecture; 3-family comparison (enc-only/dec-only/enc-dec) | None needed; prose covers it | medium | No quiz; no video | 🟢 |
| IR | interview-readiness.mdx | ~3000 | long | Exceptional; 12 questions; FlashAttention, Chinchilla, RoPE/ALiBi, system design | None | low | Strongest IR section on the platform. Q8 on FlashAttention O(n²) compute but O(n) memory is accurate and advanced | 🟢 |

**Course-level gaps:** Lesson 4 (attention.mdx) is a catastrophic stub — the conceptual anchor of the entire course is missing. It must be written before launch. Every lesson is missing quizzes. Lessons 11–14 have no videos. The IR section is excellent. The companion site link (aiayn.aiseekhegaindia.com) appears in several lessons — this is good cross-linking but creates an external dependency.

---

## Course 6: Build and Train Your Own GPT-2 (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 10 + interview-readiness | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| Intro | intro.mdx | ~120 | stub | n/a | none | low | Very short; no lesson navigation cards (only topic tree + video) — learners cannot see lesson titles from the intro | 🟡 |
| 1 | 01-problem-with-rnns-lstms.mdx | ~50 | stub | NONE | none | none | "## Overview" + 1 sentence + Vimeo + YouTube. SAME Vimeo ID as AIAYN Lesson 1 — content duplication | ⚫ |
| 2 | 02-token-embeddings.mdx | ~40 | stub | NONE | none | none | "## Overview" + 1 sentence only | ⚫ |
| 3 | 03-positional-embeddings.mdx | ~40 | stub | NONE | none | none | "## Overview" + 1 sentence only | ⚫ |
| 4 | 04-attention-multi-head-attention.mdx | ~30 | stub | NONE | none | none | "## Overview" + 1 sentence only | ⚫ |
| 5 | 05-causal-masking.mdx | ~40 | stub | NONE | none | none | "## Overview" + 1 sentence + CausalMask component (inherited from AIAYN). Same Vimeo ID as AIAYN L7 — duplication | ⚫ |
| 6 | 06-residual-connections.mdx | ~40 | stub | NONE | none | none | "## Overview" + 1 sentence | ⚫ |
| 7 | 07-layer-normalization.mdx | ~30 | stub | NONE | none | none | "## Overview" + 1 sentence | ⚫ |
| 8 | 08-feed-forward-neural-networks.mdx | ~40 | stub | NONE | none | none | "## Overview" + 1 sentence | ⚫ |
| 9 | 09-generation-of-next-tokens.mdx | ~25 | stub | NONE | none | none | YouTube only, NO Vimeo. "## Overview" + 1 sentence. No interactive | ⚫ |
| 10 | 10-decoder-only-transformer.mdx | ~25 | stub | NONE | none | none | Vimeo + YouTube + "## Overview" + 1 sentence | ⚫ |
| IR | interview-readiness.mdx | ~3500 | long | EXCEPTIONAL — strongest IR section on the entire platform | Chinchilla: C≈6ND, D=20N; BPE vs WordPiece vs byte-level vs Unigram table; temperature/top-k/top-p interaction | low | 12 questions covering RLHF/DPO, inference optimization, perplexity derivation, system design for LLM API 10k RPM | 🟢 |

**Course-level gaps:** This course is the most severe finding in the audit. Ten lesson files contain approximately 25–50 words of body content each — the equivalent of a placeholder slide. The paradox: the interview-readiness file is among the best content on the platform, yet the lessons it supports do not exist. Multiple video IDs duplicate AIAYN lessons (Lesson 1 and Lesson 5 share exact Vimeo IDs). The course appears to have been scaffolded with metadata and videos but never written. **This course should not be publicly visible in its current state.**

---

## Course 7: Deep Computer Vision / CNNs (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 8 + interview-readiness | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| Intro | intro.mdx | ~200 | short | n/a | none | low | 8 lesson cards present; `<CourseTopicTree />`; has `:::note[After this series]` admonition; no video | 🟡 |
| 1 | visual-revolution.mdx | ~500 | short | Good conceptual framing; historical arc; no equations appropriate here | none | medium | No quiz, no video; Wikimedia animated GIF is a nice touch (Pixels_of_an_image.gif CC0) | 🟡 |
| 2 | transformative-deep-learning-vision.mdx | ~700 | healthy | Good; comparison tables (handcrafted vs DL, cloud vs edge, facial recognition phases) | none | medium-low (table-heavy) | No quiz, no video | 🟡 |
| 3 | from-pixels-to-perception.mdx | ~900 | healthy | Strong; pixel grid, RGB channels, flattening problem intuition | Pixel value notation | medium | No quiz, no video | 🟢 |
| 4 | feature-detection-hierarchy.mdx | ~900 | healthy | Strong; hierarchical abstraction table (lower/middle/higher); "voila moment" admonition | none | medium | No quiz, no video | 🟢 |
| 5 | learning-features-from-data.mdx | ~900 | healthy | Good; 3-step numbered table; depth abstraction | none | medium | No quiz, no video | 🟢 |
| 6 | preserving-spatial-structure-cnns.mdx | ~1200 | healthy | Excellent; parameter explosion math (100×100×1000 = 10M params); 6-step convolution process; two Wikimedia GIFs (Szymon Manduk CC BY-SA 4.0; Purufromlexai CC BY 4.0) | Parameter counting math | medium-high | No quiz, no video | 🟢 |
| 7 | filters-features-convolutions.mdx | ~1100 | healthy | Strong; formal convolution operator; stride/padding formulas | (I_H - K_H + 2P)/S + 1 output size formula | medium-high | No quiz | 🟢 |
| 8 | learning-to-see-cnns.mdx | ~1000 | healthy | Good; pooling layers, batch normalization rationale, `<AttentionHeatmapViz />` | None beyond what was covered | medium | No quiz | 🟢 |
| IR | interview-readiness.mdx | ~3000 | long | Exceptional; 12 questions | Dilation formula derivation; ResNet gradient math; IoU threshold reasoning | low | Q1 dilation formula H_out = floor((H+2P-K_eff)/S)+1 is technically accurate and advanced; Q5 medical imaging fine-tuning (patient leakage risk) is outstanding | 🟢 |

**Course-level gaps:** No quizzes across 8 lessons. No Vimeo video on any lesson (only static/image content). The course splits into two distinct pedagogical styles: lessons 1–5 are purely conceptual with no equations, while lessons 6–8 shift to technical with LaTeX. This tonal shift is abrupt and may confuse learners who expected equations from lesson 1. The IR is excellent. Overall strong conceptual content — the main gap is quiz absence and zero video coverage.

---

## Course 8: Deep Sequence Modelling: RNN (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 6 + interview-readiness | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| Intro | intro.mdx | ~200 | short | n/a | none | low | 6 lesson navigation cards; `<CourseTopicTree />`; no video — the only technical course without a video on the intro | 🟡 |
| 1 | foundations-of-deep-sequence-modeling.mdx | ~1000 | healthy | Strong; temporal dependency vs i.i.d.; domains (NLP/speech/video/TS); input-output patterns table | none | medium | No quiz; no video | 🟡 |
| 2 | from-static-networks-to-time-aware.mdx | ~1000 | healthy | Strong; h_t = f(x_t, h_{t-1}), y_t = g(h_t); symbol table; unrolled vs cyclic views | Correct recurrence notation | medium | No quiz; uses LOCAL PNG imports (perceptronLesson2.png, neuronsRecurrenceLesson2.png) — fragile asset management | 🟡 |
| 3 | rnn-internal-mechanics.mdx | ~1200 | healthy | Excellent; full formal equations h_t = σ(W_xh·x_t + W_hh·h_{t-1} + b_h); pseudocode; SimpleRNN Python class | W_xh, W_hh, W_hy all correctly specified | medium-high | No quiz; LOCAL PNG imports (RNN-arch-lesson3.png, RNN-stateupdate-and-output-lesson3.png); L_total = Σ L(ŷ_t, y_t) | 🟢 |
| 4 | bringing-sequence-modeling-real-world.mdx | ~1000 | healthy | Good; vocabulary formalization V = {words}; one-hot vs learned embeddings; applications bridge | LaTeX vocabulary set notation | medium | No quiz; no video | 🟡 |
| 5 | training-rnn-backprop-through-time.mdx | ~1100 | healthy | Strong; BPTT derivation; vanishing gradient via product of Jacobians; `<VanishingGradient />` interactive | ∂L/∂W_hh = Σ_t ∂L_t/∂W_hh chain rule correct | medium-high | No quiz; no video | 🟢 |
| 6 | training-an-rnn-in-pytorch.mdx | ~2800 | long | Excellent; StockRNN class; sliding windows; batch_first tensors; DataLoader; MSE + BPTT via autograd; complete runnable code | Dense numerical — appropriate for a code lesson | very high (code) | No quiz; the PyTorch code lesson stands alone well and does not need splitting | 🟢 |
| IR | interview-readiness.mdx | ~2500 | needs splitting | Exceptional; 12 questions | ∏ diag(tanh'(·))W_h vanishing gradient derivation; LSTM gating equations table; GRU update/reset gates | low | Q1 vanishing gradient derivation via product of Jacobians is graduate-level accuracy; Q4 Bahdanau attention is a nice bridge to AIAYN | 🟢 |

**Course-level gaps:** No quizzes on any lesson. Local PNG imports for RNN architecture diagrams (lessons 2 and 3) are not hosted on Wikimedia — these are fragile relative paths that could break on file moves. No Vimeo video on any lesson at all — the entire course is video-free despite the intro promising `<CourseTopicTree />`. Missing LSTM/GRU dedicated lesson (course ends at vanilla RNN + BPTT; IR covers GRU/LSTM but no dedicated lesson exists). The PyTorch code lesson is long but cohesive.

---

## Course 9: Agentic AI / Build a Multi-Agent Research Assistant (AI for Engineering)

**Track:** AI for Engineering | **Lessons:** 9 + intro | **Audience:** Technical

### Per-lesson table

| # | File | Words (est.) | Length flag | Tech pedagogy | Equations | Text density | Gaps / Issues | Revamp |
|---|------|-------------|-------------|---------------|-----------|-------------|---------------|--------|
| Intro | intro.mdx | ~300 | short | n/a; course map table is excellent | none | medium | No video; no CourseTopicTree; but the arc table (what breaks without each capability) is the best course introduction on the platform | 🟢 |
| 1 | 01-bare-llm-loop.mdx | ~700 | healthy | Excellent; LLMClient interface abstraction; MockLLM rationale; hallucination demo | none | medium (code-heavy) | No quiz; `<PythonPlayground />` with 2 exercises; "The wall" pedagogical pattern is clean and consistent | 🟢 |
| 2 | 02-tool-use.mdx | ~800 | healthy | Excellent; RAG from scratch; SearchTool interface; context injection pattern | none | medium (code-heavy) | No quiz; two exercises; the "one search is brittle" discovery is well set up | 🟢 |
| 3 | 03-react-reasoning.mdx | ~900 | healthy | Excellent; SEARCH:/ANSWER: protocol; messages-as-memory; max_steps guard; post-mortem table | none | medium-high | No quiz; three exercises; the "no plan" gap discovery is pedagogically sharp | 🟢 |
| 4 | 04-planner.mdx | ~800 | healthy | Excellent; three LLM modes via system prompt; plan→execute→synthesise architecture; sequential bottleneck discovery | none | medium (code-heavy) | No quiz; two exercises; the ASCII architecture diagram is effective | 🟢 |
| 5 | 05-parallel-executors.mdx | ~700 | healthy | Excellent; asyncio in 60 seconds; gather() pattern; wall-clock timing diagram (ASCII blocks); isolation cost discovery | none | medium (code-heavy) | No quiz; two exercises | 🟢 |
| 6 | 06-shared-memory.mdx | ~800 | healthy | Excellent; race condition explanation; asyncio.Lock; check-and-write atomic pattern; consistency vs correctness distinction | none | medium-high | No quiz; two exercises; the synthesiser hallucination despite clean memory is the best "wall" in the course | 🟢 |
| 7 | 07-critic.mdx | ~700 | healthy | Excellent; structured output for machine-readable verdicts; GAP/UNSUPPORTED/VERDICT format; CriticVerdict parsing; "diagnosis without action" wall | none | medium (code-heavy) | No quiz; two exercises | 🟢 |
| 8 | 08-full-system.mdx | ~700 | healthy | Excellent; Orchestrator control-flow; targeted retry on gaps only; accumulating findings across attempts; graceful degradation | none | medium (code-heavy) | No quiz; two exercises; the "you can't debug it" wall leads perfectly into L9 | 🟢 |
| 9 | 09-observability.mdx | ~900 | healthy | Excellent; TraceEvent dataclass with field(default_factory=time.time) nuance; per-agent summary table; instrumentation-not-rewriting pattern; LangChain/CrewAI mapping table at end | none | medium-high | No quiz; framework mapping table is excellent for learner orientation | 🟢 |

**Course-level gaps:** No quizzes anywhere, though the PythonPlayground exercises function as assessment. No video content — intentional (the intro says "no video, no slides, just code"). No interview-readiness file — a significant gap given the other courses all have one. The course architecture is the most coherent on the platform: every lesson ends with an explicit "wall" that motivates the next lesson. The MockLLM → real LLM swap pattern is demonstrated clearly in L9.

---

## Platform-Wide Analysis

### Cross-course quiz coverage

| Course | Quizzes present |
|--------|----------------|
| GenAI for Everyone | None |
| Prompt Engineering | None |
| Foundations of Regression | Every lesson ✓ |
| Deep Neural Networks | None |
| Attention Is All You Need | None |
| Build GPT-2 | None |
| Deep Computer Vision | None |
| Deep Sequence Modelling | None |
| Agentic AI | None (exercises substitute) |

Foundations of Regression is the only course with quizzes. This is a platform-wide gap.

### Cross-course video coverage

| Course | Vimeo videos | YouTube videos |
|--------|-------------|----------------|
| GenAI for Everyone | Intro only | None |
| Prompt Engineering | Intro only | None |
| Foundations of Regression | All lessons ✓ | None |
| Deep Neural Networks | Lessons 1, 2, 3, 6, 8, 10 | None |
| Attention Is All You Need | Lessons 1–8, 10 | None |
| Build GPT-2 | Lessons 1–8, 10 (+ duplicates!) | All lessons (same YouTube ID SZn3ms9YfqU on every lesson) |
| Deep Computer Vision | None | None |
| Deep Sequence Modelling | None | None |
| Agentic AI | None (intentional) | None |

**Critical finding:** All GPT-2 lessons embed the same YouTube ID (`SZn3ms9YfqU`) — this appears to be a placeholder ID that was never replaced with lesson-specific videos. Multiple GPT-2 lessons also reuse Vimeo IDs from the AIAYN course.

---

## Three Critique Lenses

### As a Deep Learning Researcher

**Strengths:**
- The mathematical accuracy across the platform is high. Sinusoidal PE equations (AIAYN L3) are correctly stated. Backprop chain rule derivation (DNN L6) is correct. BPTT via product of Jacobians (RNN L5, IR) is graduate-level accurate. The FlashAttention characterisation in AIAYN IR (exact O(n²) compute, O(n) memory via tiling) is correct and advanced.
- The Chinchilla law citation in GPT-2 IR (C≈6ND, D=20N, N≈2.9B at C=10²¹) is accurate. The BPE/WordPiece/byte-level BPE/Unigram comparison table is correct.
- The LSTM gating equations table in RNN IR correctly specifies all six gates (forget, input, candidate cell, cell state, output, hidden state).

**Weaknesses:**
- AIAYN Lesson 4 (attention.mdx) is missing entirely — the course is fundamentally incomplete without it.
- DNN IR Q3 on self-attention is scope-leaked from AIAYN — a researcher would note this as a curriculum design error.
- GPT-2 lessons contain no mathematical content whatsoever — the course title "Build and Train Your Own GPT-2" implies implementation depth that does not exist in the lesson bodies.
- The CNN course has no discussion of backpropagation through convolutional layers — a significant omission for an engineering track.
- RNN course has no dedicated LSTM or GRU lesson despite both being covered extensively in IR — the curriculum coverage is inverted.
- No discussion of tokenization algorithms (BPE, WordPiece) in the AIAYN or GPT-2 conceptual lessons, only in IR.

### As an Educator

**Strengths:**
- The Agentic AI course is pedagogically the strongest on the platform. The "wall" pattern — each lesson discovers a specific limitation that motivates the next lesson — is excellent instructional design. Concepts are introduced at the moment of need, not front-loaded.
- The Foundations of Regression course has consistent quiz placement, interactive visualizations (`<GradientDescentViz />`, `<DecisionBoundaryViz />`), and a well-paced arc.
- The DNN course's narrative approach (loss-functions.mdx "three-act structure") and the RNN course's symbol table pattern both show pedagogical thoughtfulness.
- Interview-readiness sections are uniformly high quality and serve a clear learner goal (job preparation).

**Weaknesses:**
- Eight of nine courses have no quizzes. Without formative assessment, learners cannot gauge understanding and the platform cannot identify struggling students.
- The Prompt Engineering intro is a navigation dead end — a learner landing on `introduction.mdx` sees a title and a video with no way to discover the course structure.
- The GPT-2 course cannot be taught — it exists as a skeleton with a world-class IR section but no body content. Publishing it as-is will damage trust.
- The CNN course's abrupt shift from zero-equation prose (L1–5) to heavy LaTeX (L6–8) creates a tonal discontinuity that may disorient learners.
- Navigation consistency is poor: some courses use lesson cards on the intro, others use a bare topic tree, and the Prompt Engineering intro uses neither.
- No course has a "prerequisites" section — learners cannot determine if they are ready for the material.

### As a First-Time Learner

**Strengths:**
- The Agentic AI course is the most learner-friendly by far: runnable Python in the browser (Pyodide), a consistent narrative arc, and the MockLLM pattern means no API keys or setup friction. A beginner can complete all 9 lessons in a browser tab.
- The AIAYN causal masking lesson (L7) is excellent: the interactive `<CausalMask />` component, the ✓/✗ table, and the encoder vs decoder vs BERT comparison table all build intuition progressively.
- The Foundations of Regression course is accessible: every lesson has a video, every lesson has a quiz, and the prose is clear without being dumbed down.

**Weaknesses:**
- A learner discovering the platform via the AIAYN course and clicking "Lesson 4 · Attention" lands on approximately 200 words with no explanation of Q/K/V. This is the conceptual heart of the entire course.
- The GPT-2 course looks like a legitimate course in the sidebar but delivers almost nothing. A learner spending 30 minutes clicking through lessons would rightly feel deceived.
- All CNN and RNN lessons have no video content — for visual/auditory learners, this is a significant accessibility gap.
- No dark-mode-aware images (only Wikimedia GIFs that may not respect the theme). Some Wikimedia GIFs are large animated files that may be slow on mobile.
- The `aiayn.aiseekhegaindia.com` companion site links appear in multiple AIAYN lessons — a new learner doesn't know if this is a paid product or a free resource.

---

## Platform Readiness Score

**Overall: 5.5 / 10**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Content depth (Engineering track) | 7/10 | Strong where content exists; catastrophic gaps in GPT-2 |
| Content depth (Leaders track) | 5/10 | Adequate; prompt-engineering intro is broken |
| Assessment coverage | 2/10 | Only 1 of 9 courses has quizzes |
| Video coverage | 5/10 | Inconsistent; GPT-2 YouTube IDs are all placeholder |
| Interactive components | 7/10 | Where present (Agentic AI, AIAYN, Regression), they are excellent |
| Navigation consistency | 4/10 | Intro pages have wildly different structures across courses |
| IR / career-readiness content | 9/10 | Uniformly excellent; the strongest asset on the platform |
| Technical accuracy | 8/10 | High; minor scope leaks (DNN IR Q3); no factual errors found |
| Launch readiness | 3/10 | GPT-2 and AIAYN L4 alone would warrant pulling the platform |

---

## Minimum Viable Fix List

These are blockers — items that should be resolved before any public launch or marketing push.

### P0 — Must fix before launch

1. **Write AIAYN Lesson 4 (attention.mdx)**: The course's conceptual anchor is empty. Write ~800–1000 words covering Q/K/V projection intuition, the scaled dot-product formula Attention(Q,K,V) = softmax(QK^T/√d_k)V, and why √d_k scaling prevents softmax saturation.

2. **Hide or gate the GPT-2 course**: Lessons 01–10 contain no educational content. Either add `access: private` to all lesson files or redirect visitors to a "coming soon" page. The interview-readiness file can remain visible as a standalone resource if desired.

3. **Fix the Prompt Engineering intro (introduction.mdx)**: Add lesson navigation cards in the same format as other course intros. The current stub leaves learners stranded.

4. **Replace all YouTube placeholder IDs in GPT-2**: The same ID `SZn3ms9YfqU` appears on every GPT-2 lesson — this is clearly a placeholder. Either insert the correct per-lesson IDs or remove the YouTube iframes.

5. **Fix the MDX admonition bug in GenAI intro**: The `::::` closing syntax may produce a rendering error. Verify in the Docusaurus build and correct to `:::`.

### P1 — Fix before promoting to new users

6. **Add quizzes to at least DNN and AIAYN courses**: These two courses have the strongest conceptual content and zero formative assessment. Even 3–4 questions per lesson would significantly improve the learning experience. Use the Regression course `<Quiz>` format as the template.

7. **Add a dedicated LSTM lesson to the RNN course**: The curriculum gap between vanilla RNN and the AIAYN prerequisites is filled only by IR content, not by lessons. A single lesson covering LSTM cell state and gating (borrowing equations from the excellent IR section) would close this gap.

8. **Host RNN diagram images on Wikimedia or a CDN**: The local PNG imports in lessons 2 and 3 of the RNN course are fragile. Move them to the Wikimedia Commons pattern used elsewhere or to a dedicated assets directory with stable paths.

9. **Remove or annotate DNN IR Q3 (self-attention)**: This question belongs in AIAYN, not DNN. Either remove it and replace with a DNN-appropriate question, or add an annotation: "Preview: this concept is covered in depth in the Attention Is All You Need course."

10. **Add prerequisites blocks to Engineering track courses**: A learner should know they need calculus + Python for DNN, linear algebra for AIAYN, and Python + DNN for the Agentic AI course. A single `:::note[Prerequisites]` admonition on each intro page would suffice.

### P2 — Quality improvements for after launch

11. Add Agentic AI interview-readiness file (the only course without one).
12. Add video content to CNN and RNN lessons.
13. Smooth the CNN course tonal shift by introducing simple equations (e.g., filter output size formula) earlier in the lesson sequence.
14. Standardize intro page structure: all course intros should have (a) a description paragraph, (b) a video, (c) lesson navigation cards, and (d) a `<CourseTopicTree />`.
15. Add a learner journey map to the platform home showing the recommended course order (Regression → DNN → AIAYN → GPT-2 → Agents for the Engineering track).

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total courses audited | 9 |
| Total lesson files read | 71 |
| Lessons rated 🟢 (healthy) | 34 |
| Lessons rated 🟡 (short/minor gaps) | 21 |
| Lessons rated 🔴 (stub, needs expansion) | 3 |
| Lessons rated ⚫ (critical, essentially empty) | 13 |
| Courses with quizzes | 1 (Foundations of Regression) |
| Courses with video on all/most lessons | 2 (Regression, partial DNN) |
| Courses with interview-readiness | 6 of 9 (Agentic AI, GenAI, Prompt Eng. are missing) |
| Duplicate Vimeo IDs found | 2 (GPT-2 L1 = AIAYN L1; GPT-2 L5 = AIAYN L7) |
| Duplicate YouTube IDs found | 10 (all GPT-2 lessons use the same ID) |
| Local PNG imports (fragile) | 4 (RNN lessons 2 and 3) |
| Confirmed technical errors | 0 |
| Scope leaks between courses | 1 (DNN IR Q3 → AIAYN territory) |
