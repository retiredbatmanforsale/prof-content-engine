# lesson-audit

Editorial linter for the prof-content-engine course corpus. Walks every `.mdx` / `.md` file under `docs/`, scores each on AI-slop signals, bloat, and stub markers, and produces a ranked heatmap for editorial review.

**No content is modified.** This is a read-only analysis tool.

## How to run

From `prof-content-engine/`:

```bash
node scripts/lesson-audit/audit.mjs
node scripts/lesson-audit/render-report.mjs > /Users/lexai/Documents/prof/lesson-audit-report.md
```

`audit.mjs` writes raw scores to `scripts/lesson-audit/last-run.json`.
`render-report.mjs` reads that JSON and emits a markdown heatmap.

## Rule list

### Hedge phrases (the AI-tells)

| Pattern | Why it's flagged |
|---|---|
| `it's important to note` | Empty filler. |
| `in conclusion` | Doesn't belong in a lesson. |
| `navigate the complexit*` | LLM stock phrase. |
| `delve into` / `delving into` | LLM stock phrase. |
| `seamlessly` | Always a tell. |
| `in today's world` | Empty filler. |
| `let's explore` | Weak transition. |
| `in summary` / `to summarize` | Belongs in TL;DR sections, not prose. |
| `as previously mentioned` / `as we've seen` | Reader knows; weakens the line. |
| `crucial`, `essential`, `vital` | Adjective inflation; usually drop without loss. |
| `robust`, `leverage`, `utilize` | Corporate-speak. |
| `in the realm of`, `cornerstone of`, `game-changing` | LLM cliché. |
| `unlock the potential`, `harness the power`, `testament to` | Marketing slop. |

### Overused transitions

`Moreover,` / `Furthermore,` / `Additionally,` at paragraph starts. One per lesson is fine; three or more flags slop.

### Em-dash density

Counted per 1,000 words. Density above 8 / 1k is flagged as suspicious — LLMs over-use them.

### Bloat

- Any paragraph over **120 words** — flagged.
- Longest paragraph reported per file.

### Stub markers (prose only)

`TODO`, `FIXME`, `XXX`, `placeholder`, `coming soon`, `WIP`, `<!-- todo`. Any hit **in prose** is flagged.

**Code-block TODOs are NOT counted.** Build-it-yourself lessons (the Karpathy / pedagogical-scaffold pattern used in the agentic-ai and GPT-2 courses) intentionally place `# TODO:` comments inside code blocks as student exercises. Those are features, not authoring gaps. HTML-comment TODOs (`<!-- TODO: -->`) in prose still count, because those genuinely indicate something the author left undone.

### Frontmatter issues

- Missing `title` / `description`.
- `tutor_concepts: []` (empty array, signals AI Tutor not wired).

## Composite score

Higher = more attention needed. Severity bands:

- 🔴 **High** — composite ≥ 30. Editorial pass mandatory.
- 🟠 **Mid** — composite 15-29. Trim and tighten.
- 🟡 **Low** — composite 6-14. Spot-check.
- 🟢 **OK** — composite < 6. Probably fine.

Composite = `slop_rate + trans_rate + (long_paras × 2) + (stub_hits × 3) + em_dash_overuse_flag + frontmatter_issue_count`.

## Tuning

If a rule produces too many false positives or misses real problems, edit the rule list at the top of `audit.mjs`. Re-run the full audit after every rule change. The "What words / phrases actually triggered" section in the heatmap shows which rules are firing hardest — useful for sanity-checking the rule list itself.

## What this tool does NOT do

- It does not understand pedagogy, voice, or correctness.
- It does not know whether a long paragraph is justified by content density.
- It does not catch factual errors.
- It does not catch boring-but-correctly-written lessons.

The tool produces a *prioritised list of files to read*. The reading still has to happen. That's Days 3-5 of the Learn-and-Practice plan, with Puru in the room.
