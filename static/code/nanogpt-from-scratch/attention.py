"""Multi-head causal self-attention.

Lesson 4 added MultiHeadAttention.
Lesson 5 adds the causal mask so position t cannot attend to t+1, t+2, ....
"""

import math

import torch
import torch.nn as nn
import torch.nn.functional as F

from config import GPTConfig


class MultiHeadAttention(nn.Module):
    """Multi-head causal self-attention. (B, T, n_embd) -> (B, T, n_embd)."""

    def __init__(self, config: GPTConfig):
        super().__init__()
        assert config.n_embd % config.n_head == 0, "n_embd must divide n_head"
        self.n_head = config.n_head
        self.n_embd = config.n_embd
        self.head_size = config.head_size

        self.qkv = nn.Linear(config.n_embd, 3 * config.n_embd, bias=False)
        self.proj = nn.Linear(config.n_embd, config.n_embd, bias=False)

        self.attn_dropout = nn.Dropout(config.dropout)
        self.resid_dropout = nn.Dropout(config.dropout)

        # Causal mask: lower-triangular (block_size, block_size). Shape it for
        # broadcasting against the (B, H, T, T) attention scores. Registered as
        # a buffer so it moves with .to(device) but is not a learned parameter.
        mask = torch.tril(torch.ones(config.block_size, config.block_size))
        self.register_buffer("mask", mask.view(1, 1, config.block_size, config.block_size))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        B, T, C = x.shape
        H = self.n_head
        D = self.head_size

        q, k, v = self.qkv(x).split(self.n_embd, dim=-1)

        q = q.view(B, T, H, D).transpose(1, 2)
        k = k.view(B, T, H, D).transpose(1, 2)
        v = v.view(B, T, H, D).transpose(1, 2)

        # (B, H, T, T) attention scores.
        att = (q @ k.transpose(-2, -1)) / math.sqrt(D)

        # Causal mask: zero out the upper triangle by setting it to -inf, so
        # softmax sends those positions to 0. Slice to the actual T (which can
        # be < block_size at inference).
        att = att.masked_fill(self.mask[:, :, :T, :T] == 0, float("-inf"))

        att = F.softmax(att, dim=-1)
        att = self.attn_dropout(att)

        y = att @ v
        y = y.transpose(1, 2).contiguous().view(B, T, C)

        return self.resid_dropout(self.proj(y))
