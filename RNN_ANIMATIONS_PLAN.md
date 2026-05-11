# RNN Animations — Build Plan

Self-driving plan for the Deep Sequence Modelling (RNN) course. Each `/loop` iteration builds **one animation end-to-end** (component → MDX registration → lesson embed → checkbox tick) and then stops. Re-firing the loop picks up where the previous one left off. The loop terminates naturally when every task is checked.

---

## How to run

Copy-paste this single command into the prompt to start the loop:

```
/loop "Open /Users/lexai/Documents/prof/prof-content-engine/RNN_ANIMATIONS_PLAN.md, find the FIRST unchecked task in the Status checklist, then complete it fully: (1) build the component file at the spec'd path following the Pedagogical Pattern section, (2) register it in src/theme/MDXComponents.js, (3) embed <Component /> in the target lesson MDX at the spec'd section, (4) flip the checkbox from [ ] to [x] in this plan doc. Use ScheduleWakeup(60s) to fire the next iteration only if at least one task is still unchecked. If all tasks are checked, do not schedule another wakeup — the loop ends. Do not skip steps. Do not bundle multiple tasks per iteration."
```

When all 6 boxes are ticked, the loop self-terminates.

---

## Status — build queue (6 animations)

- [x] **1. RecurrenceUnroll** → Lesson 2 (`from-static-networks-to-time-aware.mdx`)
- [x] **2. RNNForwardPass** → Lesson 3 (`rnn-internal-mechanics.mdx`)
- [x] **3. LSTMCell** → Lesson 4 (`lstm-and-gru.mdx`)
- [x] **4. BPTTFlow** → Lesson 6 (`training-rnn-backprop-through-time.mdx`)
- [x] **5. TimeAwarePredictor** → Lesson 1 (`foundations-of-deep-sequence-modeling.mdx`)
- [x] **6. TokenToVector** → Lesson 5 (`bringing-sequence-modeling-real-world.mdx`)

Order is chosen so the highest-leverage builds (recurrence + forward pass + LSTM gates) land first. The loop will always pick the topmost unchecked task.

---

## Reusable components (do NOT rebuild — embed where useful)

| Component | Path | Use in |
|---|---|---|
| `<VanishingGradient />` | `src/components/viz/VanishingGradient/` | Already in Lesson 6 — keep |
| `<LossLandscapeViz />` | `src/components/viz/LossLandscape/` | 3D oblique loss surface (convex + nonconvex modes, gradient-descent trace). Add to Lesson 6 BPTT section to motivate optimization difficulty in RNN training. **The BPTTFlow task should also embed this.** |
| `<GradientDescentViz />` | `src/components/viz/GradientDescentViz` | Generic 1D descent — already in Lesson 6, leave as-is |

---

## Pedagogical pattern (apply to every animation)

Every new animation MUST follow this shape so faculty learners only learn the visual grammar once:

1. **Wrapper:** `not-prose my-6 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900`
2. **Header strip:** `Interactive · <Concept name>` in uppercase tracking-wider; one-line subtitle describing what the user will see
3. **Stepper chips at top** (when applicable): show all stages as clickable chips; current = teal solid, past = teal-soft, future = neutral border
4. **Center panel:** render LIVE matrix/vector values (not just shapes). Reuse `<Grid>` style from `ForwardPassAnimation.tsx` (cell SVG rects with `signedFill` for ±values, `grayFill` for 0–1)
5. **Stage-card state:**
   - **Active:** teal-500 border + teal-50 bg + `▶ now` badge + shadow-md
   - **Revealed (past):** white bg, teal-600 badge with step number
   - **Future:** dashed border + opacity-60 + "…waiting for upstream stage" placeholder
6. **Controls row:** Play/Pause (teal-600), Step ◀/▶ (slate outline), Reset (slate outline), Speed slider (10–3000 ms range chosen per component)
7. **Color language:**
   - **Forward / feed-in / activations:** teal (`bg-teal-600`, `text-teal-600`, arrows `→`)
   - **Backward / gradients:** rose (`bg-rose-600`, arrows `←`)
   - **Positive values:** emerald shading
   - **Negative values:** rose shading
   - **Zero:** slate-100/700
8. **Live math:** When showing equations, use plain JSX (`<sub>`, `<sup>`, Unicode `Σ`, `·`, `→`) — NO `$$ ... $$` blocks (they double-render).
9. **All computation done live in the browser** — hand-design tiny weight matrices so the math is real, not faked.
10. **Component is a single .tsx file** in `src/components/viz/`. Default export the component. Use `useState` + `useEffect` for play state; precompute heavy stuff in `useMemo`.

Reference for "what good looks like": `src/components/viz/ForwardPassAnimation.tsx` (CNN forward pass) and `src/components/viz/LearnableFilters.tsx` (gradient descent). New components should feel like siblings of these.

---

## Per-task specs

### Task 1 · RecurrenceUnroll
- **File:** `src/components/viz/RecurrenceUnroll.tsx`
- **Lesson:** `docs/ai-for-engineering/deep-sequence-modelling-rnn/from-static-networks-to-time-aware.mdx`
- **Embed at:** the "Visualizing recurrence" section (replacing or following the two static PNG references — `perceptron-lesson-2.png`, `neurons-recurrence-lesson2.png`)
- **Concept:** Toggle between cyclic and unrolled views of an RNN. Step through 5 timesteps watching the hidden-state vector evolve via `h_t = tanh(W_xh · x_t + W_hh · h_{t-1} + b)`.
- **Design:**
  - Top toggle: `[Cyclic ⇄ Unrolled]`
  - **Cyclic view:** single recurrent cell, self-loop arrow visualizing h flowing back
  - **Unrolled view:** 5 cells in a row, `h_0 → h_1 → h_2 → h_3 → h_4` with input vectors `x_t` feeding each
  - Both views populate the same hidden state values as `t` advances
  - Hidden state = 4-D vector, displayed as 4 cells with `signedFill`
  - Input vector = 3-D, hand-designed sequence with a clear pattern (e.g., ramps up then drops)
  - Stepper chips: `t=0, t=1, …, t=4`
  - On step: highlight active timestep, write the matrix multiply into a small "computation" panel
- **Pre-baked weights:** small `W_xh` (4×3), `W_hh` (4×4), `b_h` (4) with non-trivial values
- **Bonus:** show that the SAME weights are reused at every timestep — that's the recurrence insight

### Task 2 · RNNForwardPass
- **File:** `src/components/viz/RNNForwardPass.tsx`
- **Lesson:** `docs/ai-for-engineering/deep-sequence-modelling-rnn/rnn-internal-mechanics.mdx`
- **Embed at:** end of the "Unrolled representation and weight sharing" section (replaces or follows `RNN-arch-lesson3.png`, `RNN-stateupdate-and-output-lesson3.png`)
- **Concept:** Full RNN forward pass at a single timestep, then stepped across the full sequence. Show every intermediate computation.
- **Design:**
  - 5-stage chips: **Input** · **W_xh·x** · **+W_hh·h_{t-1}** · **tanh** · **Output (W_hy·h)**
  - Centre panel for stage 2/3: render the 4×3 W_xh matrix with `signedFill` cells + numeric labels, multiplied by x_t (3-D), producing a 4-D intermediate. Stage 3 adds the W_hh·h_{t-1} term.
  - After tanh stage: hidden state h_t shown as 4-D vector
  - Output stage: W_hy (2×4) maps to y_t (2-D)
  - Beneath the 5-stage walkthrough: a "timeline" of 5 timesteps; "Play" auto-advances through (stage × timestep) = 25 micro-steps
  - Live math display (JSX, not LaTeX): `h_t = tanh(W_xh·x_t + W_hh·h_{t-1} + b_h)` and `y_t = W_hy·h_t + b_y`
- **This is the cornerstone animation of the course** — invest in it.

### Task 3 · LSTMCell
- **File:** `src/components/viz/LSTMCell.tsx`
- **Lesson:** `docs/ai-for-engineering/deep-sequence-modelling-rnn/lstm-and-gru.mdx`
- **Embed at:** end of the "The LSTM cell" section (after the gates table)
- **Concept:** LSTM cell with forget / input / candidate / output gates controlling the cell-state "highway" `c_t`. Faculty audiences specifically struggle with gating intuition — make this visceral.
- **Design:**
  - Schematic cell with `c_{t-1}` entering left, `c_t` exiting right (the "highway")
  - Below: `h_{t-1}` and `x_t` enter, four gate computations visible: `f_t = σ(W_f·[h_{t-1},x_t])`, `i_t`, `g_t`, `o_t`
  - Each gate rendered as a small panel with a sigmoid/tanh meter showing its 0–1 (or −1..1) output
  - Cell-state update displayed explicitly: `c_t = f_t ⊙ c_{t-1} + i_t ⊙ g_t`
  - Hidden state: `h_t = o_t ⊙ tanh(c_t)`
  - **Three preset scenarios** as buttons:
    1. *Remember everything* — forces forget gate ≈ 1
    2. *Forget previous* — forget gate ≈ 0
    3. *Selective* — gates respond to input
  - Auto-play across 5 timesteps to see how `c_t` carries information that would have vanished in a vanilla RNN
- **Live math:** all 4 gate equations + cell state + hidden state

### Task 4 · BPTTFlow
- **File:** `src/components/viz/BPTTFlow.tsx`
- **Lesson:** `docs/ai-for-engineering/deep-sequence-modelling-rnn/training-rnn-backprop-through-time.mdx`
- **Embed at:** the "Backpropagation Through Time (BPTT)" section, as its centrepiece. Also embed `<LossLandscapeViz />` in the same section if it's not already there (the existing `<VanishingGradient />` and `<GradientDescentViz />` stay).
- **Concept:** Show forward pass through an unrolled RNN, then gradient flow backward through time, with the Jacobian chain product accumulating and visibly shrinking/exploding.
- **Design:**
  - 5 unrolled cells in a row (same visual grammar as RecurrenceUnroll's unrolled view)
  - **Phase 1 — Forward:** teal arrows light up left-to-right, hidden state values populate
  - **Phase 2 — Loss:** a loss bubble at `t=4` pulses, showing the scalar loss value
  - **Phase 3 — Backward:** rose arrows flow right-to-left. At each transition, display `∂h_t/∂h_{t-1} = W_hh^T · diag(tanh'(h_t))` as a small matrix
  - **Cumulative Jacobian product** displayed as a single number that shrinks (toward 0) or grows (toward ∞) as the gradient propagates back
  - Toggle: `[Vanishing preset · ‖W_hh‖<1]` vs `[Exploding preset · ‖W_hh‖>1]` — flips the W_hh values
  - Bottom callout: "This product of T Jacobians is exactly why vanilla RNNs can't learn long-range dependencies."
- **Visual relationship to forward animation:** use the SAME 5-cell unrolled layout from `RNNForwardPass.tsx` so the learner immediately recognises BPTT as the reverse direction of the forward pass they just learned.

### Task 5 · TimeAwarePredictor
- **File:** `src/components/viz/TimeAwarePredictor.tsx`
- **Lesson:** `docs/ai-for-engineering/deep-sequence-modelling-rnn/foundations-of-deep-sequence-modeling.mdx`
- **Embed at:** end of the "Core challenge: capturing temporal dependencies" section
- **Concept:** Side-by-side ball-trajectory prediction. The naive FFN sees only the current position and guesses randomly; the RNN sees the sequence and extrapolates the trajectory.
- **Design:**
  - Left canvas: FFN predictor. Takes only `x_t` (current 2D position) → predicts `x̂_{t+1}`. Predictions scatter near the current point.
  - Right canvas: RNN predictor. Takes the rolling sequence + hidden state → predicts `x̂_{t+1}`. Predictions track the curve.
  - True trajectory: a circular or sinusoidal path
  - Play button advances time; both panels update in lockstep
  - Show RMSE counter underneath each panel
  - Use a hand-tuned tiny RNN with pre-baked weights so the RNN clearly succeeds
- **Why this matters:** opens the course by giving faculty an instant intuition for why we need a memory mechanism at all.

### Task 6 · TokenToVector
- **File:** `src/components/viz/TokenToVector.tsx`
- **Lesson:** `docs/ai-for-engineering/deep-sequence-modelling-rnn/bringing-sequence-modeling-real-world.mdx`
- **Embed at:** the "Vectorizing the Input: From Words to Numbers" section
- **Concept:** Show the three stages of getting text into an RNN — tokenize → vocab index → vector (one-hot vs learned embedding).
- **Design:**
  - Text input (default: `"the cat sat on the mat"`)
  - Stage 1 — **Tokens:** each word rendered as a coloured chip in order
  - Stage 2 — **Vocab indices:** map each token to an integer using a hand-designed 50-word vocab. Show the index next to each token.
  - Stage 3a — **One-hot:** for the selected token, show a 50-D sparse vector (49 zeros + one 1, indexed). Render as horizontal strip.
  - Stage 3b — **Embedding:** the same token through an `E[i]` lookup, producing a dense 4-D vector with `signedFill` cells.
  - Toggle: "Show one-hot" vs "Show embedding" so the dimensionality / density contrast lands hard.
  - **Hover/click any token chip** to make it the "selected" one feeding into stages 3a/3b.
- **Math shown (JSX):** `one-hot(i) = e_i ∈ ℝ^|V|`, `embed(i) = E[i] ∈ ℝ^d` with `d ≪ |V|`

---

## Sequencing notes

- **Why this build order:** Tasks 1–4 cover concepts 2–8 from the audit (hidden state, recurrence, forward pass, LSTM, BPTT, vanishing gradients). After those four ship, the course is faculty-presentable. Tasks 5–6 are motivation and detail polish.
- **Visual grammar carry-over:** Task 2 (`RNNForwardPass`) establishes the unrolled 5-cell layout. Task 4 (`BPTTFlow`) **must reuse the same layout** — only the arrow direction and Jacobian-product overlay change. The learner should recognise it as "the forward animation played backward."
- **Lesson-order issue (out of scope for this loop):** LSTM (Lesson 4) is currently introduced before BPTT (Lesson 6), even though LSTM's *motivation* is vanishing gradients introduced in BPTT. Consider swapping Lesson 4 ↔ Lesson 6 after these animations ship. The animations themselves don't depend on the lesson order.

---

## Per-iteration checklist (the loop follows this)

For each task the loop picks up, it does — in order:

1. Create the .tsx file at the spec'd path. Default-export the component. Follow the Pedagogical Pattern.
2. Add the import + named registration in `src/theme/MDXComponents.js`.
3. Open the target lesson .mdx, find the spec'd section, embed `<ComponentName />`. Remove any redundant PNG image imports and `<img>` references the new animation replaces.
4. Flip the `[ ]` to `[x]` in the Status section of this file for the completed task.
5. Schedule the next wakeup only if at least one box remains unchecked.
