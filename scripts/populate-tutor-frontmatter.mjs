/**
 * Reads every lesson MDX file and injects tutor_topic + tutor_concepts into
 * the YAML frontmatter, using Claude to derive concepts from lesson content.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/populate-tutor-frontmatter.mjs
 *
 * Safe to re-run: skips files that already have tutor_topic.
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = join(__dirname, '..', 'docs');

// These are course index pages — no lesson content to tutor.
const SKIP_BASENAMES = new Set(['intro.mdx']);

const client = new Anthropic();

function walkMdx(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walkMdx(full));
    } else if (extname(entry) === '.mdx') {
      results.push(full);
    }
  }
  return results;
}

function extractFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

function hasTutorConfig(raw) {
  const fm = extractFrontmatter(raw);
  return fm ? fm.includes('tutor_topic:') : false;
}

function extractTitle(raw) {
  const match = raw.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
  if (!match) return null;
  // Strip "Lesson N — " prefix
  return match[1].replace(/^Lesson\s+\d+\s*[—–\-]\s*/i, '').trim();
}

function stripMdxForPrompt(content) {
  return content
    .replace(/import\s+.+/g, '')
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '')
    .replace(/<[A-Z][^>]*(\/)?>/g, '')
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/\$\$[\s\S]*?\$\$/g, '[math]')
    .replace(/\$[^$]+\$/g, '[math]')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function injectFrontmatterKeys(raw, topic, concepts) {
  const conceptsYaml = concepts.map(c => `  - "${c.replace(/"/g, '\\"')}"`).join('\n');
  const newKeys = `tutor_topic: "${topic.replace(/"/g, '\\"')}"\ntutor_concepts:\n${conceptsYaml}`;
  // Insert before the closing --- of the frontmatter block
  return raw.replace(/^(---\n[\s\S]*?)\n---/, `$1\n${newKeys}\n---`);
}

async function generateConcepts(title, content) {
  const strippedContent = stripMdxForPrompt(content);
  if (strippedContent.length < 150) return null;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are configuring a Socratic AI tutor for a lesson titled "${title}".

Return ONLY a JSON object — no markdown, no explanation — with:
- "concepts": array of 4-6 short, specific, testable things a student must understand from this lesson. Each concept should be a noun phrase (5 words max), precise enough to drive a Socratic question.

Lesson content (excerpt):
${strippedContent.slice(0, 3000)}`
    }]
  });

  const text = response.content[0].text.trim();
  const parsed = JSON.parse(text);
  return parsed.concepts;
}

async function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');

  if (SKIP_BASENAMES.has(basename(filePath))) {
    console.log(`  skip (index page):  ${filePath.replace(DOCS_DIR, '')}`);
    return;
  }

  if (hasTutorConfig(raw)) {
    console.log(`  skip (already set): ${filePath.replace(DOCS_DIR, '')}`);
    return;
  }

  const title = extractTitle(raw);
  if (!title) {
    console.log(`  skip (no title):    ${filePath.replace(DOCS_DIR, '')}`);
    return;
  }

  // Strip frontmatter to get just the body
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');

  console.log(`  processing:         ${filePath.replace(DOCS_DIR, '')}`);
  try {
    const concepts = await generateConcepts(title, body);
    if (!concepts || concepts.length === 0) {
      console.log(`    → skipped (too short or no concepts returned)`);
      return;
    }

    const updated = injectFrontmatterKeys(raw, title, concepts);
    writeFileSync(filePath, updated, 'utf8');
    console.log(`    → "${title}" — ${concepts.length} concepts`);
  } catch (err) {
    console.error(`    → ERROR: ${err.message}`);
  }
}

const files = walkMdx(DOCS_DIR);
console.log(`Found ${files.length} MDX files in ${DOCS_DIR}\n`);

for (const file of files) {
  await processFile(file);
  await new Promise(r => setTimeout(r, 400));
}

console.log('\nDone.');
