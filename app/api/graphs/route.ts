/**
 * /api/graphs
 *
 * GET  — list graphs for the authenticated user (or demo user if auth not configured)
 * POST — save a new graph
 */

import { listGraphs, saveGraph, isSupabaseConfigured } from '@/lib/supabase'
import type { Entity, Relationship } from '@/lib/types'

// ── Resolve the current user ID ──────────────────────────────────────────────
// If Clerk is configured, we read the userId from the Authorization header
// (populated by Clerk's getToken() on the client). If not configured, we fall
// back to a fixed "demo" user so the feature is usable without auth setup.

async function resolveUserId(request: Request): Promise<string> {
  const authHeader = request.headers.get('x-user-id')
  if (authHeader) return authHeader
  return 'demo-user'
}

// ── GET /api/graphs ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json({ graphs: [], demo: true, message: 'Supabase not configured — no persistence' })
  }

  try {
    const userId = await resolveUserId(request)
    const graphs = await listGraphs(userId)
    return Response.json({ graphs })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ── POST /api/graphs ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: 'Supabase not configured — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local' },
      { status: 503 }
    )
  }

  let body: { name?: string; nodes?: Entity[]; links?: Relationship[] }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, nodes, links } = body
  if (!nodes || !links) {
    return Response.json({ error: 'Missing required fields: nodes, links' }, { status: 400 })
  }

  try {
    const userId = await resolveUserId(request)
    const graphName = name ?? `Graph – ${new Date().toLocaleDateString()}`
    const saved = await saveGraph(userId, graphName, nodes, links)
    return Response.json({ graph: saved }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
