# Glossarion — 1-Month Build Plan
*Created: April 2026 | Updated: —*

---

## Goal
Build a working product: a document-first deep research agent with visual knowledge graph exploration. Upload a PDF → extract entities → auto-expand via web search → explore visually. Focus is on getting the core product solid, not launching.

## Schedule
Every **Saturday 9pm PT** (= Sunday 4am UTC). Each week has a scheduled remote Claude agent that prepares a build brief, does research, and logs progress.

---

## Week 1 — Saturday April 12, 2026
**Theme: Wire Up the Real Backend**

### What's Already Built
- Landing page (full UI, static)
- Demo UI: upload zone, ForceGraph2D knowledge graph, entity panel, insights panel
- Type system: Entity, Relationship, Document, GraphData
- API route stubs: `/api/extract`, `/api/graph`
- Lib files: `extractor.ts`, `parser.ts`, `neo4j.ts`, `demo-data.ts`

### What to Build This Week
- [ ] `lib/parser.ts` — real PDF text extraction using `pdf-parse` or `pdfjs-dist`
- [ ] `lib/extractor.ts` — call Claude API (claude-sonnet-4-6) to extract entities + relationships from text
- [ ] `app/api/extract/route.ts` — receive uploaded file, parse → extract → return GraphData
- [ ] `app/api/graph/route.ts` — serve stored graph data
- [ ] Wire demo UI to real API (replace mock `demo-data.ts` calls)
- [ ] Add loading states and error handling in demo page

### Definition of Done
Upload a real PDF → see a real knowledge graph with real entities extracted by Claude.

### Agent Task (runs Sat Apr 12 9pm PT)
Research + prepare: best PDF parsing library for Next.js, Claude API entity extraction prompt patterns, example entity/relationship JSON schemas.

---

## Week 2 — Saturday April 19, 2026
**Theme: Web Search Expansion Agent**

### What to Build This Week
- [ ] Integrate Tavily API (or Perplexity API) for web search
- [ ] `lib/expander.ts` — for each entity in the graph, search the web and extract new related entities/relationships
- [ ] `app/api/expand/route.ts` — endpoint to trigger web expansion for a given graph
- [ ] Add "Expand with Web" button in demo UI
- [ ] Show visual distinction: document nodes vs web-sourced nodes (different color/border)
- [ ] Add expansion progress indicator ("Searching web for: [entity name]...")
- [ ] Stream expansion results to UI as they come in

### Definition of Done
Click "Expand" → graph grows in real-time as the agent searches the web for each entity.

### Agent Task (runs Sat Apr 19 9pm PT)
Research + prepare: Tavily vs Perplexity for entity-centric search, prompt patterns for extracting new graph nodes from search results, streaming UI patterns in Next.js.

---

## Week 3 — Saturday April 26, 2026
**Theme: Auth + Persistence + Sharing**

### What to Build This Week
- [ ] Add Clerk authentication (sign up / log in)
- [ ] Set up Supabase (or Neon) database — tables: users, documents, graphs
- [ ] Save graphs to DB after extraction + expansion
- [ ] User dashboard: list of past graphs
- [ ] Shareable graph URLs (`/graph/[id]`) — public or private
- [ ] Deploy to Vercel (staging environment)

### Definition of Done
Log in → upload a PDF → graph is saved → share a link → someone else can view the graph.

### Agent Task (runs Sat Apr 26 9pm PT)
Research + prepare: Clerk + Next.js setup guide, Supabase schema for graphs, Vercel deployment checklist for this stack.

---

## Week 4 — Saturday May 3, 2026
**Theme: Graph Polish + Advanced Features**

### What to Build This Week
- [ ] Filter graph by entity type (toggle PERSON / ORG / CONCEPT etc.)
- [ ] Search/highlight nodes by name within the graph
- [ ] Multi-document support: upload multiple PDFs, merge into one graph, color-code by source document
- [ ] Export graph as JSON or PNG
- [ ] Improve insights panel: show most connected nodes, cluster summary, key themes
- [ ] Mobile responsiveness: make the demo page usable on tablet/phone
- [ ] End-to-end test with 5 different real PDFs (legal brief, research paper, news article, business report, book chapter) — fix any edge cases

### Definition of Done
The full flow works reliably end-to-end: upload → extract → expand via web → filter/search graph → export. Works on multiple document types.

### Agent Task (runs Sat May 3 9pm PT)
Implement the above features. Test with diverse PDF types and log any issues in `logs/week4-output.md`.

---

## Progress Log
*Agents append their output here after each Saturday run.*

| Date | Week | Status | Notes |
|---|---|---|---|
| Apr 12 | Week 1 | Scheduled | — |
| Apr 19 | Week 2 | Scheduled | — |
| Apr 26 | Week 3 | Scheduled | — |
| May 3 | Week 4 | Scheduled | — |

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Graph viz:** react-force-graph-2d (already installed)
- **PDF parsing:** pdf-parse or pdfjs-dist
- **LLM:** Claude API (claude-sonnet-4-6) for entity extraction
- **Web search:** Tavily API
- **Auth:** Clerk
- **DB:** Supabase
- **Deploy:** Vercel (when ready)

---

*Scheduled agents log: see `/logs/` directory after first run.*
