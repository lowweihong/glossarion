/**
 * /api/graphs/[id]
 *
 * GET    — fetch a single graph by ID (public — used for shareable links)
 * DELETE — delete a graph (owner only)
 */

import { getGraph, deleteGraph, isSupabaseConfigured } from '@/lib/supabase'

// ── GET /api/graphs/[id] ──────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: 'Supabase not configured — graph sharing requires persistence' },
      { status: 503 }
    )
  }

  try {
    const graph = await getGraph(id)
    if (!graph) {
      return Response.json({ error: 'Graph not found' }, { status: 404 })
    }
    return Response.json({ graph })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}

// ── DELETE /api/graphs/[id] ───────────────────────────────────────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isSupabaseConfigured()) {
    return Response.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  // Basic ownership check via x-user-id header (set by client from Clerk session)
  const userId = request.headers.get('x-user-id') ?? 'demo-user'

  try {
    const graph = await getGraph(id)
    if (!graph) {
      return Response.json({ error: 'Graph not found' }, { status: 404 })
    }
    if (graph.user_id !== userId && graph.user_id !== 'demo-user') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    await deleteGraph(id)
    return new Response(null, { status: 204 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
