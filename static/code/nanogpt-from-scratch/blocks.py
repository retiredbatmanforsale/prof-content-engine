"""Transformer block: pre-LN, attention, residual, MLP.

Lesson 6 added the residual.
Lesson 7 added pre-LayerNorm.
Lesson 8 adds the feed-forward MLP and a second pre-LN + residual.

This is the full GPT-2 block. Lesson 10 stacks n_layer of these.
"""

import torch
import torch.nn as nn

from attention import MultiHeadAttention
from config import GPTConfig


class MLP(nn.Module):
    """Position-wise feed-forward: Linear(C, 4C) -> GELU -> Linear(4C, C) -> Dropout."""

    def __init__(self, config: GPTConfig):
        super().__init__()
        self.fc = nn.Linear(config.n_embd, 4 * config.n_embd, bias=False)
        self.act = nn.GELU(approximate="tanh")
        self.proj = nn.Linear(4 * config.n_embd, config.n_embd, bias=False)
        self.dropout = nn.Dropout(config.dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.dropout(self.proj(self.act(self.fc(x))))


class Block(nn.Module):
    """One full GPT-2 transformer block. (B, T, n_embd) -> (B, T, n_embd).

    Pre-LN ordering:
        x = x + attn(LN(x))
        x = x + mlp(LN(x))
    """

    def __init__(self, config: GPTConfig):
        super().__init__()
        self.ln1 = nn.LayerNorm(config.n_embd)
        self.attn = MultiHeadAttention(config)
        self.ln2 = nn.LayerNorm(config.n_embd)
        self.mlp = MLP(config)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.ln1(x))
        x = x + self.mlp(self.ln2(x))
        return x
