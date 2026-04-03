# Prof — Content Engine

The course content platform for **[Prof by Lex AI](https://prof-lexai.vercel.app/)**. Built with [Docusaurus](https://docusaurus.io/), it serves structured courses on AI and Machine Learning, rendered from MDX files with LaTeX math support.

**Live site:** [content.lexailabs.com](https://content.lexailabs.com)

## Courses

### AI for Leaders
Non-technical curriculum covering AI literacy, ML fundamentals, prompt engineering, GenAI overview, and LLMs 101.

### AI for Engineering
Hands-on technical curriculum including:
- Foundations of Regression & Tree-based Algorithms
- Deep Neural Networks, CNNs, and RNNs
- Attention Mechanism & Transformers
- Build and Train Your Own GPT-2 Model
- Agentic AI & AI Research

## Tech Stack

- **Docusaurus 3** — static site generator
- **React 18** / **TypeScript**
- **Tailwind CSS** — styling
- **KaTeX** (remark-math + rehype-katex) — math rendering
- **Prism** — syntax highlighting (Python, R, Julia)

## Getting Started

### Prerequisites

- Node.js >= 18

### Install & Run

```bash
npm install
npm start        # dev server on http://localhost:3001
```

### Build

```bash
npm run build
npm run serve    # preview production build on http://localhost:3001
```

## Project Structure

```
docs/
├── ai-for-leaders/       # AI for Leaders course content (MDX)
├── ai-for-engineering/   # AI for Engineering course content (MDX)
├── ...                   # Other courses (excluded from build)
src/
├── css/                  # Custom styles
├── components/           # React components
├── pages/                # Custom pages
static/
├── img/                  # Images and assets
sidebars.ts               # Sidebar navigation config
docusaurus.config.ts      # Site configuration
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SITE_URL` | `https://content.lexailabs.com` | Production site URL |
| `API_URL` | `https://lexai-auth-service-...run.app` | Auth service API |
| `MAIN_PLATFORM_URL` | `https://learn.lexailabs.com` | Main platform URL |

## License

Copyright © 2026 Lex AI Technologies Pvt Ltd.
