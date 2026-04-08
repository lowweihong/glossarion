'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Network, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadZone } from '@/components/demo/upload-zone'
import { DocumentList } from '@/components/demo/document-list'
import { KnowledgeGraphWrapper } from '@/components/demo/knowledge-graph-wrapper'
import { EntityPanel } from '@/components/demo/entity-panel'
import { PipelineStatus, type PipelineStep } from '@/components/demo/pipeline-status'
import { ExpansionLog, type LogEntry } from '@/components/demo/expansion-log'
import type { Entity, Relationship, GraphData, Document, Ontology } from '@/lib/types'

const INITIAL_STEPS: PipelineStep[] = [
  { id: 'parsing', label: 'Parse Document', status: 'pending' },
  { id: 'ontology', label: 'Generate Ontology', status: 'pending' },
  { id: 'extraction', label: 'Extract Entities', status: 'pending' },
]

export default function DemoPage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] })
  const [newNodeIds, setNewNodeIds] = useState<Set<string>>(new Set())
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS)
  const [ontology, setOntology] = useState<Ontology | undefined>()
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [entityCount, setEntityCount] = useState(0)
  const [relCount, setRelCount] = useState(0)

  const logIdRef = useRef(0)

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: String(logIdRef.current++),
      message,
      type,
      timestamp: new Date(),
    }
    setLogEntries((prev) => [...prev.slice(-50), entry])
  }, [])

  const updateStep = useCallback((id: string, status: PipelineStep['status'], message?: string) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, status, message } : s))
  }, [])

  const handleUpload = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    setSteps(INITIAL_STEPS)
    setLogEntries([])
    setOntology(undefined)
    setEntityCount(0)
    setRelCount(0)

    for (const file of files) {
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`

      const newDoc: Document = {
        id: docId,
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.md') ? 'markdown' : 'text',
        content: '',
        uploadedAt: new Date().toISOString(),
        status: 'processing',
      }
      setDocuments((prev) => [newDoc, ...prev])
      addLog(`Uploading ${file.name}...`, 'info')

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentId', docId)

        const response = await fetch('/api/extract', { method: 'POST', body: formData })
        if (!response.body) throw new Error('No response stream')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'status') {
                updateStep(event.step, event.status, event.message)
                addLog(event.message, event.status === 'complete' ? 'complete' : 'info')
              }

              if (event.type === 'ontology') {
                setOntology({ entityTypes: event.entityTypes, relationTypes: event.relationTypes })
                addLog(`Ontology: ${event.entityTypes.slice(0, 3).join(', ')}...`, 'info')
              }

              if (event.type === 'progress') {
                addLog(event.message, 'info')
              }

              if (event.type === 'entity') {
                const entity: Entity = event.entity
                setGraphData((prev) => ({
                  nodes: prev.nodes.find((n) => n.id === entity.id) ? prev.nodes : [...prev.nodes, entity],
                  links: prev.links,
                }))
                setNewNodeIds((prev) => new Set([...prev, entity.id]))
                setEntityCount((c) => c + 1)
                addLog(`+ ${entity.name} (${entity.type})`, 'entity')

                // Remove from new nodes after 3s
                setTimeout(() => {
                  setNewNodeIds((prev) => { const s = new Set(prev); s.delete(entity.id); return s })
                }, 3000)
              }

              if (event.type === 'relationship') {
                const rel: Relationship = event.relationship
                setGraphData((prev) => ({
                  nodes: prev.nodes,
                  links: prev.links.find((l) => l.id === rel.id) ? prev.links : [...prev.links, rel],
                }))
                setRelCount((c) => c + 1)
                addLog(`→ ${rel.type}`, 'relationship')
              }

              if (event.type === 'complete') {
                setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'completed' } : d))
                addLog(`Done — ${event.entityCount} entities, ${event.relCount} relationships`, 'complete')
              }

              if (event.type === 'error') {
                setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'error' } : d))
                addLog(`Error: ${event.message}`, 'error')
              }
            } catch {}
          }
        }
      } catch (error) {
        console.error('Upload error:', error)
        setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, status: 'error' } : d))
        addLog('Upload failed', 'error')
      }
    }

    setIsProcessing(false)
  }, [addLog, updateStep])

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
            <span className="font-semibold text-foreground">Glossarion</span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <span><span className="text-primary font-semibold">{entityCount}</span> nodes</span>
          <span>·</span>
          <span><span className="text-chart-2 font-semibold">{relCount}</span> edges</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-72 flex-col border-r border-border bg-card/50 overflow-y-auto">
          <div className="border-b border-border p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Upload</h2>
            <UploadZone onUpload={handleUpload} isProcessing={isProcessing} />
          </div>

          {(isProcessing || steps.some((s) => s.status !== 'pending')) && (
            <div className="border-b border-border p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline</h2>
              <PipelineStatus
                steps={steps}
                entityCount={entityCount}
                relCount={relCount}
                ontology={ontology}
              />
            </div>
          )}

          {logEntries.length > 0 && (
            <div className="border-b border-border p-4">
              <ExpansionLog entries={logEntries} />
            </div>
          )}

          <div className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Documents ({documents.length})
            </h2>
            <DocumentList documents={documents} />
          </div>
        </aside>

        <main className="relative flex-1 bg-background">
          {graphData.nodes.length > 0 ? (
            <KnowledgeGraphWrapper
              data={graphData}
              onNodeClick={setSelectedEntity}
              selectedNodeId={selectedEntity?.id}
              newNodeIds={newNodeIds}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <Network className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Upload a document to grow your knowledge graph</p>
              </div>
            </div>
          )}
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
