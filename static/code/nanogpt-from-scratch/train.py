"""Train a small GPT on TinyShakespeare.

Lesson 10. Run with `python train.py`. Auto-downloads TinyShakespeare to data/
if it isn't there. After ~10 minutes on a Mac (CPU or MPS), the model produces
recognisable Shakespeare-style output.
"""

from __future__ import annotations

import math
import os
import time
import urllib.request

import torch

from config import GPTConfig
from generate import generate
from model import GPT
from tokenizer import decode, encode

# ---- 1. Hyperparameters (small enough for laptop training) ----
config = GPTConfig(
    vocab_size=50257,
    n_embd=192,           # GPT-2 small uses 768; we shrink so it fits in 10 min on Mac.
    n_head=6,
    n_layer=6,
    block_size=128,
    dropout=0.0,
)

batch_size = 32
max_iters = 3000
eval_interval = 500
eval_iters = 50
warmup_iters = 100
lr_max = 3e-4
lr_min = 3e-5
weight_decay = 0.1
beta1, beta2 = 0.9, 0.95
grad_clip = 1.0

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
torch.manual_seed(1337)


# ---- 2. Data: download + tokenize TinyShakespeare ----
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "tinyshakespeare.txt")
if not os.path.exists(DATA_PATH):
    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    url = "https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt"
    urllib.request.urlretrieve(url, DATA_PATH)

with open(DATA_PATH) as f:
    text = f.read()

ids = encode(text)
data = torch.tensor(ids, dtype=torch.long)
n = int(0.9 * len(data))
train_data, val_data = data[:n], data[n:]
print(f"data: {len(data):,} tokens   train: {len(train_data):,}   val: {len(val_data):,}")


def get_batch(split: str):
    src = train_data if split == "train" else val_data
    ix = torch.randint(len(src) - config.block_size - 1, (batch_size,))
    x = torch.stack([src[i : i + config.block_size] for i in ix])
    y = torch.stack([src[i + 1 : i + 1 + config.block_size] for i in ix])
    return x.to(device), y.to(device)


# ---- 3. Model + optimizer ----
model = GPT(config).to(device)
print(f"model: {sum(p.numel() for p in model.parameters()):,} params")

optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=lr_max,
    betas=(beta1, beta2),
    weight_decay=weight_decay,
)


def lr_at(step: int) -> float:
    """Linear warmup, then cosine decay to lr_min."""
    if step < warmup_iters:
        return lr_max * step / warmup_iters
    if step >= max_iters:
        return lr_min
    progress = (step - warmup_iters) / (max_iters - warmup_iters)
    return lr_min + 0.5 * (lr_max - lr_min) * (1.0 + math.cos(math.pi * progress))


@torch.no_grad()
def estimate_loss():
    model.eval()
    out = {}
    for split in ("train", "val"):
        losses = torch.zeros(eval_iters)
        for i in range(eval_iters):
            x, y = get_batch(split)
            _, loss = model(x, y)
            losses[i] = loss.item()
        out[split] = losses.mean().item()
    model.train()
    return out


# ---- 4. Train loop ----
t0 = time.time()
for step in range(max_iters + 1):
    lr = lr_at(step)
    for g in optimizer.param_groups:
        g["lr"] = lr

    if step % eval_interval == 0:
        losses = estimate_loss()
        elapsed = time.time() - t0
        print(f"step {step:5d}  train {losses['train']:.4f}  val {losses['val']:.4f}  "
              f"lr {lr:.2e}  elapsed {elapsed:5.1f}s")

        # Sample 200 tokens from the current model.
        prompt = torch.tensor(encode("ROMEO:"), dtype=torch.long, device=device)[None, :]
        completion = generate(model, prompt, max_new_tokens=200, temperature=0.8, top_k=40)
        print("---")
        print(decode(completion[0].tolist()))
        print("---")

    x, y = get_batch("train")
    _, loss = model(x, y)
    optimizer.zero_grad(set_to_none=True)
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), grad_clip)
    optimizer.step()


# ---- 5. Save the trained model ----
torch.save(model.state_dict(), "checkpoint.pt")
print(f"saved checkpoint.pt  total time: {time.time() - t0:.1f}s")
