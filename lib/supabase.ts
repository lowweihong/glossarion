/**
 * Supabase persistence layer — uses PostgREST REST API directly (no SDK required).
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL  — e.g. https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — public anon key from Supabase project settings
 *
 * SQL schema (run once in Supabase SQL editor):
 * -------------------------------------------------------------------
 * CREATE TABLE IF NOT EXISTS graphs (
 *   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   user_id     TEXT NOT NULL,
 *   name        TEXT NOT NULL,
 *   nodes       JSONB NOT NULL DEFAULT '[]',
 *   links       JSONB NOT NULL DEFAULT '[]',
 *   entity_count INTEGER DEFAULT 0,
 *   link_count   INTEGER DEFAULT 0,
 *   created_at  TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at  TIMESTAMPTZ DEFAULT NOW()
 * );
 * ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;
 * -- Allow anyone to read (for public share links):
 * CREATE POLICY "Public read" ON graphs FOR SELECT USING (true);
 * -- Allow users to insert/update/delete their own graphs:
 * CREATE POLICY "Owner write" ON graphs FOR ALL USING (user_id = auth.uid()::text);
 * -- If using anon key + user_id from Clerk (not Supabase Auth), relax policy:
 * -- DROP POLICY "Owner write" ON graphs;
 * -- CREATE POLICY "Owner write" ON graphs FOR ALL USING (true);
 * -------------------------------------------------------------------
 */

import type { Entity, Relationship } from '@/lib/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY)
}

function supabaseHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
    Prefer: 'return=representation',
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SavedGraph {
  id: string
  user_id: string
  name: string
  nodes: Entity[]
  links: Relationship[]
  entity_count: number
  link_count: number
  created_at: string
  updated_at: string
}

// ── Operations ────────────────────────────────────────────────────────────────

/**
 * Save (insert) a new graph for a user. Returns the saved graph with its assigned ID.
 */
export async function saveGraph(
  userId: string,
  name: string,
  nodes: Entity[],
  links: Relationship[]
): Promise<SavedGraph> {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured')

  const payload = {
    user_id: userId,
    name,
    nodes,
    links,
    entity_count: nodes.length,
    link_count: links.length,
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/graphs`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase saveGraph failed: ${res.status} ${err}`)
  }

  const rows = (await res.json()) as SavedGraph[]
  return rows[0]
}

/**
 * List all graphs for a user, most recent first.
 */
export async function listGraphs(userId: string): Promise<SavedGraph[]> {
  if (!isSupabaseConfigured()) return []

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/graphs?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&select=id,user_id,name,entity_count,link_count,created_at,updated_at`,
    {
      method: 'GET',
      headers: supabaseHeaders(),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase listGraphs failed: ${res.status} ${err}`)
  }

  return (await res.json()) as SavedGraph[]
}

/**
 * Get a single graph by ID (nodes + links included).
 */
export async function getGraph(id: string): Promise<SavedGraph | null> {
  if (!isSupabaseConfigured()) return null

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/graphs?id=eq.${encodeURIComponent(id)}&select=*`,
    {
      method: 'GET',
      headers: supabaseHeaders(),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase getGraph failed: ${res.status} ${err}`)
  }

  const rows = (await res.json()) as SavedGraph[]
  return rows[0] ?? null
}

/**
 * Delete a graph by ID.
 */
export async function deleteGraph(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return

  const res = await fetch(`${SUPABASE_URL}/rest/v1/graphs?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: supabaseHeaders(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase deleteGraph failed: ${res.status} ${err}`)
  }
}
