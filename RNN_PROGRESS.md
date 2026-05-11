# RNN Animations — Progress

_Last updated: mid-session, after user feedback that "most of the animations are shit."_

## Status of the 6 RNN animations

| # | Component | Lesson | Cosmetic pattern | User-reviewed | Pedagogical revision |
|---|---|---|---|---|---|
| 1 | RecurrenceUnroll | L2 — Static → time-aware | ✅ revised | ✅ approved | ✅ rebuilt (drop toggle, drop redundant compute panel, bar charts, T=4, shared-weights badge) |
| 2 | RNNForwardPass | L3 — RNN mechanics | ✅ header cleaned | ❌ not yet | ⚠️ likely needs work |
| 3 | LSTMCell | L4 — LSTM & GRU | ✅ header cleaned | ❌ not yet | ⚠️ likely needs work |
| 4 | BPTTFlow | L6 — BPTT | ✅ header cleaned | ❌ not yet | ⚠️ **known bug**: dynamic Tailwind classes (`bg-${color}-600`) don't render — Tailwind purges them at build time. Phase indicator chips will appear unstyled. |
| 5 | TimeAwarePredictor | L1 — Foundations | ✅ revised | ✅ approved | ✅ rebuilt (FFN now scatters, modern buttons, no overflow, bigger text, dropped "Interactive" label) |
| 6 | TokenToVector | L5 — Real world | ✅ header cleaned | ❌ not yet | ⚠️ likely needs work |

**Reusables already in place** (do not rebuild):
- `<VanishingGradient />` — Lesson 6
- `<LossLandscapeViz />` — available, embed in L6 BPTT if helpful
- `<GradientDescentViz />` — Lesson 6

## Pattern that's working (apply to the rest)

From the two animations the user approved:

1. **No "Interactive · ..." label.** Title goes straight to the bold concept name.
2. **Header gradient + readable hierarchy**: `bg-gradient-to-br from-slate-50 to-white`, title `text-xl font-bold`, description `text-sm leading-relaxed` (NOT `text-[11px]`).
3. **Modern buttons** via shared `PrimaryBtn` / `GhostBtn`:
   - Primary: solid teal-600, rounded-xl, shadow-sm → shadow-md on hover, `active:scale-[0.97]`
   - Ghost: outline, white bg, lifts on hover
4. **No overflow**: use `overflow-x-auto` on horizontal chains; canvases use `width="100%"` + `maxWidth` + `aspectRatio: 1/1`; controls always use `flex-wrap`.
5. **Big readable text**: never `text-[11px]` for content. `text-sm` minimum for descriptions, `text-xl` for titles, `text-2xl` for key numeric values in pills.
6. **Numeric squares are noise.** Use vertical bar charts instead (height = magnitude, color = sign). Numbers crammed into 22px cells are unreadable.
7. **Drop a timestep** if needed (T=5 → T=4 freed up ~25% horizontal room in RecurrenceUnroll).
8. **One idea per animation**, hammered home with a single visual + a single equation callout. Don't compete with a second "live computation" panel that belongs in a later lesson.

## What's left to do (in priority order)

### High priority — actual bugs
- **BPTTFlow**: phase indicator chips use dynamic Tailwind classes like `` `bg-${color}-600` `` and `` `text-${color}-800` ``. Tailwind's JIT/purge mode strips these because they aren't seen at build time. Replace with a literal mapping (`{forward: 'bg-teal-600', loss: 'bg-amber-600', backward: 'bg-rose-600'}`) and use static class strings.

### Medium priority — pedagogical fitness (review needed before code changes)
- **RNNForwardPass** (L3): is the 5-stage × 5-timestep walkthrough actually digestible, or does it overwhelm? Sub-panels for each stage may be too dense.
- **LSTMCell** (L4): scenario preset cards land the forget-gate concept, but the inner cell diagram (gates + cell-state highway equation + hidden state equation stacked) is busy. May need a "gates in / cell out" flow diagram instead of three equation rows.
- **BPTTFlow** (L6): after fixing the dynamic-class bug, check whether the 5-cell unrolled row actually narrates the gradient flow clearly. The mini gradient-norm bar chart at the bottom may be more powerful than the current Jacobian panel.
- **TokenToVector** (L5): one-hot strip with 16 cells is fine, but the cosine-similarity nearest-neighbour chips may be too detailed for an L5 motivation section. Consider trimming.

### Low priority — polish
- Color and motion: consider adding subtle CSS transitions on cell highlight (currently abrupt).
- Speed slider should expose presets (Slow / Normal / Fast) in addition to the range.
- All RNN animations should probably share a single `<VizContainer>` wrapper instead of repeating the same header/controls scaffolding.

## How to resume

1. Review remaining 4 animations one at a time in `localhost:3002`, same way as TimeAwarePredictor and RecurrenceUnroll.
2. For each, decide:
   - Is the **concept** landing? If not, rebuild like RecurrenceUnroll (kill features, focus on one idea).
   - Are the **visuals** clean? If not, apply the pattern above.
3. Plan doc with build queue is at `RNN_ANIMATIONS_PLAN.md` (all six boxes ticked — but ticked ≠ approved).

## Other-course audit (results)

Density rating: **a** = prose-only · **b** = prose + static diagrams · **c** = prose + interactive components

### agentic-ai · 9 lessons · density: all **b**
- Has `<PythonPlayground>` cells in every lesson (~18 active playgrounds total). Strong code-along, no external images.
- Top animation candidates:
  1. **L04 Planner** — agent decomposition flow (research question → sub-tasks)
  2. **L06 Shared memory** — state transitions across multi-agent context
  3. **L08 Full system** — orchestration loop + failure modes

### ai-research · 1 lesson · density: **a**
- Single essay-heavy lesson on Aletheia / Gemini Deep Think. No code, no viz.
- Top animation candidates:
  1. **Generator–Verifier–Reviser loop** — show state transitions + feedback paths
  2. **Inference-time scaling curve** — non-monotonic compute → quality relationship
  3. **Benchmark progression** — IMO → FutureMath → Erdős difficulty leap

### attention-is-all-you-need · 9 lessons · density: 3×**a**, 4×**b**, 2×**c**
- Existing viz: `AttentionVisualizer` (L5), `ViTAttention` (L7), `VanishingGradient` (L2).
- Top animation candidates:
  1. **L03 Attention** — scaled dot-product mechanics: Q·Kᵀ → softmax → weighted sum
  2. **L04 Self-attention** — dependency paths in sequence (O(layers) vs RNN's O(seq-length))
  3. **L08 Encoder-Decoder** — cross-attention information flow

### build-and-train-your-own-gpt2-model · 10 lessons · density: 1×**a**, 6×**b**, 3×**c**
- **6 existing `<AnimationPlaceholder>` slots** awaiting real components — fill these first before building anywhere else.
- Existing: `TokenizerPlayground` (L2), `CausalMask` (L5), `GenerationPlayground` (L9).
- Top animation candidates:
  1. **L03 Positional embeddings** — sinusoidal patterns across dimensions/frequencies
  2. **L07 Layer normalization** — mean/variance + scale/shift along feature axis
  3. **L04 Multi-head attention** — per-head pattern emergence (multiple linguistic patterns in parallel)

### deep-neural-networks · 10 lessons · density: 7×**a**, 1×**b**, 2×**c**
- Existing: `VanishingGradient` (backward-pass), `PythonPlayground` (NN from scratch).
- **Mostly prose-only** — high opportunity.
- Top animation candidates:
  1. **L06 Loss functions** — 3D loss surface + descent path + LR effects (reuse `LossLandscapeViz`)
  2. **L08 Overfitting** — train/val divergence over epochs + regularization intervention
  3. **L04 Forward pass** — tensor-shape propagation (B, 784) → (B, 256) → (B, 10)

### foundations-of-regression · 6 lessons · density: 2×**a**, 1×**b**, 3×**c**
- Existing: `ActivationViz` (L1, L3, L4), `PythonPlayground` (L5).
- 3 static images that could be replaced.
- Top animation candidates:
  1. **L06 Decision boundaries** — nonlinear boundary shifts as weights/bias change
  2. **L01 Linear regression** — RSS surface + gradient descent path + fitting line updating
  3. **L05 Log-likelihood** — likelihood landscape + class probability distributions

### ml-system-design · 16 lessons · density: 14×**a**, 2×**b**
- **Zero interactive components across 16 lessons.** Highest pedagogical opportunity of any course.
- Top animation candidates:
  1. **L01 Recsys define problem** — funnel dynamics (filter/score at each stage with latency–accuracy tradeoff)
  2. **L03 Recsys retrieval** — 2D/3D embedding-space projection with two-tower nearest-neighbor lookups
  3. **L08 RAG define problem** — query → retrieve → augment → generate loop with relevance ranking

### mle-interview · 1 lesson · density: **a**
- Reference playbook, not a tutorial. **No animations needed** — keep prose.

---

## Cross-course priority queue

Recommended next sprint, ordered by leverage:

1. **build-and-train-your-own-gpt2**: fill the 6 `<AnimationPlaceholder>` slots (L03, L04, L06, L07, L08, L09). Already-flagged work — just needs execution.
2. **ml-system-design L01/L03/L08**: 16-lesson course with zero interactivity. Recsys funnel + two-tower retrieval + RAG loop would transform the course.
3. **attention-is-all-you-need L03/L04/L08**: scaled dot-product, self-attention paths, cross-attention flow. Math-forward course; viz unlocks intuition.
4. **deep-neural-networks L06**: loss surface — can reuse the existing `<LossLandscapeViz />` directly.
5. **foundations-of-regression L01/L06**: linear-regression RSS surface + decision boundaries.
6. **agentic-ai L04/L06/L08**: only justified after the higher-leverage targets are done.
7. **ai-research**: skip animations; it's an essay.
8. **mle-interview**: skip animations; it's a reference.
