"""Full GPT model assembly.

Lesson 10. Stacks n_layer Blocks, ties the output projection to the token
embedding (the trick saves ~38M params), and exposes a forward(idx, targets)
that returns logits + optional cross-entropy loss.
"""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F

from blocks import Block
from config import GPTConfig
from embeddings import Embeddings


class GPT(nn.Module):
    """Decoder-only transformer (GPT-2 small by default)."""

    def __init__(self, config: GPTConfig):
        super().__init__()
        self.config = config

        self.embed = Embeddings(config)                       # tok + pos
        self.drop = nn.Dropout(config.dropout)
        self.blocks = nn.ModuleList([Block(config) for _ in range(config.n_layer)])
        self.ln_f = nn.LayerNorm(config.n_embd)
        # Output projection (logits over vocab). bias=False; weights TIED below.
        self.lm_head = nn.Linear(config.n_embd, config.vocab_size, bias=False)

        # Weight tying: the unembedding shares its matrix with the token embedding.
        # nn.Linear stores its weight as (out, in) = (vocab_size, n_embd), which is
        # exactly the shape of nn.Embedding(vocab_size, n_embd).weight.
        # `self.embed.tok.weight` is the nn.Embedding module; `.weight` again is the tensor.
        self.lm_head.weight = self.embed.tok.weight.weight

        self.apply(self._init_weights)
        # Special init for the residual-output projections: scale by 1/sqrt(2*n_layer)
        # so the residual stream's variance doesn't grow with depth (GPT-2 trick).
        for name, p in self.named_parameters():
            if name.endswith("attn.proj.weight") or name.endswith("mlp.proj.weight"):
                torch.nn.init.normal_(p, mean=0.0, std=0.02 / (2 * config.n_layer) ** 0.5)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def num_params(self, non_embedding: bool = True) -> int:
        n = sum(p.numel() for p in self.parameters())
        if non_embedding:
            n -= self.embed.pos.weight.weight.numel()
        return n

    def forward(self, idx: torch.Tensor, targets: torch.Tensor | None = None):
        """idx: (B, T) token ids. Returns (logits, loss)."""
        B, T = idx.shape
        assert T <= self.config.block_size, f"sequence length {T} > block_size {self.config.block_size}"

        x = self.drop(self.embed(idx))                  # (B, T, n_embd)
        for block in self.blocks:
            x = block(x)
        x = self.ln_f(x)
        logits = self.lm_head(x)                        # (B, T, vocab_size)

        loss = None
        if targets is not None:
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)),
                targets.view(-1),
                ignore_index=-1,
            )
        return logits, loss
