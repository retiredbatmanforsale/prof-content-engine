#!/usr/bin/env node
/**
 * lesson-audit · audit.mjs
 *
 * Walks docs/**\/*.mdx, scores each file on AI-slop signals, bloat, and stub
 * markers, and writes JSON to scripts/lesson-audit/last-run.json.
 *
 * No npm dependencies. Built-in modules only.
 *
 * Usage (from prof-content-engine/):
 *   node scripts/lesson-audit/audit.mjs
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLatexDuplications } from './latex-dup-check.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..');
const DOCS_DIR = join(REPO_ROOT, 'docs');

// ────────────────────────────────────────────────────────────────────────────
// Rule list (review this if you adjust the audit)
// ────────────────────────────────────────────────────────────────────────────

const HEDGE_PHRASES = [
  /\bit'?s? important to note\b/gi,
  /\bin conclusion\b/gi,
  /\bnavigate the complexit/gi,
  /\bdelve into\b/gi,
  /\bdelving into\b/gi,
  /\bseamlessly\b/gi,
  /\bin today'?s world\b/gi,
  /\blet'?s explore\b/gi,
  /\bin summary\b/gi,
  /\bto summarize\b/gi,
  /\bas previously mentioned\b/gi,
  /\bas we'?ve seen\b/gi,
  /\bcrucial\b/gi,
  /\bessential\b/gi,
  /\bvital\b/gi,
  /\brobust\b/gi,
  /\bleverag(e|ing)\b/gi,
  /\butili[sz]e\b/gi,
  /\bin the realm of\b/gi,
  /\bcornerstone of\b/gi,
  /\bgame[- ]chang(er|ing)\b/gi,
  /\bunlock(s|ing) the (full )?potential\b/gi,
  /\bharness(es|ing)? the power\b/gi,
  /\btestament to\b/gi,
];

const OVERUSED_TRANSITIONS = [
  /(^|\n)\s*Moreover,\s/g,
  /(^|\n)\s*Furthermore,\s/g,
  /(^|\n)\s*Additionally,\s/g,
];

const STUB_MARKERS = [
  /\bTODO\b/g,
  /\bFIXME\b/g,
  /\bXXX\b/g,
  /\bplaceholder\b/gi,
  /\bcoming soon\b/gi,
  /\bWIP\b/g,
  /<!--\s*todo/gi,
];

// Bloat threshold
const PARAGRAPH_BLOAT_WORDS = 120;
const EM_DASH_PER_1K_SUSPICIOUS = 8;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function walkMdx(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkMdx(full));
    else if (name.endsWith('.mdx') || name.endsWith('.md')) out.push(full);
  }
  return out;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return { frontmatter: null, body: text, fmRaw: '' };
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: null, body: text, fmRaw: '' };
  const fmText = text.slice(4, end);
  const body = text.slice(end + 5);
  const fm = {};
  let lastKey = null;
  for (const line of fmText.split('\n')) {
    const m = line.match(/^([a-z_][a-z_0-9]*):\s*(.*)$/i);
    if (m) {
      fm[m[1]] = m[2];
      lastKey = m[1];
    } else if (line.startsWith('  ') && lastKey) {
      fm[lastKey] = (fm[lastKey] || '') + ' ' + line.trim();
    }
  }
  return { frontmatter: fm, body, fmRaw: fmText };
}

function stripCodeAndComponents(text) {
  let t = text;
  // Fenced code blocks
  t = t.replace(/```[\s\S]*?```/g, '');
  // Inline code
  t = t.replace(/`[^`]+`/g, '');
  // LaTeX blocks (display + inline)
  t = t.replace(/\$\$[\s\S]*?\$\$/g, '');
  t = t.replace(/\$[^$\n]+\$/g, '');
  // JSX self-closing tags
  t = t.replace(/<[A-Z][\s\S]*?\/>/g, '');
  // JSX paired tags (rough; greedy on inner content is fine for prose-only counts)
  t = t.replace(/<([A-Z][a-zA-Z0-9]*)[\s\S]*?<\/\1>/g, '');
  // HTML-ish tags
  t = t.replace(/<\/?[a-zA-Z][^>]*>/g, '');
  // Markdown table rows (heuristic — strip lines that start with | and end with |)
  t = t.replace(/^\|.*\|$/gm, '');
  return t;
}

function countMatches(text, regex) {
  return (text.match(regex) || []).length;
}

function wordCount(text) {
  return (text.match(/\S+/g) || []).length;
}

function paragraphLengths(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => wordCount(p));
}

// ────────────────────────────────────────────────────────────────────────────
// Per-file audit
// ────────────────────────────────────────────────────────────────────────────

function auditFile(path) {
  const raw = readFileSync(path, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);
  const prose = stripCodeAndComponents(body);
  const wc = wordCount(prose);

  // Hedge phrase counts
  let hedgeHits = 0;
  const hedgeBreakdown = {};
  for (const re of HEDGE_PHRASES) {
    const n = countMatches(prose, new RegExp(re.source, re.flags));
    if (n > 0) hedgeBreakdown[re.source.replace(/\\b/g, '')] = n;
    hedgeHits += n;
  }

  // Overused transitions
  let transitionHits = 0;
  const transitionBreakdown = {};
  for (const re of OVERUSED_TRANSITIONS) {
    const n = countMatches(prose, new RegExp(re.source, re.flags));
    if (n > 0) transitionBreakdown[re.source.replace(/[(^\\n)\\s*]+/g, '').replace(/,/g, ',')] = n;
    transitionHits += n;
  }

  // Stub markers in PROSE ONLY.
  // Code-block TODOs are pedagogical scaffolds (build-it-yourself exercises), not authoring gaps.
  // HTML comments survive stripCodeAndComponents, so `<!-- TODO -->` style real authoring gaps
  // are still detected. v1 of this scan checked `raw`, which produced false positives across
  // the agentic-ai course; v2 (2026-05-10) scans `prose` only.
  let stubHits = 0;
  const stubBreakdown = {};
  for (const re of STUB_MARKERS) {
    const n = countMatches(prose, new RegExp(re.source, re.flags));
    if (n > 0) stubBreakdown[re.source] = n;
    stubHits += n;
  }

  const emDashes = countMatches(prose, /—/g);
  const emDashDensity = wc > 0 ? (emDashes / wc) * 1000 : 0;

  // LaTeX-duplication findings (Pattern A: math + plain-text restatement;
  // Pattern B: consecutive equations under renamed aliases)
  const latexDup = findLatexDuplications(raw);
  const latexDupHits = latexDup.patternA.length + latexDup.patternB.length;

  const paraLens = paragraphLengths(prose);
  const longParas = paraLens.filter((l) => l > PARAGRAPH_BLOAT_WORDS).length;
  const longestPara = paraLens.length > 0 ? Math.max(...paraLens) : 0;

  // Frontmatter checks
  const fmIssues = [];
  if (!frontmatter) fmIssues.push('missing_frontmatter');
  else {
    if (frontmatter.tutor_concepts === '[]' || frontmatter.tutor_concepts === '') {
      fmIssues.push('empty_tutor_concepts');
    }
    if (!frontmatter.title) fmIssues.push('missing_title');
    if (!frontmatter.description) fmIssues.push('missing_description');
  }

  // Composite score: higher = worse
  // - hedge rate per 1k
  // - transition rate per 1k
  // - long-paragraph count (×2)
  // - stub markers (×3)
  // - em-dash overuse (1 point if density > threshold)
  // - frontmatter issues (1 point per issue)
  // - latex duplication findings (×2 — visible reader irritant)
  const slopRate = wc > 0 ? (hedgeHits / wc) * 1000 : 0;
  const transRate = wc > 0 ? (transitionHits / wc) * 1000 : 0;
  const composite =
    slopRate +
    transRate +
    longParas * 2 +
    stubHits * 3 +
    (emDashDensity > EM_DASH_PER_1K_SUSPICIOUS ? 1 : 0) +
    fmIssues.length +
    latexDupHits * 2;

  return {
    path: relative(REPO_ROOT, path),
    title: frontmatter?.title?.replace(/^['"]|['"]$/g, '') || '(untitled)',
    wordCount: wc,
    composite: +composite.toFixed(2),
    slopRate: +slopRate.toFixed(2),
    hedgeHits,
    transRate: +transRate.toFixed(2),
    transitionHits,
    emDashes,
    emDashDensity: +emDashDensity.toFixed(2),
    longParas,
    longestPara,
    stubHits,
    fmIssues,
    latexDupHits,
    latexDupBreakdown: {
      patternA: latexDup.patternA.map((f) => ({ mathLine: f.mathLine, dupLine: f.dupLine })),
      patternB: latexDup.patternB.map((f) => ({ firstLine: f.firstLine, secondLine: f.secondLine })),
    },
    breakdown: {
      hedges: hedgeBreakdown,
      transitions: transitionBreakdown,
      stubs: stubBreakdown,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function main() {
  console.log(`[lesson-audit] scanning ${relative(REPO_ROOT, DOCS_DIR)}/...`);
  const files = walkMdx(DOCS_DIR);
  console.log(`[lesson-audit] found ${files.length} .mdx/.md files`);

  const results = files.map((f) => {
    try {
      return auditFile(f);
    } catch (err) {
      return { path: relative(REPO_ROOT, f), error: String(err) };
    }
  });

  results.sort((a, b) => (b.composite || 0) - (a.composite || 0));

  const outDir = join(REPO_ROOT, 'scripts', 'lesson-audit');
  mkdirSync(outDir, { recursive: true });

  const summary = {
    runAt: new Date().toISOString(),
    fileCount: results.length,
    totalWords: results.reduce((s, r) => s + (r.wordCount || 0), 0),
    avgComposite:
      results.reduce((s, r) => s + (r.composite || 0), 0) / Math.max(1, results.length),
  };

  const out = { summary, results };
  writeFileSync(join(outDir, 'last-run.json'), JSON.stringify(out, null, 2));

  console.log(
    `[lesson-audit] wrote scripts/lesson-audit/last-run.json (${results.length} files, ${summary.totalWords} words)`
  );
}

main();
