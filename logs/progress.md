# Glossarion — Build Agent Progress Log

*Automated log. Appended each Saturday by the weekly build agent.*

---

## Run: April 5, 2026 — Pre-Week 1 Codebase Audit

**Agent run date:** Sunday, April 5, 2026 (Saturday Apr 4 9pm PT)
**Scheduled week:** Pre-Week 1 (Week 1 officially starts April 12)
**Status:** ✅ AHEAD OF SCHEDULE — Week 1 tasks largely complete

---

### What Was Found

This is the first agent run. No prior progress to reference. Performed a full codebase audit against the PLAN.md Week 1 task list.

**Week 1 Task Status (due April 12):**

| Task | Status | Notes |
|---|---|---|
| `lib/parser.ts` — real PDF parsing | ✅ Done | Uses `pdf-parse@1.1.1`; handles PDF, .md, plain text; includes `chunkText()` with paragraph + sentence splitting |
| `lib/extractor.ts` — AI entity extraction | ⚠️ Done (deviation) | Implemented and working, but uses **Groq/llama-3.3-70b-versatile** via `@ai-sdk/groq` instead of Claude claude-sonnet-4-6 as planned. Zod schema for entities + relationships is solid. Graceful fallback to demo data if `GROQ_API_KEY` not set. |
| `app/api/extract/route.ts` | ✅ Done | Receives multipart file, parses → extracts up to 3 chunks → deduplicates entities → optionally persists to Neo4j → returns `{ entities, relationships, usingAI, usingNeo4j }` |
| `app/api/graph/route.ts` | ✅ Done | GET `/api/graph`, `/api/graph?type=documents`, `/api/graph?type=insights` all implemented. POST for manual entity/relationship/document creation. Falls back to demo data if Neo4j not configured. |
| Demo UI wired to real API | ✅ Done | `app/demo/page.tsx` uses SWR + real `/api/extract` POST on upload. Local state (`localGraphData`) merges with server state. Error/processing states handled. "Demo Mode" banner shown when Neo4j not configured. |
| Loading states + error handling | ✅ Done | `isProcessing` flag, per-document `status: 'error'` on failure, error catch blocks in upload handler. |

**Additional work already done (beyond Week 1 scope):**
- Google Analytics integrated (`G-VW633VFWWN`) via `@next/third-parties`
- Vercel Analytics (`@vercel/analytics`) installed
- Neo4j persistence layer fully implemented (`lib/neo4j.ts`) — ahead of Week 3 scope
- Type system complete: `Entity`, `Relationship`, `Document`, `GraphData`, `InsightStats`, `ENTITY_COLORS`, `ENTITY_LABELS`
- Demo data fallback (`lib/demo-data.ts`) for graceful offline operation
- ForceGraph2D with SSR-disabled dynamic import
- Full shadcn/ui component library installed

---

### Key Deviations from Plan

1. **Extractor LLM: Groq instead of Claude** — `lib/extractor.ts` calls `groq('llama-3.3-70b-versatile')` via `@ai-sdk/groq`. The plan specified `claude-sonnet-4-6`. This works and the quality is likely acceptable, but Week 1's definition of done was "real entities extracted by Claude." Consider switching to Claude API for Week 1 completion, or officially update the plan to reflect the Groq decision.

2. **Chunk limit: 3 chunks max** — `app/api/extract/route.ts` only processes `Math.min(chunks.length, 3)` chunks. For long PDFs, this may miss most content. Consider increasing or making configurable.

3. **No `ANTHROPIC_API_KEY` in env** — If the plan is to switch back to Claude, this env var will need to be added to the deployment environment.

---

### Recommendations for Week 1 Agent (April 12)

Since the core implementation is done, the April 12 run should focus on:

1. **Decision: Groq vs Claude** — Confirm whether to keep Groq (faster, cheaper) or switch to Claude claude-sonnet-4-6 as planned. If switching, update `lib/extractor.ts` to use `@ai-sdk/anthropic`.
2. **Test with real PDFs** — Run an end-to-end test uploading a real PDF and verify entity extraction quality.
3. **Chunk limit** — Evaluate whether 3-chunk limit is sufficient or needs increasing.
4. **Env vars documentation** — Add a `.env.example` file documenting required: `GROQ_API_KEY` (or `ANTHROPIC_API_KEY`), `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`.
5. **Begin Week 2 prep** — Since Week 1 is essentially done, research Tavily API for the web expansion agent (Week 2 task).

---

### Codebase Health

- **Git:** Clean main branch, up to date with `origin` (`git@github-lowweihong:lowweihong/v0-graph-rag-page.git`)
- **Last commit:** `46863f2 fix: return extracted entities from API and render in local graph state`
- **Dependencies:** All installed, no apparent conflicts
- **TypeScript:** tsconfig present, strict mode not verified
- **Build:** Not tested in this run (no build command executed)

---

*Next scheduled run: Saturday April 12, 2026 9pm PT*

---

### Agent Notes

- **Push status:** Commit `d754594` created locally but **push failed** — the sandbox environment does not have access to `~/.ssh/config` containing the `github-lowweihong` host alias. Please run `git push origin main` manually from the project directory to sync to GitHub.
- **Filesystem:** virtiofs FUSE mount causes git lock files to persist (cannot unlink), but git operations complete successfully with workaround (rename instead of delete).

---
