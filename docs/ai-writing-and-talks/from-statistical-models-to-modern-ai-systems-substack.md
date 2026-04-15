<!--
  SUBSTACK EXPORT — companion to from-statistical-models-to-modern-ai-systems.mdx
  ================================================================================
  How to use this file
  --------------------
  • Substack does not run MDX/React. This version strips JSX and uses Markdown +
    a little HTML where helpful (images, optional subscribe link).
  • **Images:** Every image uses an absolute https:// URL — use Substack’s image
    button / paste URL, or paste the HTML <figure> blocks below.
  • **Tables:** Substack’s editor accepts Markdown tables in many cases. If a
    table breaks on paste, rebuild it with Substack’s table control or paste the
    pipe table into a Markdown-capable compose mode.
  • **Equations:** Substack uses **More → LaTeX** (LaTeX blocks), not `$$` from
    GitHub-style Markdown. Each block below is wrapped in `$$ … $$` so you can
    copy the *inner* LaTeX only into a Substack LaTeX block. (See Substack Help:
    “How do I add equations to my Substack post?”) Long or finicky lines can be
    screenshot via KaTeX / LaTeXiT as a fallback.
-->

# From Statistical Models to Modern AI Systems

**Talk** · *Statistical models → modern AI*

**Deep learning** grew into a **trillion-dollar industry**: once deep neural networks hit the mainstream, **Nvidia**, **Google**, and the broader silicon-to-cloud stack repriced in a **Big Bang** moment for markets and infrastructure—and that is the backdrop for what engineers build next.

**Puru Kathuria**

---

## Puru Kathuria

### Bio · at a glance

- **CS, ML, DL** — **IIIT Delhi**
- **AI research** — **KraCr LAB** and **DCB Lab**
- **MathWorks** — intern → SWE → **DL**
- **Google** (2020) — **Cloud Security**; **Distributed Systems** + **Modern AI**
- **Lex AI** — Having fun with **AI** and **Education**

### Newsletter & site

**[purukathuria.com →](https://www.purukathuria.com/)**

Subscribe on Substack: [purukathuria.com](https://www.purukathuria.com/) (use your site’s subscribe flow or embed from the Substack dashboard).

<figure>
  <img src="https://media.licdn.com/dms/image/v2/D4D03AQGQtno9QlQ5ug/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1715758859402?e=1777507200&v=beta&t=IgKjumaawDhJlXJaGpVRUbVlsHTcEFrKspyTWJJxqms" alt="Puru Kathuria" width="800" />
  <figcaption><em>Photo via LinkedIn profile</em></figcaption>
</figure>

**Through-line:** research rigor → shipping algorithms in industry → **large-scale systems** → **teaching** what actually matters.

---

## Two lenses on “hard” engineering

| Lens | MathWorks era | Google era |
| ----- | ------------- | ----------- |
| **Dominant pain** | High **algorithmic** complexity | High **distributed** scale |
| **Rough scale** | Not “millions of QPS” | **Large** QPS, big fleets |
| **What you optimize** | Motion planning, geometry, DL hybrids | Backends, security, ML in production |
| **Muscle memory** | Deep math in the loop | Systems + reliability |

**Bridge habit:** informal **Friday cohorts** (Deep Learning Bookshop at MathWorks → ML reading group at Google) → love of **unpacking** theory **and** practice → **Lexi**.

---

## Thesis of this talk

> A handful of deep-learning researchers and builders—often not household names—helped unlock **trillions** in value and a **trillion-dollar** industry narrative.
>
> Today: **how** that happened, **what** scaled, **where** we are, **what** engineers should watch next.

---

## Breakthrough A — “Attention Is All You Need”

**Transformer** — *Self-attention · parallelizable · backbone of modern LLMs*

**Attention Is All You Need** (2017) is the paper that named and introduced the **Transformer**: sequence modeling built on **self-attention**—highly **parallelizable**, without the **RNN** recurrence bottleneck, and easy to stack—so training could lean on **GPUs** the way convnets already did for vision. A small **Google** research team (the famous **Vaswani** et al. line-up, with **Ashish Vaswani** as first author) shipped an idea so compact that people half-jokingly call it a **billion-dollar paper**.

In retrospect, that blueprint became the **backbone of modern LLMs**—encoder-only, decoder-only, and encoder–decoder variants fed **BERT**-class models, **GPT**-class models, and everything downstream (chat, code, search, multimodal stacks). It turned “scale attention and data” into the default industrial path and helped ignite the **GPU** and **cloud** demand we still ride today.

---

## Breakthrough B — Silicon Valley meets Toronto

### Santa Clara / NVIDIA

**Jensen Huang** — graphics as a bet; “we sell **technology**” positioning; long runway before DL became the killer workload.

<figure>
  <a href="https://commons.wikimedia.org/wiki/File:Jensen_Huang_-_Nvidia_Keynote_-_CES_2025_Las_Vegas_(1).jpg" title="Pronoia, CC0, via Wikimedia Commons">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jensen_Huang_-_Nvidia_Keynote_-_CES_2025_Las_Vegas_%281%29.jpg/960px-Jensen_Huang_-_Nvidia_Keynote_-_CES_2025_Las_Vegas_%281%29.jpg" width="960" alt="Jensen Huang — Nvidia keynote, CES 2025, Las Vegas" />
  </a>
  <figcaption><a href="https://commons.wikimedia.org/wiki/File:Jensen_Huang_-_Nvidia_Keynote_-_CES_2025_Las_Vegas_(1).jpg">Pronoia</a>, CC0, via Wikimedia Commons</figcaption>
</figure>

### Toronto

**Geoffrey Hinton** and students — ideas of **learning in neural nets**; competition-grade vision models.

<figure>
  <img src="https://www.zdnet.com/a/img/resize/cbdfcc9ffe02c07ec17d656be49e670a55e467ec/2025/03/20/1fff3c66-1148-433b-859b-e53ca710522c/u-of-toronto-2013-hinton-krizhevsky-sutskever.jpg?auto=webp&width=1280" width="1280" alt="Geoffrey Hinton (center) with Alex Krizhevsky and Ilya Sutskever at the University of Toronto, circa 2013 — the AlexNet team" />
  <figcaption>University of Toronto, ~2013 — <strong>Hinton</strong>, <strong>Krizhevsky</strong>, <strong>Sutskever</strong>. Photo via <a href="https://www.zdnet.com/">ZDNet</a>.</figcaption>
</figure>

---

## AlexNet — why GPUs mattered

| Ingredient | What actually happened | Why it mattered for NVIDIA / GPUs |
| ---------- | ------------------------ | --------------------------------- |
| **Dual NVIDIA GTX 580 GPUs** | Model was explicitly split across 2 GPUs (due to 3GB memory limits) | Forced model parallelism → showed GPUs can scale beyond a single device |
| **Massive dataset (ImageNet)** | ~1.2M labeled images | Training became compute-bound, not just algorithm-bound |
| **Training time (~5–6 days)** | On 2 GPUs instead of weeks/months on CPUs | GPUs made deep learning practically feasible, not just theoretical |
| **CUDA-based implementation** | Custom CUDA kernels for conv + pooling | Validated CUDA as the default DL backend |
| **Batch stochastic gradient descent** | Mini-batch size ~128 | Perfect fit for parallel matrix multiplications on GPUs |

<figure>
  <img src="https://tpucdn.com/gpu-specs/images-new/c/270-front-thumb-2x.jpg" width="900" alt="NVIDIA GeForce GTX 580 graphics card (front)" />
  <figcaption><strong>NVIDIA GeForce GTX 580</strong> — same GPU family AlexNet was trained on (two cards, model split across both). Image from <a href="https://www.techpowerup.com/gpu-specs/geforce-gtx-580.c270">TechPowerUp GPU Specs</a>.</figcaption>
</figure>

**Punchline:** NVIDIA had been waiting ~**12 years** for a “this is it” moment—GPUs as **trainers**, not only **rasterizers**.

---

## The “Big Bang” framing

| Pillar | What happened (2012 era) | What it proved | Why it mattered long-term |
| ------ | -------------------------- | -------------- | ------------------------- |
| **Algorithmic Proof** | AlexNet dominates ImageNet | Deep neural networks can outperform traditional ML at scale | Shift from “hand-engineered features” → end-to-end learning |
| **Compute Breakthrough** | Training on NVIDIA GTX 580 GPUs using CUDA | Neural networks scale with parallel compute (matrix multiplications) | GPUs become default engine of AI → rise of NVIDIA |
| **Data Availability** | Large-scale labeled datasets like ImageNet | Performance improves with more data | Data becomes a strategic asset → flywheel: data → better models → more usage → more data |
| **Universal Approximation Theorem** | — | Neural networks can approximate any continuous function given enough capacity | Deep learning is not task-specific—it’s a general-purpose learning machine |
| **Representation Learning** | — | Networks map raw input → higher-dimensional representations | Eliminates need for manual feature engineering |
| **Modality Agnostic** | — | Same architecture can handle images, text, audio, video | One paradigm → many domains (CV, NLP, speech, agents) |
| **Scaling Hypothesis** | — | More data + more compute + bigger models → better performance | Turns AI into an engineering + infrastructure problem, not just research |

---

## Model lineage — the stack we climbed (with equations)

*Copy each `$$ … $$` **inner** body into Substack **More → LaTeX** if inline Markdown math does not render.*

### 1. Classical era — linear models

$$
y = \mathbf{w}^\top \mathbf{x} + b
$$

| Idea | Meaning | Limitation |
| ---- | ------- | ---------- |
| **Linear regression** | Weighted sum of inputs | Can only model **linear relationships** |

### 2. Logistic regression — first non-linearity (output layer)

$$
\sigma(z) = \frac{1}{1 + e^{-z}}
$$

| Idea | Meaning | Limitation |
| ---- | ------- | ---------- |
| **Sigmoid on linear model** | Maps output → probability | Still **linear decision boundary** in input space |

### 3. Perceptron — first “neuron”

$$
y = \sigma(\mathbf{w}^\top \mathbf{x} + b)
$$

| Idea | Meaning | Limitation |
| ---- | ------- | ---------- |
| **Linear + activation** | Basic neuron | Single layer → **can’t solve complex patterns** |

### 4. Neural networks — composition begins

$$
\mathbf{h} = \sigma(W_1 \mathbf{x} + \mathbf{b}_1), \qquad \mathbf{y} = W_2 \mathbf{h} + \mathbf{b}_2
$$

| Idea | Meaning | Breakthrough |
| ---- | ------- | ------------- |
| **Stack neurons** | Learn intermediate representations | **Non-linear function approximation** begins |

### 5. Deep neural networks — representation learning

$$
\mathbf{h}^{(\ell)} = \sigma\bigl(W^{(\ell)} \mathbf{h}^{(\ell-1)} + \mathbf{b}^{(\ell)}\bigr)
$$

| Idea | Meaning | Breakthrough |
| ---- | ------- | ------------- |
| **Many layers** | Hierarchical feature learning | Enables **complex patterns** (vision, speech) |

### 6. Convolutional neural networks (CNNs) — structure for vision

$$
(f \ast x)(i,j) = \sum_m \sum_n f(m,n)\, x(i-m,\, j-n)
$$

| Idea | Meaning | Breakthrough |
| ---- | ------- | ------------- |
| **Convolutions** | Local spatial feature extraction | Efficient for **images** → **AlexNet** moment |

### 7. Recurrent neural networks (RNNs) — sequence modeling

$$
\mathbf{h}_t = \sigma(W_h \mathbf{h}_{t-1} + W_x \mathbf{x}_t)
$$

| Idea | Meaning | Limitation |
| ---- | ------- | ---------- |
| **Recurrence** | Memory over time | Hard to train (**vanishing gradients**) |

### 8. Attention & transformers — parallel intelligence

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\left(\frac{Q K^\top}{\sqrt{d_k}}\right) V
$$

| Idea | Meaning | Breakthrough |
| ---- | ------- | ------------- |
| **Attention** | Learn what to focus on | Enables **parallel sequence modeling** |
| **Transformers** | No recurrence | Foundation of **modern AI** |

---

## Moore’s Law vs “accelerated computing”

> “Cost of compute is collapsing exponentially over time.”

<figure>
  <a href="https://commons.wikimedia.org/wiki/File:The_Moore%27s_Law_Update_%E2%80%94_for_128_years_-_54181414828.jpg" title="Steve Jurvetson, CC BY 2.0, via Wikimedia Commons">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/The_Moore%27s_Law_Update_%E2%80%94_for_128_years_-_54181414828.jpg/960px-The_Moore%27s_Law_Update_%E2%80%94_for_128_years_-_54181414828.jpg" width="960" alt="128 years of Moore's Law — c. 1900 to 2024" />
  </a>
  <figcaption><a href="https://commons.wikimedia.org/wiki/File:The_Moore%27s_Law_Update_%E2%80%94_for_128_years_-_54181414828.jpg">Steve Jurvetson</a>, <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>, via Wikimedia Commons</figcaption>
</figure>

- **Y-axis (log scale):** computations per second per dollar  
- **X-axis:** time (**1900 → 2025**)  
- **Each dot:** a machine (**mechanical → modern GPUs**)

> The classical definition of **Moore’s Law**: “Number of transistors on a chip doubles every ~18–24 months.”

> “Deep learning’s Big Bang happened when we realized intelligence scales with compute but Moore’s Law is what made that compute cheap enough to use.”

**Pillars of evolution**

| Concept | Role |
| ------- | ---- |
| **Moore’s Law** | Makes compute **cheaper** |
| **Deep learning** | Converts compute → **intelligence** |
| **Scaling laws** | Tell us **more compute = better models** |

> “Moore’s Law made compute abundant. Deep learning turned that compute into intelligence.”

### NVIDIA’s Law (“Moore’s Law on steroids”)

**NVIDIA accelerated this trend**—not only silicon cadence, but how we **package** and **consume** AI compute:

| Law | What scales | Speed |
| --- | ------------- | ----- |
| **Moore’s Law** | Transistors | ~**2×** every **~2 years** |
| **NVIDIA / AI scaling** | AI compute | ~**10×** every **1–2 years** (recent era, order-of-magnitude story) |

What stacks on top of cheaper FLOPS:

- **Parallelism (GPUs)**  
- **Better architectures (Transformers)**  
- **Distributed training**  
- **Software (CUDA)**

**Model scale (GPT family — indicative, not audited)**

| Model | Year | Parameters | Key shift |
| ----- | ---- | ---------- | --------- |
| **GPT-1** | 2018 | 117M | Proof of **transformer LM** |
| **GPT-2** | 2019 | 1.5B | **Emergent** text generation |
| **GPT-3** | 2020 | 175B | **Few-shot** learning |
| **GPT-4** | 2023 | ~**1T** (estimated, not confirmed) | **Multimodal** + reasoning |
| **GPT-5** (speculative) | ~**2025–26** | **multi-trillion?** | Toward **agents** / **world models** |

> “For a hundred years, Moore’s Law made computation exponentially cheaper. But it wasn’t clear what we would do with all that compute. Deep learning gave us the answer—it converts compute into intelligence. And once that loop started, models began scaling from millions to trillions of parameters, riding on top of an exponential curve that had been building for decades.”

---

## Modern AI — where the problems moved

| Theme | What changed |
| ----- | ------------- |
| **Architecture** | Transformers dominate language & increasingly vision/multimodal |
| **Performance** | Models exceed humans on **narrow** suites—forces honest evaluation |
| **Next frontier** | **Reasoning**, causality, **physics** — models that reflect how the world works |
| **World models** | Learn from **observation** of environment, not text alone |

**Speaker note:** “We are in a **fix and extend** phase—making systems **reliable**, **grounded**, and **interpretable** enough for real stakes.”

---

## Closing — engineers in the room

**Two questions to land:**

1. **Will AI take our jobs?**  
2. **What should we optimize for?**

### Andrej Karpathy

End-to-end systems thinking, teaching clarity, “bitter lesson” energy—pick 1–2 themes you actually use.

<figure>
  <a href="https://commons.wikimedia.org/wiki/File:Andrej_karpathy_2016.webp" title="Sk aman khan, CC0, via Wikimedia Commons">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Andrej_karpathy_2016.webp/960px-Andrej_karpathy_2016.webp.png" width="960" alt="Andrej Karpathy, 2016" />
  </a>
  <figcaption><a href="https://commons.wikimedia.org/wiki/File:Andrej_karpathy_2016.webp">Sk aman khan</a>, CC0, via Wikimedia Commons</figcaption>
</figure>

### Demis Hassabis

Science-grade AGI framing, research organization, long horizons—what you want the audience to remember tomorrow.

<figure>
  <a href="https://commons.wikimedia.org/wiki/File:Demis_Hassabis.jpg" title="Alain Herzog, CC BY-SA 4.0, via Wikimedia Commons">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Demis_Hassabis.jpg/960px-Demis_Hassabis.jpg" width="960" alt="Demis Hassabis giving a campus lecture" />
  </a>
  <figcaption><a href="https://commons.wikimedia.org/wiki/File:Demis_Hassabis.jpg">Alain Herzog</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>, via Wikimedia Commons</figcaption>
</figure>

> “I am a true artist if I am able to start from first principles, learn best known art, but reimplement it in a way that’s never been done before.”
