"""Token + positional embeddings.

Lesson 2 added TokenEmbedding.
Lesson 3 adds PositionalEmbedding and the Embeddings wrapper that combines them.
"""

import torch
import torch.nn as nn

from config import GPTConfig


class TokenEmbedding(nn.Module):
    """Map token ids -> dense vectors. (B, T) -> (B, T, n_embd)."""

    def __init__(self, config: GPTConfig):
        super().__init__()
        self.weight = nn.Embedding(config.vocab_size, config.n_embd)

    def forward(self, idx: torch.Tensor) -> torch.Tensor:
        # idx: (B, T) int64 token ids
        # returns: (B, T, n_embd) float32
        return self.weight(idx)


class PositionalEmbedding(nn.Module):
    """Map a position index in [0, block_size) to a dense vector.

    GPT-2 uses learned positional embeddings (not sinusoidal). Same dimension
    as the token embeddings so the two can be summed element-wise.
    """

    def __init__(self, config: GPTConfig):
        super().__init__()
        self.weight = nn.Embedding(config.block_size, config.n_embd)

    def forward(self, T: int, device: torch.device) -> torch.Tensor:
        # returns: (T, n_embd) — broadcasts across the batch dim when added
        pos = torch.arange(T, dtype=torch.long, device=device)
        return self.weight(pos)


class Embeddings(nn.Module):
    """Sum token + positional embeddings. (B, T) -> (B, T, n_embd)."""

    def __init__(self, config: GPTConfig):
        super().__init__()
        self.tok = TokenEmbedding(config)
        self.pos = PositionalEmbedding(config)

    def forward(self, idx: torch.Tensor) -> torch.Tensor:
        B, T = idx.shape
        tok = self.tok(idx)                   # (B, T, n_embd)
        pos = self.pos(T, idx.device)         # (T, n_embd) -> broadcasts
        return tok + pos
