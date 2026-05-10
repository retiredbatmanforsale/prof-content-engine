"""Autoregressive sampling: greedy, temperature, top-k, top-p (nucleus).

Lesson 9. Used by Lesson 10's training loop and by anyone who wants to sample
from a trained checkpoint.
"""

from __future__ import annotations

import torch
import torch.nn.functional as F


@torch.no_grad()
def generate(
    model,
    idx: torch.Tensor,
    max_new_tokens: int,
    temperature: float = 1.0,
    top_k: int | None = None,
    top_p: float | None = None,
) -> torch.Tensor:
    """Append max_new_tokens autoregressively to idx.

    idx: (B, T) int64 token ids — the context.
    Returns:  (B, T + max_new_tokens) — context + sampled completions.
    """
    model.eval()
    block_size = model.config.block_size

    for _ in range(max_new_tokens):
        # Crop the context to the model's max length.
        idx_cond = idx if idx.size(1) <= block_size else idx[:, -block_size:]

        # Forward: logits has shape (B, T, vocab_size).
        logits, _ = model(idx_cond)

        # Take the last position's logits and apply temperature.
        logits = logits[:, -1, :] / max(temperature, 1e-8)        # (B, vocab_size)

        # Optional top-k truncation.
        if top_k is not None:
            v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
            logits[logits < v[:, [-1]]] = float("-inf")

        # Optional top-p (nucleus) truncation.
        if top_p is not None:
            sorted_logits, sorted_idx = torch.sort(logits, descending=True)
            sorted_probs = F.softmax(sorted_logits, dim=-1)
            cum_probs = torch.cumsum(sorted_probs, dim=-1)
            # Mask out tokens once the cumulative probability exceeds top_p.
            mask = cum_probs > top_p
            # Always keep at least one token.
            mask[..., 0] = False
            sorted_logits[mask] = float("-inf")
            # Scatter back to the original order.
            logits = torch.empty_like(logits).scatter_(-1, sorted_idx, sorted_logits)

        # Sample.
        probs = F.softmax(logits, dim=-1)
        next_id = torch.multinomial(probs, num_samples=1)          # (B, 1)

        idx = torch.cat([idx, next_id], dim=1)

    return idx
