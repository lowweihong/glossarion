'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Network, ArrowLeft, Share2, Users, GitBranch, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KnowledgeGraphWrapper } from '@/components/demo/knowledge-graph-wrapper'
import { EntityPanel } from '@/components/demo/entity-panel'
import type { Entity, GraphData } from '@/lib/types'
import type { SavedGraph } from '@/lib/supabase'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SharedGraphPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [graph, setGraph] = useState<SavedGraph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/graphs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setGraph(data.graph)
        }
      })
      .catch(() => setError('Failed to load graph'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const graphData: GraphData = graph
    ? { nodes: graph.nodes, links: graph.links }
    : { nodes: [], links: [] }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Network className="h-6 w-6 animate-pulse text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading graph…</p>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !graph) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Graph not found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error ?? 'This graph may have been deleted or the link is invalid.'}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── Graph view ────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
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
            <div>
              <span className="text-sm font-semibold text-foreground">{graph.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">· shared view</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="text-primary font-semibold">{graph.entity_count}</span> nodes
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span className="text-chart-2 font-semibold">{graph.link_count}</span> edges
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
            <Share2 className="h-3.5 w-3.5" />
            {copied ? 'Copied!' : 'Share'}
          </Button>
          <Button size="sm" asChild>
            <Link href="/demo">Build your own</Link>
          </Button>
        </div>
      </header>

      {/* Graph canvas */}
      <div className="flex flex-1 overflow-hidden">
        <main className="relative flex-1 bg-background">
          <KnowledgeGraphWrapper
            data={graphData}
            onNodeClick={setSelectedEntity}
            selectedNodeId={selectedEntity?.id}
            newNodeIds={new Set()}
            webNodeIds={new Set(graph.nodes.filter((n) => n.source === 'web').map((n) => n.id))}
          />
          {/* Watermark / created-at badge */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            Created {formatDate(graph.created_at)} · Powered by Glossarion
          </div>
        </main>

        {selectedEntity && (
          <aside className="w-80 border-l border-border">
            <EntityPanel
              entity={selectedEntity}
              graphData={graphData}
              onClose={() => setSelectedEntity(null)}
            />
          </aside>
        )}
      </div>
    </div>
  )
}
