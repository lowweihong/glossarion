'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Network, ArrowLeft, Plus, Share2, Trash2, Clock, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SavedGraph } from '@/lib/supabase'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function copyShareLink(id: string) {
  const url = `${window.location.origin}/graph/${id}`
  navigator.clipboard.writeText(url).catch(() => {})
}

export default function DashboardPage() {
  const [graphs, setGraphs] = useState<SavedGraph[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchGraphs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/graphs')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setGraphs(data.graphs ?? [])
      }
    } catch (e) {
      setError('Failed to load graphs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGraphs()
  }, [fetchGraphs])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this graph? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await fetch(`/api/graphs/${id}`, { method: 'DELETE' })
      setGraphs((prev) => prev.filter((g) => g.id !== id))
    } catch {
      alert('Failed to delete graph')
    } finally {
      setDeletingId(null)
    }
  }, [])

  const handleCopy = useCallback((id: string) => {
    copyShareLink(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Network className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Glossarion</span>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/demo" className="gap-2">
              <Plus className="h-4 w-4" />
              New Graph
            </Link>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Your Graphs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Knowledge graphs saved from your document extractions
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-secondary/50" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6">
            <p className="text-sm font-medium text-destructive">{error}</p>
            {error.includes('not configured') && (
              <p className="mt-2 text-xs text-muted-foreground">
                Add <code className="rounded bg-secondary px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                <code className="rounded bg-secondary px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
                <code className="rounded bg-secondary px-1">.env.local</code> to enable persistence.
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && graphs.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <Database className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No saved graphs yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a document in the demo and click "Save Graph"
            </p>
            <Button size="sm" className="mt-6" asChild>
              <Link href="/demo">
                <Plus className="mr-2 h-4 w-4" />
                Build your first graph
              </Link>
            </Button>
          </div>
        )}

        {/* Graph cards */}
        {!loading && !error && graphs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {graphs.map((graph) => (
              <div
                key={graph.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                {/* Graph name */}
                <Link
                  href={`/graph/${graph.id}`}
                  className="mb-3 line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
                >
                  {graph.name}
                </Link>

                {/* Stats */}
                <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    <span className="font-semibold text-primary">{graph.entity_count}</span> nodes
                  </span>
                  <span>·</span>
                  <span>
                    <span className="font-semibold text-chart-2">{graph.link_count}</span> edges
                  </span>
                </div>

                {/* Date */}
                <div className="mt-auto flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(graph.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                    <Link href={`/graph/${graph.id}`}>View</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(graph.id)}
                    title="Copy share link"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {copiedId === graph.id && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-2 py-0.5 text-[10px] text-background">
                        Copied!
                      </span>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(graph.id)}
                    disabled={deletingId === graph.id}
                    title="Delete graph"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
