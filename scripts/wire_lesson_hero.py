"""
One-shot script: adds <LessonHero> to every lesson MDX file outside deep-neural-networks.
Run from the repo root: python scripts/wire_lesson_hero.py
"""
import re, os

DOCS = '/Users/lexai/Documents/prof/prof-content-engine/docs'

COURSE = {
    'agentic-ai':                       'Build a Multi-Agent Research Assistant',
    'attention-is-all-you-need':        'Attention Is All You Need',
    'build-and-train-your-own-gpt2-model': 'Build and Train Your Own GPT-2',
    'deep-computer-vision-cnn':         'Deep Computer Vision (CNN)',
    'deep-sequence-modelling-rnn':      'Deep Sequence Modelling (RNN)',
    'foundations-of-regression':        'Foundations of Regression',
    'mle-interview':                    'MLE Interview',
    'genai-for-everyone':               'AI for Everyone',
    'prompt-engineering':               'Prompt Engineering',
}

# (course-dir, filename-stem) → (lesson_number_or_None, clean_title, subtitle)
META = {
    # ── Agentic AI ────────────────────────────────────────────────────────────
    ('agentic-ai', '01-bare-llm-loop'):
        ('1', 'The bare LLM loop', "You call it in a loop — here's where that breaks"),
    ('agentic-ai', '02-tool-use'):
        ('2', 'Give it a tool', "Ground your agent with search — stop it from inventing facts"),
    ('agentic-ai', '03-react-reasoning'):
        ('3', 'ReAct: reason before you act', "Reason, act, observe: the loop that makes agents reliable"),
    ('agentic-ai', '04-planner'):
        ('4', 'The Planner', "Break complex questions into targeted sub-questions first"),
    ('agentic-ai', '05-parallel-executors'):
        ('5', 'Parallel executors', "Run multiple searches at once, then merge the answers"),
    ('agentic-ai', '06-shared-memory'):
        ('6', 'Shared memory', "One source of truth — stop agents contradicting each other"),
    ('agentic-ai', '07-critic'):
        ('7', 'The Critic', "Add a quality gate that rejects bad answers before they ship"),
    ('agentic-ai', '08-full-system'):
        ('8', 'Close the loop: the Orchestrator', "Wire everything together and handle failures automatically"),
    ('agentic-ai', '09-observability'):
        ('9', 'Observability', "Trace every call, find the bottleneck, know what's slow"),

    # ── Attention Is All You Need ──────────────────────────────────────────────
    ('attention-is-all-you-need', 'problem-with-rnns-and-lstms'):
        ('1', 'Why attention? Moving beyond RNNs', "Sequential processing limits scale — attention fixes that"),
    ('attention-is-all-you-need', 'token-embeddings'):
        ('2', 'Token embeddings', "Turning words into vectors the model can reason over"),
    ('attention-is-all-you-need', 'positional-embeddings'):
        ('3', 'Positional embeddings & encodings', "Telling the model where each token sits in the sequence"),
    ('attention-is-all-you-need', 'attention'):
        ('4', 'Attention', "The core operation: which tokens should attend to which"),
    ('attention-is-all-you-need', 'self-attention'):
        ('5', 'Self-attention', "Every token queries every other token in the same sequence"),
    ('attention-is-all-you-need', 'multi-headed-attention'):
        ('6', 'Multi-headed attention', "Running multiple attention patterns in parallel"),
    ('attention-is-all-you-need', 'causal-masking'):
        ('7', 'Causal masking', "Preventing the model from looking at future tokens"),
    ('attention-is-all-you-need', 'residual-connections'):
        ('8', 'Residual connections', "Adding the input back to the output to train deeper networks"),
    ('attention-is-all-you-need', 'layer-normalization'):
        ('9', 'Layer normalization', "Stabilizing activations so training doesn't diverge"),
    ('attention-is-all-you-need', 'feed-forward-neural-networks'):
        ('10', 'Feed-forward neural networks', "The pointwise transformation applied after every attention block"),
    ('attention-is-all-you-need', 'cross-attention'):
        ('11', 'Cross-attention', "How the decoder attends to what the encoder produced"),
    ('attention-is-all-you-need', 'encoder-stack'):
        ('12', 'The encoder stack', "Stacking attention + feed-forward blocks to build representations"),
    ('attention-is-all-you-need', 'decoder-stack'):
        ('13', 'The decoder stack', "Generating output one token at a time with masked self-attention"),
    ('attention-is-all-you-need', 'encoder-decoder-transformer'):
        ('14', 'Encoder–decoder transformer', "The complete architecture from the original paper"),
    ('attention-is-all-you-need', 'interview-readiness'):
        (None, 'Interview Readiness', "High-signal transformer questions for tier-1 ML engineering roles"),

    # ── Build and Train Your Own GPT-2 ────────────────────────────────────────
    ('build-and-train-your-own-gpt2-model', '01-problem-with-rnns-lstms'):
        ('1', 'Problem with RNNs and LSTMs', "Why the old sequential approach had to go"),
    ('build-and-train-your-own-gpt2-model', '02-token-embeddings'):
        ('2', 'Token embeddings', "From raw tokens to vectors the model can learn from"),
    ('build-and-train-your-own-gpt2-model', '03-positional-embeddings'):
        ('3', 'Positional embeddings', "Injecting order into a position-blind architecture"),
    ('build-and-train-your-own-gpt2-model', '04-attention-multi-head-attention'):
        ('4', 'Attention + multi-head attention', "The core mechanism and running multiple heads in parallel"),
    ('build-and-train-your-own-gpt2-model', '05-causal-masking'):
        ('5', 'Causal masking', "Masking future tokens so the model only uses past context"),
    ('build-and-train-your-own-gpt2-model', '06-residual-connections'):
        ('6', 'Residual connections', "Skip connections that make training deep networks stable"),
    ('build-and-train-your-own-gpt2-model', '07-layer-normalization'):
        ('7', 'Layer normalization', "Normalizing across the feature dimension to control scale"),
    ('build-and-train-your-own-gpt2-model', '08-feed-forward-neural-networks'):
        ('8', 'Feed-forward neural networks', "The dense transformation applied at every position after attention"),
    ('build-and-train-your-own-gpt2-model', '09-generation-of-next-tokens'):
        ('9', 'Generation of next tokens', "Sampling, temperature, and producing text one token at a time"),
    ('build-and-train-your-own-gpt2-model', '10-decoder-only-transformer'):
        ('10', 'Decoder-only transformer', "Assembling the full architecture that powers GPT-2"),
    ('build-and-train-your-own-gpt2-model', 'interview-readiness'):
        (None, 'Interview Readiness', "High-signal GPT-2 and decoder transformer questions for ML interviews"),

    # ── Deep Computer Vision (CNN) ─────────────────────────────────────────────
    ('deep-computer-vision-cnn', 'visual-revolution'):
        ('1', 'The visual revolution', "How deep learning rewrote the rules of image recognition"),
    ('deep-computer-vision-cnn', 'transformative-deep-learning-vision'):
        ('2', "Deep learning's role in computer vision", "From hand-crafted features to representations learned from data"),
    ('deep-computer-vision-cnn', 'from-pixels-to-perception'):
        ('3', 'From pixels to perception', "How raw pixel grids become meaningful visual patterns"),
    ('deep-computer-vision-cnn', 'feature-detection-hierarchy'):
        ('4', 'Feature detection & hierarchical structure', "Edges → textures → shapes → objects, layer by layer"),
    ('deep-computer-vision-cnn', 'learning-features-from-data'):
        ('5', 'Learning features from data', "Why neural networks discover better features than humans design"),
    ('deep-computer-vision-cnn', 'preserving-spatial-structure-cnns'):
        ('6', 'Preserving spatial structure', "How convolutions maintain the 2D layout of an image"),
    ('deep-computer-vision-cnn', 'filters-features-convolutions'):
        ('7', 'Filters, features, and convolutions', "The sliding-window operation at the core of every CNN"),
    ('deep-computer-vision-cnn', 'learning-to-see-cnns'):
        ('8', 'Learning to see: how CNNs work', "Inside the network architecture that changed computer vision"),
    ('deep-computer-vision-cnn', 'interview-readiness'):
        (None, 'Interview Readiness', "High-signal CNN questions for tier-1 ML engineering roles"),

    # ── Deep Sequence Modelling (RNN) ──────────────────────────────────────────
    ('deep-sequence-modelling-rnn', 'foundations-of-deep-sequence-modeling'):
        ('1', 'Foundations of deep sequence modeling', "Why sequences require a different kind of network"),
    ('deep-sequence-modelling-rnn', 'from-static-networks-to-time-aware'):
        ('2', 'From static networks to time-aware models', "Adding memory so networks understand order, not just values"),
    ('deep-sequence-modelling-rnn', 'rnn-internal-mechanics'):
        ('3', 'RNN internal mechanics', "The hidden state, recurrence equations, and formal structure"),
    ('deep-sequence-modelling-rnn', 'bringing-sequence-modeling-real-world'):
        ('4', 'Sequences in the real world', "NLP, time series, and speech — where RNNs actually ship"),
    ('deep-sequence-modelling-rnn', 'training-rnn-backprop-through-time'):
        ('5', 'Training RNNs: backpropagation through time', "Unrolling the network in time to compute gradients"),
    ('deep-sequence-modelling-rnn', 'training-an-rnn-in-pytorch'):
        ('6', 'Training an RNN in PyTorch', "From theory to working code with a real dataset"),
    ('deep-sequence-modelling-rnn', 'interview-readiness'):
        (None, 'Interview Readiness', "High-signal RNN and sequence modelling questions for ML interviews"),

    # ── Foundations of Regression ──────────────────────────────────────────────
    ('foundations-of-regression', 'linear-regression-line-ssr-gradient-descent'):
        ('1', 'Linear regression', "The line of best fit and how gradient descent finds it"),
    ('foundations-of-regression', 'why-logistic-regression'):
        ('2', 'Why do we need logistic regression?', "Where linear regression fails for binary outcomes"),
    ('foundations-of-regression', 'sigmoid-function-logistic-regression'):
        ('3', 'The sigmoid function', "Squashing any score into a probability between 0 and 1"),
    ('foundations-of-regression', 'logistic-regression-decision-boundaries'):
        ('4', 'Logistic regression and decision boundaries', "How the sigmoid draws a line between classes"),
    ('foundations-of-regression', 'intuition-behind-logistic-regression'):
        ('5', 'Intuition behind logistic regression', "Why it works and what it's really optimizing for"),
    ('foundations-of-regression', 'log-likelihood-instead-of-squared-error'):
        ('6', 'Log likelihood instead of squared error', "A better loss function for models that output probabilities"),
    ('foundations-of-regression', 'interview-readiness'):
        (None, 'Interview Readiness', "High-signal regression questions for tier-1 ML engineering roles"),

    # ── MLE Interview ──────────────────────────────────────────────────────────
    ('mle-interview', 'rubrics-and-playbook'):
        (None, 'Rubrics and playbook', "How ML interviews are scored and exactly how to prepare"),

    # ── AI for Everyone ────────────────────────────────────────────────────────
    ('genai-for-everyone', 'literacy-and-the-road-to-generative-ai'):
        ('1', 'AI literacy & the road to generative AI', "From rule-based systems to large language models — the 70-year arc"),
    ('genai-for-everyone', 'five-layer-ai-stack'):
        ('2', 'AI as a five-layer stack', "Hardware, data, training, models, and applications as one system"),
    ('genai-for-everyone', 'ai-model-lifecycle-for-leaders'):
        ('3', 'From data to deployment', "The full pipeline from raw data to a product in users' hands"),
    ('genai-for-everyone', 'llm-design-case-study'):
        ('4', 'Design case study: how an LLM works', "Inside GPT: tokens, attention, and next-token prediction"),

    # ── Prompt Engineering ─────────────────────────────────────────────────────
    ('prompt-engineering', 'introduction'):
        ('1', 'Introduction to prompt engineering', "What prompt engineering is and why every practitioner needs it"),
    ('prompt-engineering', 'design-of-a-prompt'):
        ('2', 'Design of a prompt', "Role, context, task, format — the anatomy of an effective prompt"),
    ('prompt-engineering', 'language-models-are-few-shot-learners'):
        ('3', 'Language models are few-shot learners', "The GPT-3 paper and what it revealed about in-context learning"),
    ('prompt-engineering', 'hallucinations-in-large-language-models'):
        ('4', 'Hallucinations in large language models', "Why models confidently make things up — and how to reduce it"),
    ('prompt-engineering', 'hands-on-prompt-design-webapp-cursor'):
        ('5', 'Hands-on: prompt design with Cursor', "Build and iterate real prompts with a live web app"),
    ('prompt-engineering', 'building-digital-assets-tutorial'):
        ('6', 'Building digital assets with prompting', "Creating content pipelines end-to-end with prompt engineering"),
}

def clean_h1(raw):
    """Strip leading '# ', bold markers, and 'Lesson N — ' prefix."""
    s = re.sub(r'^\s*#\s*', '', raw)
    s = re.sub(r'\*\*', '', s)
    s = re.sub(r'^Lesson \d+\s*[—–-]\s*', '', s)
    return s.strip()

def hero_tag(number, title, subtitle, course):
    parts = [f'course="{course}"']
    if number is not None:
        parts.append(f'number="{number}"')
    parts.append(f'title="{title}"')
    if subtitle:
        parts.append(f'subtitle="{subtitle}"')
    return '<LessonHero ' + ' '.join(parts) + ' />'

changed = 0
skipped = 0

for dirpath, _, files in os.walk(DOCS):
    course_dir = os.path.basename(dirpath)
    if course_dir not in COURSE:
        continue

    for fname in sorted(files):
        if not fname.endswith('.mdx') or fname == 'intro.mdx':
            continue

        stem = fname.replace('.mdx', '')
        key = (course_dir, stem)

        if key not in META:
            print(f'  SKIP (no meta): {course_dir}/{fname}')
            skipped += 1
            continue

        fpath = os.path.join(dirpath, fname)
        with open(fpath, 'r') as f:
            content = f.read()

        # Find the first H1 line
        h1_match = re.search(r'^# .+', content, re.MULTILINE)
        if not h1_match:
            print(f'  SKIP (no H1): {course_dir}/{fname}')
            skipped += 1
            continue

        # Skip if already has LessonHero
        if '<LessonHero' in content:
            print(f'  ALREADY DONE: {course_dir}/{fname}')
            continue

        number, title, subtitle = META[key]
        course_name = COURSE[course_dir]
        tag = hero_tag(number, title, subtitle, course_name)

        new_content = content[:h1_match.start()] + tag + content[h1_match.end():]

        with open(fpath, 'w') as f:
            f.write(new_content)

        print(f'  ✓ {course_dir}/{fname}')
        changed += 1

print(f'\nDone — {changed} files updated, {skipped} skipped.')
