'use client'

import { X, Link2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Entity, Relationship, GraphData } from '@/lib/types'
import { ENTITY_COLORS, ENTITY_LABELS } from '@/lib/types'

interface EntityPanelProps {
  entity: Entity | null
  graphData: GraphData
  onClose: () => void
}

export function EntityPanel({ entity, graphData, onClose }: EntityPanelProps) {
  if (!entity) return null

  const connections = graphData.links.filter((link) => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as unknown as Entity).id
    const targetId = typeof link.target === 'string' ? link.target : (link.target as unknown as Entity).id
    return sourceId === entity.id || targetId === entity.id
  })

  const connectedEntities = connections.map((link) => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as unknown as Entity).id
    const targetId = typeof link.target === 'string' ? link.target : (link.target as unknown as Entity).id
    const connectedId = sourceId === entity.id ? targetId : sourceId
    const connectedEntity = graphData.nodes.find((n) => n.id === connectedId)
    const direction = sourceId === entity.id ? 'outgoing' : 'incoming'
    return { link, entity: connectedEntity, direction }
  })

  return (
    <div className="flex h-full flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="font-semibold text-foreground">Entity Details</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: ENTITY_COLORS[entity.type] }}
            />
            <span className="text-lg font-semibold text-foreground">
              {entity.name}
            </span>
          </div>

          <div className="mb-3 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            {ENTITY_LABELS[entity.type]}
          </div>

          {entity.description && (
            <p className="text-sm text-muted-foreground">{entity.description}</p>
          )}
        </div>

        <div className="mb-6">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Link2 className="h-4 w-4" />
            Connections ({connections.length})
          </h4>

          {connectedEntities.length > 0 ? (
            <div className="space-y-2">
              {connectedEntities.map(({ link, entity: connected, direction }) => {
                if (!connected) return null
                return (
                  <div
                    key={link.id}
                    className="rounded-lg border border-border/50 bg-secondary/30 p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: ENTITY_COLORS[connected.type] }}
                      />
                      <span className="text-sm font-medium text-foreground">
                        {connected.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={
                          direction === 'outgoing'
                            ? 'text-chart-2'
                            : 'text-primary'
                        }
                      >
                        {direction === 'outgoing' ? 'To' : 'From'}
                      </span>
                      <span className="rounded bg-secondary px-1.5 py-0.5">
                        {link.type}
                      </span>
                      <span className="ml-auto">
                        {Math.round(link.confidence * 100)}% conf.
                      </span>
                    </div>
                    {link.description && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No connections found</p>
          )}
        </div>

        {entity.documentId && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4" />
              Source Document
            </h4>
            <p className="text-xs text-muted-foreground">
              ID: {entity.documentId}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
