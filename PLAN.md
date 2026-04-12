# Glossarion — 1-Month Build Plan
*Created: April 2026 | Updated: April 7, 2026*

---

## Goal
Build a working product: a document-first deep research agent with visual knowledge graph exploration. Upload a PDF → generate domain ontology → stream entity extraction live → auto-expand via web search → explore visually. Focus is on getting the core product solid, not launching.

## Inspiration
MiroFish (666ghj.github.io/mirofish-demo) — the "expansion factor": watch the graph grow in real-time as entities are discovered. This feeling is the core product moment.

## Schedule
Every **Saturday 9pm PT** (= Sunday 4am UTC). Scheduled agent runs weekly via Claude Cowork.

---

## Week 1 — Saturday April 12, 2026
**Theme: Streaming Pipeline + Live Graph**

### What's Already Built (as of Apr 7)
- Landing page (full UI)
- Upload zone (PDF/TXT/MD)
- ForceGraph2D knowledge graph visualization
- `lib/parser.ts` — PDF parsing with pdf-parse ✓
- `lib/extractor.ts` — Groq llama-3.3-70b-versatile for extraction ✓
- `lib/types.ts` — dynamic entity types, `getEntityColor()` for any type ✓
- `app/api/extract/route.ts` — SSE streaming pipeline ✓
- `components/demo/pipeline-status.tsx` — step-by-step pipeline UI ✓
- `components/demo/expansion-log.tsx` — live log feed ✓
- `app/demo/page.tsx` — SSE stream reader, live graph state ✓
- Node pulse animation for new nodes ✓

### What Still Needs Doing This Week
- [ ] Run `npm run build` and fix any TypeScript/build errors
- [ ] Test end-to-end: upload a real PDF → confirm graph grows live
- [ ] Fix the `InsightStats` type — `entitiesByType` uses `Record<EntityType, number>` which breaks now that EntityType = string (need to handle dynamic types)
- [ ] Remove unused SWR imports from demo page (no longer polling /api/graph)
- [ ] Test ontology generation: confirm domain-specific entity types appear
- [ ] Verify node pulse animation works in browser

### Definition of Done
Upload a PDF → see pipeline steps tick off → graph nodes appear live one by one with pulse animation → ontology tags shown in sidebar.

---

## Week 2 — Saturday April 19, 2026
**Theme: Web Search Expansion Agent**

### What to Build
- [ ] Integrate Tavily API for web search
- [ ] `lib/expander.ts` — for each entity, search the web and find new related entities/relationships
- [ ] `app/api/expand/route.ts` — SSE stream expansion results (same pattern as extract)
- [ ] Add "Expand with Web" button in demo UI
- [ ] Ripple effect: when a node expands, new nodes radiate outward from it visually
- [ ] Source badge: distinguish document nodes vs web-sourced nodes (different border style)
- [ ] Add expansion to pipeline steps: Step 4 "Web Expansion"
- [ ] Expansion log shows: "Searching web for: [entity]..." → "+ 3 new entities found"

### Definition of Done
Click "Expand" on a node → graph grows outward in real-time with web-sourced entities.

---

## Week 3 — Saturday April 26, 2026
**Theme: Auth + Persistence + Sharing**

### What to Build
- [ ] Clerk authentication (sign up / log in)
- [ ] Supabase DB — tables: users, graphs (store nodes + edges as JSON)
- [ ] Save graph after extraction + expansion
- [ ] `/dashboard` — list of user's past graphs
- [ ] `/graph/[id]` — shareable public read-only graph URL
- [ ] Deploy to Vercel (staging)

### Definition of Done
Log in → upload PDF → graph saved → share link → someone else views it.

---

## Week 4 — Saturday May 3, 2026
**Theme: Graph Polish + Advanced Features**

### What to Build
- [ ] Filter graph by entity type (toggle buttons per type)
- [ ] Search/highlight nodes by name
- [ ] Multi-document support: upload multiple PDFs, merge graphs, color-code by source doc
- [ ] Export graph as JSON or PNG
- [ ] Improve insights panel: top 5 most connected, key themes, auto-generated summary
- [ ] Mobile responsiveness
- [ ] End-to-end test with 5 diverse PDF types (legal, academic, news, business, book)

### Definition of Done
Full flow works reliably. Multiple doc types. Graph is filterable, searchable, exportable.

---

## Progress Log

| Date | Week | Status | Notes |
|---|---|---|---|
| Apr 7 | Week 1 | In Progress | SSE streaming pipeline built, needs build check + testing |
| Apr 19 | Week 2 | Scheduled | — |
| Apr 26 | Week 3 | Scheduled | — |
| May 3 | Week 4 | Scheduled | — |

---

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Graph viz:** react-force-graph-2d
- **PDF parsing:** pdf-parse
- **LLM:** Claude 3.5 Sonnet via aiprime.store (OpenAI-compatible proxy)
- **Web search:** Tavily API (Week 2)
- **Auth:** Clerk (Week 3)
- **DB:** Supabase (Week 3)
- **Deploy:** Vercel

## Environment Variables
| Variable | Value |
|---|---|
| `AI_API_KEY` | API key from aiprime.store |
| `AI_BASE_URL` | `https://aiprime.store` |
| `AI_MODEL` | `claude-3-5-sonnet-20241022` |

---

## Key Architecture
```
Upload → Parse (pdf-parse)
       → Generate Ontology (Claude 3.5 Sonnet) — domain-specific entity/relation types
       → Extract Entities (Claude 3.5 Sonnet, streaming SSE) — graph grows live
       → Web Expand (Tavily, streaming SSE) — graph grows outward
       → Save (Supabase) → Share (/graph/[id])
```

*Agent logs: see `logs/` directory in repo after each Saturday run.*
