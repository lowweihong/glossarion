# Glossarion

> Upload any document. Watch the knowledge graph grow.

Glossarion is a document-first deep research agent with real-time visual knowledge graph exploration. Upload a PDF, and watch as the AI extracts entities, generates a domain-specific ontology, and builds a living knowledge graph — node by node, in real time.

**Live demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## What It Does

```
Upload PDF → Generate Ontology → Stream Entities Live → Expand via Web Search → Explore Visually
```

1. **Upload** — drop in a PDF, text file, or markdown document
2. **Ontology generation** — LLM analyzes the document and generates domain-specific entity and relation types (e.g. for a legal doc: `COURT`, `PLAINTIFF`, `STATUTE` — not generic `PERSON`, `ORG`)
3. **Live extraction** — entities and relationships stream in one by one via SSE; the graph grows in real time with a pulse animation on each new node
4. **Web expansion** *(coming Week 2)* — click any node to search the web for related entities; the graph expands outward automatically
5. **Save & share** *(coming Week 3)* — graphs are saved to your account and shareable via a public URL

---

## What It Looks Like

### Landing Page
Animated knowledge graph background with a clean dark-mode UI.

### Demo Page
Split layout: sidebar with pipeline status + live log feed on the left, full-screen interactive graph on the right.

**Pipeline sidebar:**
- Step-by-step pipeline: Parse → Ontology → Extract → Expand
- Live counters: `32 nodes · 45 edges`
- Ontology tags with domain-specific entity types
- Timestamped live log: `20:53:43 + Harvard University (UNIVERSITY)`

**Graph canvas:**
- Force-directed graph with color-coded entity types
- New nodes pulse with a glow animation when they appear
- Click any node to see its details and connections
- Zoom, pan, fit-to-view controls

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Graph viz | react-force-graph-2d |
| LLM | Groq (llama-3.3-70b-versatile) |
| Streaming | Server-Sent Events (SSE) |
| PDF parsing | pdf-parse |
| Web search | Tavily API *(Week 2)* |
| Auth | Clerk *(Week 3)* |
| Database | Supabase *(Week 3)* |
| Deploy | Vercel |

---

## 4-Week Build Plan

| Week | Date | Theme | Status |
|---|---|---|---|
| 1 | Apr 12 | Streaming pipeline + live graph | 🔨 In progress |
| 2 | Apr 19 | Web search expansion agent | ⏳ Scheduled |
| 3 | Apr 26 | Auth + persistence + sharing | ⏳ Scheduled |
| 4 | May 3 | Graph polish + advanced features | ⏳ Scheduled |

Built with weekly scheduled Claude Code agents — see [`PLAN.md`](./PLAN.md) for the full plan and [`logs/`](./logs/) for weekly agent output.

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Add your API key
echo "GROQ_API_KEY=your_key_here" > .env.local

# Run locally
pnpm dev
```

Open [http://localhost:3000/demo](http://localhost:3000/demo) and upload any PDF.

Get a free Groq API key at [console.groq.com](https://console.groq.com).

---

## Market Context

The "deep research agent" space is growing fast (ChatGPT Deep Research, Gemini Deep Research, Perplexity). None of them offer a **visual knowledge graph** as the primary interface. Glossarion's differentiator: the graph is the product, not a side feature.

Target users: researchers, law firms (SMB), business analysts, students.

See [`market_research.md`](./market_research.md) for the full analysis.
