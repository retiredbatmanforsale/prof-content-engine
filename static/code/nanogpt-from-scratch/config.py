"""GPT-2 model configuration.

Filled in Lesson 1. Every other module reads dimensions from a single
GPTConfig instance, so changing model size is a one-line edit.

Defaults match the GPT-2 small architecture (124M parameters).
"""

from dataclasses import dataclass


@dataclass
class GPTConfig:
    vocab_size: int = 50257   # GPT-2 BPE vocabulary
    n_embd: int = 768         # embedding / hidden dimension
    n_head: int = 12          # number of attention heads
    n_layer: int = 12         # number of transformer blocks
    block_size: int = 1024    # maximum context length
    dropout: float = 0.0      # 0.0 for pretraining, ~0.1 for finetuning

    @property
    def head_size(self) -> int:
        assert self.n_embd % self.n_head == 0, "n_embd must divide n_head"
        return self.n_embd // self.n_head
