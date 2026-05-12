#!/usr/bin/env node
/**
 * lesson-audit · render-report.mjs
 *
 * Reads scripts/lesson-audit/last-run.json and emits a markdown heatmap to stdout.
 *
 * Usage (from prof-content-engine/):
 *   node scripts/lesson-audit/render-report.mjs > /Users/lexai/Documents/prof/lesson-audit-report.md
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JSON_PATH = join(__dirname, 'last-run.json');

const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const { summary, results } = data;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function bucket(path) {
  const m = path.match(/^docs\/([^\/]+)/);
  if (!m) return '(other)';
  const top = m[1];
  // Group by course / area
  const sub = path.match(/^docs\/[^\/]+\/([^\/]+)/);
  return sub ? `${top}/${sub[1]}` : top;
}

function severity(composite) {
  if (composite >= 30) return '🔴 high';
  if (composite >= 15) return '🟠 mid';
  if (composite >= 6) return '🟡 low';
  return '🟢 ok';
}

function pct(n, total) {
  if (!total) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}

// ────────────────────────────────────────────────────────────────────────────
// Output
// ────────────────────────────────────────────────────────────────────────────

const lines = [];

lines.push(`# Lesson audit report`);
lines.push(``);
lines.push(`**Run at:** ${summary.runAt}`);
lines.push(`**Files audited:** ${summary.fileCount}`);
lines.push(`**Total words:** ${summary.totalWords.toLocaleString()}`);
lines.push(`**Average composite score:** ${summary.avgComposite.toFixed(2)}`);
lines.push(``);
lines.push(`> Composite score combines: hedge-phrase rate per 1k words + overused-transition rate + long-paragraph count (×2) + stub markers (×3) + em-dash overuse + frontmatter issues + LaTeX-duplication findings (×2). Higher = more attention needed. Severity: 🔴 ≥30, 🟠 ≥15, 🟡 ≥6, 🟢 <6.`);
lines.push(``);

// ────────────────────────────────────────────────────────────────────────────
// Section: Top 10 worst offenders
// ────────────────────────────────────────────────────────────────────────────

lines.push(`## Top 10 worst offenders`);
lines.push(``);
lines.push(`These are the lessons to attack first in the editorial pass.`);
lines.push(``);
lines.push(`| Rank | Severity | File | Composite | Hedges/1k | Long paras | Stubs | LaTeX dup | FM issues |`);
lines.push(`|---|---|---|---|---|---|---|---|---|`);

const valid = results.filter((r) => !r.error);
valid.slice(0, 10).forEach((r, i) => {
  lines.push(
    `| ${i + 1} | ${severity(r.composite)} | \`${r.path}\` | **${r.composite}** | ${r.slopRate} | ${r.longParas} | ${r.stubHits} | ${r.latexDupHits || 0} | ${r.fmIssues.length} |`
  );
});
lines.push(``);

// ────────────────────────────────────────────────────────────────────────────
// Section: Per-bucket health
// ────────────────────────────────────────────────────────────────────────────

const buckets = new Map();
for (const r of valid) {
  const b = bucket(r.path);
  if (!buckets.has(b)) buckets.set(b, []);
  buckets.get(b).push(r);
}

lines.push(`## Health by course / area`);
lines.push(``);
lines.push(`| Bucket | Files | Avg composite | High 🔴 | Mid 🟠 | Low 🟡 | OK 🟢 |`);
lines.push(`|---|---|---|---|---|---|---|`);

const bucketEntries = [...buckets.entries()].map(([b, rs]) => {
  const avg = rs.reduce((s, r) => s + r.composite, 0) / rs.length;
  const high = rs.filter((r) => r.composite >= 30).length;
  const mid = rs.filter((r) => r.composite >= 15 && r.composite < 30).length;
  const low = rs.filter((r) => r.composite >= 6 && r.composite < 15).length;
  const ok = rs.filter((r) => r.composite < 6).length;
  return { b, count: rs.length, avg, high, mid, low, ok };
});

bucketEntries.sort((a, b) => b.avg - a.avg);

for (const e of bucketEntries) {
  lines.push(
    `| ${e.b} | ${e.count} | ${e.avg.toFixed(2)} | ${e.high} | ${e.mid} | ${e.low} | ${e.ok} |`
  );
}
lines.push(``);

// ────────────────────────────────────────────────────────────────────────────
// Section: Full ranked list
// ────────────────────────────────────────────────────────────────────────────

lines.push(`## Full ranked list`);
lines.push(``);
lines.push(`Sorted by composite score (worst first). Click a path to open the file.`);
lines.push(``);
lines.push(
  `| Severity | File | Composite | Words | Hedges/1k | Trans/1k | EM-dash/1k | Long paras | Longest para | Stubs | LaTeX dup | FM issues |`
);
lines.push(`|---|---|---|---|---|---|---|---|---|---|---|---|`);

for (const r of valid) {
  const fmStr = r.fmIssues.length > 0 ? r.fmIssues.join(', ') : '—';
  lines.push(
    `| ${severity(r.composite)} | \`${r.path}\` | ${r.composite} | ${r.wordCount} | ${r.slopRate} | ${r.transRate} | ${r.emDashDensity} | ${r.longParas} | ${r.longestPara} | ${r.stubHits} | ${r.latexDupHits || 0} | ${fmStr} |`
  );
}
lines.push(``);

// ────────────────────────────────────────────────────────────────────────────
// Section: Top hedge offenders (shows actual phrases used)
// ────────────────────────────────────────────────────────────────────────────

lines.push(`## What words / phrases actually triggered`);
lines.push(``);
lines.push(`Helpful for tuning the rule list. Top 5 most-flagged hedges across the corpus:`);
lines.push(``);

const hedgeTotals = new Map();
for (const r of valid) {
  for (const [phrase, count] of Object.entries(r.breakdown?.hedges || {})) {
    hedgeTotals.set(phrase, (hedgeTotals.get(phrase) || 0) + count);
  }
}
const hedgeRanked = [...hedgeTotals.entries()].sort((a, b) => b[1] - a[1]);

lines.push(`| Phrase | Total hits |`);
lines.push(`|---|---|`);
for (const [phrase, count] of hedgeRanked.slice(0, 15)) {
  lines.push(`| \`${phrase}\` | ${count} |`);
}
lines.push(``);

// ────────────────────────────────────────────────────────────────────────────
// Section: LaTeX duplication findings
// ────────────────────────────────────────────────────────────────────────────

const latexFindings = valid.filter((r) => r.latexDupHits > 0);
if (latexFindings.length > 0) {
  lines.push(`## LaTeX duplication findings`);
  lines.push(``);
  lines.push(`Equations rendered twice — once in LaTeX, once in plain text or under a renamed alias. The reader irritant Jupyter-export pattern. Fix: keep the LaTeX, drop the prose-mirror.`);
  lines.push(``);
  lines.push(`| File | Pattern A (math + plain-text) | Pattern B (alias rename) |`);
  lines.push(`|---|---|---|`);
  for (const r of latexFindings) {
    const aHits = r.latexDupBreakdown?.patternA || [];
    const bHits = r.latexDupBreakdown?.patternB || [];
    const aDesc = aHits.length > 0
      ? aHits.map((f) => `L${f.mathLine}→L${f.dupLine}`).join(', ')
      : '—';
    const bDesc = bHits.length > 0
      ? bHits.map((f) => `L${f.firstLine}→L${f.secondLine}`).join(', ')
      : '—';
    lines.push(`| \`${r.path}\` | ${aDesc} | ${bDesc} |`);
  }
  lines.push(``);
  lines.push(`Re-run \`node scripts/lesson-audit/latex-dup-check.mjs <file>\` for the side-by-side text of each finding.`);
  lines.push(``);
}

// ────────────────────────────────────────────────────────────────────────────
// Section: Errors (if any)
// ────────────────────────────────────────────────────────────────────────────

const errored = results.filter((r) => r.error);
if (errored.length > 0) {
  lines.push(`## Errors`);
  lines.push(``);
  for (const e of errored) {
    lines.push(`- \`${e.path}\` — ${e.error}`);
  }
  lines.push(``);
}

// ────────────────────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────────────────────

lines.push(`---`);
lines.push(``);
lines.push(`Generated by \`scripts/lesson-audit/render-report.mjs\` from \`scripts/lesson-audit/last-run.json\`.`);
lines.push(``);

process.stdout.write(lines.join('\n'));
