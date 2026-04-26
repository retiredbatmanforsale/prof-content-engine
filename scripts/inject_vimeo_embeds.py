#!/usr/bin/env python3
"""
inject_vimeo_embeds.py

Injects Vimeo iframe embed blocks into MDX lesson files, right after the
<LessonHero .../> tag. Skips files that already have a Vimeo embed.
Dry-run by default — pass --write to actually apply changes.

Usage:
    python3 scripts/inject_vimeo_embeds.py          # dry run (shows diffs)
    python3 scripts/inject_vimeo_embeds.py --write  # apply changes
"""

import os
import sys
import re

DOCS = os.path.join(os.path.dirname(__file__), "..", "docs")

def embed(video_id, h_hash, title):
    src_params = "badge=0&autopause=0&player_id=0&app_id=58479"
    if h_hash:
        src_params = f"h={h_hash}&{src_params}"
    src = f"https://player.vimeo.com/video/{video_id}?{src_params}"
    safe_title = title.replace('"', "&quot;")
    return (
        '\n<div className="not-prose my-6" style={{padding:\'54.37% 0 0 0\',position:\'relative\'}}>\n'
        "  <iframe\n"
        f'    src="{src}"\n'
        '    frameBorder="0"\n'
        '    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"\n'
        '    referrerPolicy="strict-origin-when-cross-origin"\n'
        "    style={{position:'absolute',top:0,left:0,width:'100%',height:'100%'}}\n"
        f'    title="{safe_title}"\n'
        "  />\n"
        "</div>"
    )

# ── MAPPING: MDX path (relative to docs/) → (video_id, h_hash, title) ────────
MAPPING = {
    # GenAI for Everyone
    "ai-for-leaders/genai-for-everyone/five-layer-ai-stack.mdx": (
        "1184731773", None, "AI as a Five-Layer Stack — Jensen Huang's Framework",
    ),
    "ai-for-leaders/genai-for-everyone/ai-model-lifecycle-for-leaders.mdx": (
        "1184733402", None, "AI Model Lifecycle for Leaders",
    ),
    "ai-for-leaders/genai-for-everyone/llm-design-case-study.mdx": (
        "1184732362", None, "Design of an LLM — Case Study",
    ),

    # Deep Neural Networks
    "ai-for-engineering/deep-neural-networks/perceptron-and-neuron.mdx": (
        "1184748073", None, "Perceptron and Sigmoid",
    ),
    "ai-for-engineering/deep-neural-networks/layers-in-deep-neural-networks.mdx": (
        "1184750649", None, "Why Linear Models Are Not Enough",
    ),

    # Build and Train Your Own GPT-2
    "ai-for-engineering/build-and-train-your-own-gpt2-model/01-problem-with-rnns-lstms.mdx": (
        "1184752541", None, "The Problem with RNNs",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/02-token-embeddings.mdx": (
        "1184754254", None, "Token Embeddings",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/03-positional-embeddings.mdx": (
        "1184755506", None, "Positional Embeddings",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/04-attention-multi-head-attention.mdx": (
        "1184758543", None, "Self-Attention and Multi-Head Attention",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/05-causal-masking.mdx": (
        "1184761004", None, "Causal Masking",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/08-feed-forward-neural-networks.mdx": (
        "1185126730", None, "Why Attention Can't Think — Feed-Forward Networks",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/10-decoder-only-transformer.mdx": (
        "1185171412", None, "Decoder-Only Transformer",
    ),
    "ai-for-engineering/build-and-train-your-own-gpt2-model/intro.mdx": (
        "1185128763", None, "GPT-2: The Model That Was Too Dangerous to Release",
    ),

    # Attention Is All You Need
    "ai-for-engineering/attention-is-all-you-need/intro.mdx": (
        "1185168916", None, "Breakdown: Attention Is All You Need",
    ),
    "ai-for-engineering/attention-is-all-you-need/problem-with-rnns-and-lstms.mdx": (
        "1184752541", None, "The Problem with RNNs",
    ),
    "ai-for-engineering/attention-is-all-you-need/token-embeddings.mdx": (
        "1185114975", None, "What Transformers Actually See — Tokens vs Embeddings",
    ),
    "ai-for-engineering/attention-is-all-you-need/positional-embeddings.mdx": (
        "1184755506", None, "Positional Embeddings",
    ),
    "ai-for-engineering/attention-is-all-you-need/multi-headed-attention.mdx": (
        "1185115731", None, "How Attention Sees Language — Multi-Head Intuition",
    ),
    "ai-for-engineering/attention-is-all-you-need/causal-masking.mdx": (
        "1184761004", None, "Causal Masking",
    ),
    "ai-for-engineering/attention-is-all-you-need/feed-forward-neural-networks.mdx": (
        "1185126730", None, "Why Attention Can't Think — Feed-Forward Networks",
    ),

    # Foundations of Regression
    "ai-for-engineering/foundations-of-regression/linear-regression-line-ssr-gradient-descent.mdx": (
        "1185112277", None, "The Simple Math That Rules Every AI — Linear Regression",
    ),
    "ai-for-engineering/foundations-of-regression/intuition-behind-logistic-regression.mdx": (
        "1185113960", None, "The First Real Classification Algorithm",
    ),
}

LESSON_HERO_RE = re.compile(r'(<LessonHero\b[^/]*/?>)', re.DOTALL)
VIMEO_RE = re.compile(r'player\.vimeo\.com')


def process(rel_path, video_id, h_hash, title, write_mode):
    abs_path = os.path.join(DOCS, rel_path)
    if not os.path.exists(abs_path):
        print(f"  MISSING  {rel_path}")
        return

    with open(abs_path) as f:
        content = f.read()

    if VIMEO_RE.search(content):
        print(f"  SKIP     {rel_path}  (already has embed)")
        return

    match = LESSON_HERO_RE.search(content)
    if not match:
        print(f"  NO HERO  {rel_path}  (no <LessonHero> found — skipping)")
        return

    insert_after = match.end()
    embed_block = embed(video_id, h_hash, title)
    new_content = content[:insert_after] + "\n" + embed_block + "\n" + content[insert_after:]

    if write_mode:
        with open(abs_path, "w") as f:
            f.write(new_content)
        print(f"  WRITTEN  {rel_path}")
    else:
        print(f"  DRY-RUN  {rel_path}  → would inject video {video_id}")


def main():
    write_mode = "--write" in sys.argv
    if not write_mode:
        print("DRY RUN — pass --write to apply changes\n")
    else:
        print("WRITE MODE\n")

    for rel_path, (video_id, h_hash, title) in MAPPING.items():
        process(rel_path, video_id, h_hash, title, write_mode)

    print(f"\nDone. {len(MAPPING)} files in mapping.")
    if not write_mode:
        print("Re-run with --write to apply.")


if __name__ == "__main__":
    main()
