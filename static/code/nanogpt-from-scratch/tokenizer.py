"""GPT-2's byte-level BPE tokenizer, via tiktoken.

GPT-2 uses byte-level BPE with a 50,257-token vocabulary (Radford et al., 2019).
We don't reimplement BPE — we call OpenAI's tiktoken library, which ships the
exact same vocabulary and merges as the original GPT-2.

Lesson 2 — Build and Train Your Own GPT-2.
"""

import tiktoken

_enc = tiktoken.get_encoding("gpt2")


def encode(text: str) -> list[int]:
    """Map a string to a list of token ids in [0, 50257)."""
    return _enc.encode(text)


def decode(ids: list[int]) -> str:
    """Map token ids back to a string. Inverse of encode (modulo BPE merge ties)."""
    return _enc.decode(ids)


def vocab_size() -> int:
    """50257 — the size of GPT-2's vocabulary."""
    return _enc.n_vocab
