# Prof by Lex AI — Autonomy & Launch Ceiling Opinion

**Companion to:** `opinion-2026-04-29.md` (audit, score 6.0/10)
**Author:** Claude Opus 4.7 (1M context)
**Date:** 2026-04-29

---

## Bottom line up front

Without recording a single video and without any new decisions from you, I can drive the platform from **6.0 → ~8.5 / 10** in roughly one focused working day of my time. The last 1.5 points (8.5 → 10) require things only you can produce: video lectures, brand decisions, real student testing, and a few high-stakes editorial calls. **You should launch at 8.0**, not 10. Anything above 8.0 is polish that does not move conversion — every week spent chasing 9.5 is a week competitors don't lose.

The platform is **less blocked on you than it feels**. The reason readiness moved only +0.5 in three days isn't that the remaining work is hard; it's that the work was framed as "Puru's tasks." Most of it isn't.

---

## The autonomy ladder

Every remaining audit finding falls into one of four tiers. Knowing which tier matters more than the finding itself.

### Tier 1 — Pure autonomy (I do it, you review the diff)
Writing, fixing, restructuring code, applying templates, adding components. No taste calls, no brand-facing copy. I can complete these end-to-end and you skim the PR.

### Tier 2 — Draft + your sign-off
Course restructures, landing pages, learner journey maps, anything that touches positioning or pricing. I can produce a strong first draft; you decide if it ships.

### Tier 3 — Permanently blocked on you
Things only a human with your face, voice, brand authority, and a real classroom can do. Recording videos. Approving final brand decisions. Talking to actual students. Pricing. Legal sign-off on third-party assets.

### Tier 4 — Soft-blocked, workaroundable
Things that *look* blocked on you but actually have a Claude-shaped workaround. The clearest example: GPT-2 has duplicate Vimeo IDs because new ones don't exist yet. I can't record videos — but I can `access: private` the course so the duplicates stop being a public problem. The blocker dissolves.

---

## Concrete autonomous backlog

Every item below is Tier 1 unless tagged. Effort is *my* time, not yours; "review" is your time.

### A. Cheap wins — under 2 hours total, one session
| Item | My effort | Dimension lifted |
|------|-----------|------------------|
| Fix GenAI `::::` admonition + orphan `:::` (line 65, 98) | 1 min | Launch readiness |
| Replace DNN IR Q3 (self-attention → batch-norm or weight-init question) | 10 min | Tech accuracy, IR quality |
| Add lesson navigation cards to Prompt Engineering `introduction.mdx` | 15 min | Navigation consistency |
| Expand AIAYN L4 `attention.mdx` from 250 → 900 words with worked Q/K/V example | 45 min | Content depth (Eng), Launch readiness |
| Set `access: private` on all 10 GPT-2 lesson bodies (until videos exist) | 5 min | Launch readiness (kills the worst finding) |
| Add `:::note[Prerequisites]` admonitions to all 9 course intros | 20 min | Navigation consistency |

**Combined dimension impact:** Launch readiness 3 → 7. Navigation 4 → 7. Content depth (Eng) 7 → 8.
**Score after this batch alone: ~7.0 / 10.**

### B. Assessment coverage — the single biggest lever (~4–5 hours)
The audit's lowest score (2/10) is also the most mechanical to fix. Every course except Regression has zero quizzes. The Regression `<Quiz>` component is the working template.

| Item | My effort |
|------|-----------|
| Add 3–4 quiz questions per lesson to DNN (10 lessons → ~35 questions) | 90 min |
| Add 3–4 quiz questions per lesson to AIAYN (14 lessons → ~50 questions) | 120 min |
| Add 3–4 quiz questions per lesson to CNN, RNN, Regression-tail (~25 questions) | 60 min |
| Add quizzes to GenAI + Prompt Engineering (~25 questions) | 45 min |

**Total: ~135 quiz questions across 6 courses.** Quality bar: same as the existing Regression quizzes (single-best-answer, conceptual, each tied to a specific equation or diagram in the lesson). I write them with citations to the lesson section so a reviewer can verify in 30 seconds per question.
**Dimension impact:** Assessment coverage 2 → 9.
**Score after A + B: ~7.6 / 10.**

### C. Course completeness gaps (~3–4 hours)
| Item | My effort |
|------|-----------|
| Write Agentic AI interview-readiness file (12 questions, ~2,500 words) | 90 min |
| Write LSTM + GRU dedicated lesson for RNN course (~1,200 words) | 60 min |
| Write GPT-2 lesson bodies 01–10 (~6,000–8,000 words) — **OR** keep them gated | 3 hrs |
| Write 3 supplementary lessons in `ai-research/` to make it a real track | 2.5 hrs |
| Add a tokenization/BPE lesson to AIAYN (gap noted by the researcher lens) | 60 min |
| Smooth CNN tonal shift: introduce filter-size formula in L4 instead of L7 | 30 min |
| Move RNN local PNGs (4 files) to `/static/img/rnn/` with stable paths | 20 min |

**Decision required from you:** GPT-2. Either I write the bodies (but they'll lack the videos that make a "build GPT-2" course credible), or we keep it gated until you record. I recommend **gating it** — a half-real GPT-2 course damages trust more than a hidden one.

**Score after A + B + C (assuming GPT-2 stays gated): ~8.2 / 10.**

### D. Polish that touches every course (~2 hours)
| Item | My effort |
|------|-----------|
| Standardize intro page structure (all 9 intros: description → video slot → nav cards → CourseTopicTree) | 60 min |
| Add cross-course "Next course" admonitions at end of each course | 30 min |
| Run a full equation-and-citation accuracy pass | 60 min |
| Implement `<MLEInterviewCharts />` if it's referenced but missing | 60 min (Tier 2 — needs your design taste) |

**Score after A + B + C + D: ~8.5 / 10.** This is the realistic ceiling without you.

### E. Tier 2 — drafts I produce, you sign off
- Platform home page with learner journey map (Regression → DNN → AIAYN → Agents)
- Repositioning of `ai-writing-and-talks/` (is it a track? a blog? a Puru personal-brand surface?)
- Whether to merge or split any courses
- Pricing page copy
- Course-completion certificates / badging design

These are 30–90 minutes each for me to draft, then yours to approve. I do not ship them without your review.

---

## What's the ceiling without you?

**~8.5 / 10**, hard cap. Here's the dimension-by-dimension breakdown of where I can take each score and where I can't:

| Dimension | Today | My ceiling | Cap reason |
|-----------|-------|------------|------------|
| Content depth (Engineering) | 7 | 9.5 | Can write everything except the GPT-2 video-anchored bodies |
| Content depth (Leaders) | 5 | 8.5 | I can write but the Leaders track also needs your industry voice |
| Assessment coverage | 2 | 9.5 | Pure mechanical work — Regression template is the spec |
| Video coverage | 5 | **5.5** | **Hard cap.** I can remove broken refs and embed yours, not record new ones |
| Interactive components | 7 | 9 | I can write more `<Quiz>`, `<Viz>`, `<PythonPlayground>` instances |
| Navigation consistency | 4 | 9.5 | Pure templating |
| IR / career-readiness | 9 | 10 | Adding Agentic AI IR closes the last gap |
| Technical accuracy | 8 | 9.5 | Audit pass clears scope leaks and minor errors |
| Launch readiness | 3 | 9 | Gating GPT-2 + fixing the cheap wins is most of this |

**Weighted average: 8.4–8.6 / 10.** Video coverage is the load-bearing ceiling. Every other dimension can reach 9+ autonomously.

---

## What's the ideal launch score?

**8.0 / 10.** Not 10. Not 9.

Here's the reasoning. Beyond 8.0, you stop fixing things learners notice and start fixing things only auditors notice. Your real signal — does this convert visitors into paid learners, does it retain them past lesson 3 — only comes from **launching to real users**. The April 26 audit and this re-audit are both me grading homework against a rubric I invented. A learner doesn't grade rubrics. They abandon at the first dead link, the first stub lesson, the first place the navigation lies to them. Get to 8.0, ship it, then let actual abandonment data tell you what 8.0 → 9.0 should be.

**Concretely, 8.0 means:**
- Zero stubs publicly visible (GPT-2 gated or written)
- Quizzes on every Engineering-track lesson
- All intro pages navigable
- AIAYN L4 written
- All P0 audit findings closed
- Cross-course consistency in nav and tone
- Video gaps acknowledged (e.g., "Coming soon" rather than missing)

**Things that are NOT required for 8.0:**
- Every course has a video on every lesson (Foundations of Regression has them — that's the model, but parity isn't a launch requirement)
- Perfect tonal consistency across all 71 lessons
- Marketing-grade landing pages
- Full mobile QA
- Internationalization

---

## The video bottleneck — handle it explicitly

Video is the only dimension I cannot move past 5.5. There are three ways to deal with it:

1. **Gate the video-dependent courses** (GPT-2 specifically) and launch the others. Honest, fast, no quality compromise.
2. **You do a recording sprint** — 2–3 days, ~30 short videos at 2–5 minutes each. Far less work than it sounds because you've already written the content. The video is just you reading the lesson with a slide deck. I can produce the slide decks and teleprompter scripts from the existing MDX in ~30 min/lesson. After your sprint, I do the embedding.
3. **Defer video parity to v1.1**. Launch with the videos you have (Regression + AIAYN partial + DNN partial), label the others as "Reading-first lessons," and add video later. The Agentic AI course already does this explicitly ("no video, no slides, just code") and it works.

I recommend **option 3** for launch and **option 2** as a Q3 sprint. Option 1 only for GPT-2 because that course's title implies a video-heavy build.

---

## Recommended sequence

If you give me a green light right now, here's how I'd spend the next two sessions:

**Session 1 (today, ~3 hours of my time)** — Tier 1 cheap wins + AIAYN L4 + gate GPT-2 + standardize intros. **Expected score: 7.4 / 10.** You review one PR.

**Session 2 (whenever, ~5 hours)** — Quizzes across DNN, AIAYN, CNN, RNN. Agentic AI IR file. LSTM lesson. **Expected score: 8.2 / 10.** You review a second PR.

**Optional Session 3 (~3 hours)** — Polish pass: equation audit, cross-course "next" admonitions, prerequisites, MLEInterviewCharts. **Expected score: 8.5 / 10. Launch from here.**

**Then ship.**

The thing I cannot stress enough: the bottleneck isn't capability, it's authorization. Tell me which tier-1 items I can run autonomously and I'll burn through them. Tell me which tier-2 drafts to produce and I'll produce them. Save your hours for the things only you can do — recording, deciding, talking to learners.
