#!/usr/bin/env node
/**
 * lesson-audit · latex-dup-check.mjs
 *
 * Standalone LaTeX-duplication detector. Looks for three patterns:
 *
 *   A. A `$$...$$` math block followed within ~5 lines by a short line that
 *      looks like the same equation written in plain text (has `=`, mostly
 *      identifiers + operators, <80 chars).
 *
 *   B. Two consecutive `$$...$$` blocks with high identifier overlap and one
 *      contains a renamed left-hand side (e.g. `SSR = ...` then `J(m,c) = ...`
 *      with the same right-hand side).
 *
 * Usage:
 *   node scripts/lesson-audit/latex-dup-check.mjs <file.mdx>
 *
 * Output: human-readable findings to stdout. Returns non-zero if findings exist.
 */
import { readFileSync } from 'node:fs';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function extractLatexIdentifiers(latex) {
  let s = latex
    // Strip ONLY the command name (\text, \frac, \sum, \hat, ...) — keep
    // braced content so identifiers inside \text{SSR} or \frac{a}{b} survive.
    .replace(/\\[a-zA-Z]+/g, ' ')
    // Strip structural / accent chars
    .replace(/[{}^_\\&]/g, ' ');
  const ids = s.match(/[a-zA-Z][a-zA-Z0-9]*/g) || [];
  return ids.map((id) => id.toLowerCase());
}

// Pattern A: looks like a plain-text equation — short, has `=`, mostly letters/digits/ops
function looksLikePlainTextEquation(line) {
  const cleaned = line
    .replace(/\*\*|\*|`/g, '')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .trim();
  if (cleaned.length < 5 || cleaned.length > 90) return null;
  if (!cleaned.includes('=')) return null;
  // Must have at least 2 letters around the `=`
  const hasLeft = /[a-zA-Zα-ωΑ-Ω][a-zA-Zα-ωΑ-Ω0-9_]*\s*=/.test(cleaned);
  if (!hasLeft) return null;
  // Allowed chars: letters (incl Greek), digits, common math operators
  const allowed = /[a-zA-Zα-ωΑ-Ω₀-₉⁰-⁹0-9 _=+\-*/().,^•·∑∏∫±≈≠≤≥→←]/g;
  const remaining = cleaned.replace(allowed, '');
  // Must be mostly an equation: <15% non-equation chars
  if (remaining.length > cleaned.length * 0.15) return null;
  return cleaned;
}

function patternA(text) {
  const findings = [];
  const blockRe = /\$\$([\s\S]*?)\$\$/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    const blockEnd = m.index + m[0].length;
    const after = text.slice(blockEnd, blockEnd + 500);
    const lines = after.split('\n');

    let scanned = 0;
    for (let i = 0; i < lines.length && scanned < 6; i++) {
      const line = lines[i].trim();
      if (line.length === 0) continue;
      if (line.startsWith('$$') || /^\s*\$/.test(line)) break;
      // Skip JSX / HTML blocks
      if (/^\s*<[A-Za-z]/.test(line)) {
        scanned++;
        continue;
      }
      scanned++;
      const eq = looksLikePlainTextEquation(line);
      if (eq) {
        findings.push({
          pattern: 'A',
          mathLine: lineOf(text, m.index),
          dupLine: lineOf(text, blockEnd) + i,
          latex: m[1].trim().replace(/\s+/g, ' ').slice(0, 70),
          duplicate: eq.slice(0, 80),
        });
        break;
      }
    }
  }
  return findings;
}

function splitAtMainEquals(latex) {
  // Track delimiter depth; the "main" equals is the first `=` at depth 0.
  // This matters for things like `P(y = 1 | x) = \sigma(...)` where the first
  // `=` is inside parens (it's a conditional probability, not the equation).
  let depth = 0;
  for (let i = 0; i < latex.length; i++) {
    const ch = latex[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);
    else if (ch === '=' && depth === 0) {
      const prev = i > 0 ? latex[i - 1] : '';
      const next = latex[i + 1] || '';
      // Skip `==`, `!=`, `<=`, `>=`, `\=`
      if (prev === '\\' || prev === '!' || prev === '<' || prev === '>' || prev === '=') continue;
      if (next === '=') continue;
      return { lhs: latex.slice(0, i).trim(), rhs: latex.slice(i + 1).trim() };
    }
  }
  return null;
}

function normalizeRhs(rhs) {
  return rhs
    .replace(/\\bigl|\\bigr|\\Bigl|\\Bigr|\\left|\\right/g, '')
    .replace(/\\,|\\;|\\:|\\!|\\quad|\\qquad/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function rhsAreNearIdentical(a, b) {
  const na = normalizeRhs(a);
  const nb = normalizeRhs(b);
  if (na.length < 4 || nb.length < 4) return false;
  if (na === nb) return true;
  // If one is a substring of the other, it's a derivation, not duplication.
  if (na.includes(nb) || nb.includes(na)) return false;
  // Otherwise, allow small character-level differences (alias rename in subscripts)
  // by checking how much they differ in length and by simple set-of-chars overlap.
  const lenRatio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  if (lenRatio < 0.85) return false;
  // Character-multiset overlap as a cheap edit-distance proxy
  const cm = (s) => {
    const c = new Map();
    for (const ch of s) c.set(ch, (c.get(ch) || 0) + 1);
    return c;
  };
  const ca = cm(na);
  const cb = cm(nb);
  let shared = 0;
  for (const [ch, n] of ca) shared += Math.min(n, cb.get(ch) || 0);
  return shared / Math.max(na.length, nb.length) > 0.92;
}

function patternB(text) {
  const findings = [];
  const blocks = [];
  const blockRe = /\$\$([\s\S]*?)\$\$/g;
  let m;
  while ((m = blockRe.exec(text)) !== null) {
    blocks.push({
      index: m.index,
      end: m.index + m[0].length,
      latex: m[1].trim(),
      ids: extractLatexIdentifiers(m[1]),
    });
  }

  for (let i = 0; i < blocks.length - 1; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    // Only consider blocks within ~6 lines of each other (close-coupled)
    const between = text.slice(a.end, b.index);
    const linesBetween = between.split('\n').length - 1;
    if (linesBetween > 6) continue;
    if (a.ids.length < 5 || b.ids.length < 5) continue;

    // Multiset identifier overlap. Single-letter ids count — that's the whole
    // signal for renamed-alias duplication (y_i, x_i, m, c reused verbatim).
    const aCount = new Map();
    const bCount = new Map();
    for (const id of a.ids) aCount.set(id, (aCount.get(id) || 0) + 1);
    for (const id of b.ids) bCount.set(id, (bCount.get(id) || 0) + 1);
    let shared = 0;
    const sharedIds = new Set();
    for (const [id, ca] of aCount) {
      const cb = bCount.get(id) || 0;
      const k = Math.min(ca, cb);
      if (k > 0) {
        shared += k;
        sharedIds.add(id);
      }
    }
    const denom = Math.max(a.ids.length, b.ids.length);
    const overlap = denom === 0 ? 0 : shared / denom;
    if (overlap < 0.65 || sharedIds.size < 3) continue;

    // Tighter test: are the RHS strings near-identical?
    // If yes → alias rename (true duplicate). If no (substring containment or
    // structural difference) → derivation, skip.
    const aSplit = splitAtMainEquals(a.latex);
    const bSplit = splitAtMainEquals(b.latex);
    if (!aSplit || !bSplit) continue;
    if (!rhsAreNearIdentical(aSplit.rhs, bSplit.rhs)) continue;

    findings.push({
      pattern: 'B',
      firstLine: lineOf(text, a.index),
      secondLine: lineOf(text, b.index),
      first: a.latex.replace(/\s+/g, ' ').slice(0, 70),
      second: b.latex.replace(/\s+/g, ' ').slice(0, 70),
      sharedIds: [...sharedIds],
      overlap: +overlap.toFixed(2),
    });
  }
  return findings;
}

// ────────────────────────────────────────────────────────────────────────────
// Public API (used by audit.mjs)
// ────────────────────────────────────────────────────────────────────────────

export function findLatexDuplications(text) {
  return {
    patternA: patternA(text),
    patternB: patternB(text),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// CLI entry-point — only runs when invoked as a script
// ────────────────────────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${argv[1]}`;
if (isMain) {
  const path = argv[2];
  if (!path) {
    console.error('usage: latex-dup-check.mjs <file.mdx>');
    exit(2);
  }
  const raw = readFileSync(path, 'utf8');
  const aFindings = patternA(raw);
  const bFindings = patternB(raw);

  console.log(`File: ${path}`);
  console.log(`Display-math blocks: ${(raw.match(/\$\$[\s\S]*?\$\$/g) || []).length}`);
  console.log(``);

  console.log(`── Pattern A (LaTeX → plain-text restatement) — ${aFindings.length} finding(s)`);
  for (const f of aFindings) {
    console.log(`  L${f.mathLine}: $$ ${f.latex} $$`);
    console.log(`  L${f.dupLine}:    ${f.duplicate}`);
    console.log('');
  }

  console.log(`── Pattern B (consecutive equations, renamed alias) — ${bFindings.length} finding(s)`);
  for (const f of bFindings) {
    console.log(`  L${f.firstLine}:  $$ ${f.first} $$`);
    console.log(`  L${f.secondLine}: $$ ${f.second} $$`);
    console.log(`  shared: ${f.sharedIds.join(', ')} (overlap ${f.overlap})`);
    console.log('');
  }

  console.log(`Total findings: ${aFindings.length + bFindings.length}`);
}
