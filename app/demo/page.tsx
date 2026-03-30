'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import Link from 'next/link'
import { Network, ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadZone } from '@/components/demo/upload-zone'
import { DocumentList } from '@/components/demo/document-list'
import { KnowledgeGraph } from '@/components/demo/knowledge-graph'
import { EntityPanel } from '@/components/demo/entity-panel'
import { InsightsPanel } from '@/components/demo/insights-panel'
import type { Entity, GraphData, Document, InsightStats } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DemoPage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [localDocuments, setLocalDocuments] = useState<Document[]>([])

  const { data: graphResponse } = useSWR<GraphData & { usingDemo: boolean }>(
    '/api/graph',
    fetcher,
    { refreshInterval: 5000 }
  )

  const { data: docsResponse } = useSWR<{ documents: Document[]; usingDemo: boolean }>(
    '/api/graph?type=documents',
    fetcher,
    { refreshInterval: 5000 }
  )

  const { data: insightsResponse } = useSWR<{ insights: InsightStats; usingDemo: boolean }>(
    '/api/graph?type=insights',
    fetcher,
    { refreshInterval: 5000 }
  )

  const graphData: GraphData = graphResponse || { nodes: [], links: [] }
  const documents = [...(docsResponse?.documents || []), ...localDocuments]
  const insights = insightsResponse?.insights
  const usingDemo = graphResponse?.usingDemo ?? true

  const handleUpload = useCallback(async (files: File[]) => {
    setIsProcessing(true)

    for (const file of files) {
      const newDoc: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        type: file.name.endsWith('.pdf')
          ? 'pdf'
          : file.name.endsWith('.md')
            ? 'markdown'
            : 'text',
        content: '',
        uploadedAt: new Date().toISOString(),
        status: 'processing',
      }

      setLocalDocuments((prev) => [newDoc, ...prev])

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentId', newDoc.id)

        const response = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          setLocalDocuments((prev) =>
            prev.map((d) =>
              d.id === newDoc.id ? { ...d, status: 'completed' } : d
            )
          )
          mutate('/api/graph')
          mutate('/api/graph?type=insights')
        } else {
          setLocalDocuments((prev) =>
            prev.map((d) =>
              d.id === newDoc.id ? { ...d, status: 'error' } : d
            )
          )
        }
      } catch (error) {
        console.error('Upload error:', error)
        setLocalDocuments((prev) =>
          prev.map((d) => (d.id === newDoc.id ? { ...d, status: 'error' } : d))
        )
      }
    }

    setIsProcessing(false)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">GraphRAG Demo</span>
          </div>
        </div>

        {usingDemo && (
          <div className="flex items-center gap-2 rounded-full bg-chart-3/10 px-3 py-1.5 text-xs text-chart-3">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Demo Mode - Connect Neo4j for persistence</span>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-80 flex-col border-r border-border bg-card/50">
          <div className="border-b border-border p-4">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Upload Documents
            </h2>
            <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Documents ({documents.length})
            </h2>
            <DocumentList documents={documents} />
          </div>

          {insights && (
            <div className="border-t border-border p-4">
              <InsightsPanel insights={insights} />
            </div>
          )}
        </aside>

        <main className="relative flex-1 bg-background">
          {graphData.nodes.length > 0 ? (
            <KnowledgeGraph
              data={graphData}
              onNodeClick={setSelectedEntity}
              selectedNodeId={selectedEntity?.id}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Network className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Upload documents to build your knowledge graph
                </p>
              </div>
            </div>
          )}
        </main>

        {selectedEntity && (
          <aside className="w-80">
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
