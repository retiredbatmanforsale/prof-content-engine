# nanogpt-from-scratch

Companion project for Prof's course **Build and Train Your Own GPT-2**. By the end of Lesson 10, this directory will contain a working decoder-only transformer that you can train on TinyShakespeare in about 10 minutes on a Mac and watch generate Shakespeare-style text.

This scaffold is built up lesson by lesson. Each lesson adds one Python module. You don't need to copy and paste from the lesson — every file lands here.

## Setup

```bash
# from this directory
python -m venv .venv && source .venv/bin/activate
pip install -e .
```

Dependencies: `torch`, `tiktoken`, `numpy`. Tested on Python 3.10+.

## File growth — what each lesson contributes

| Lesson | File added or extended | What lands here |
|---|---|---|
| 1 | `config.py` | `GPTConfig` dataclass — vocab_size, n_embd, n_head, n_layer, block_size, dropout |
| 2 | `tokenizer.py`, `embeddings.py` | tiktoken wrapper, `TokenEmbedding` |
| 3 | `embeddings.py` (extended) | `PositionalEmbedding`, `Embeddings` wrapper |
| 4 | `attention.py` | `MultiHeadAttention` (no mask yet) |
| 5 | `attention.py` (extended) | causal mask added |
| 6 | `blocks.py` | `Block` with attention + residual |
| 7 | `blocks.py` (extended) | pre-LayerNorm |
| 8 | `blocks.py` (extended) | `MLP` (feed-forward) inside `Block` |
| 9 | `generate.py` | sampling loop with temperature, top-k, top-p |
| 10 | `model.py`, `train.py` | full `GPT` class + training loop |

## Run it (after Lesson 10)

```bash
python train.py        # trains on TinyShakespeare, ~10 min on Mac
python generate.py     # samples from the trained checkpoint
```

The training loop prints loss every 100 steps and a 200-token sample every 500 steps so you can watch the model learn.

## License

MIT. Pedagogical companion to Prof's [Build and Train Your Own GPT-2](https://prof.lexailabs.com/) course. Inspired by [Karpathy's nanoGPT](https://github.com/karpathy/nanoGPT).
