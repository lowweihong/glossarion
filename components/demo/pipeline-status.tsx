'use client'

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { getEntityColor } from '@/lib/types'

export interface PipelineStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  message?: string
}

interface PipelineStatusProps {
  steps: PipelineStep[]
  entityCount: number
  relCount: number
  ontology?: { entityTypes: string[]; relationTypes: string[] }
}

export function PipelineStatus({ steps, entityCount, relCount, ontology }: PipelineStatusProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="text-primary font-semibold">{entityCount} nodes</span>
        <span className="text-border">·</span>
        <span className="text-chart-2 font-semibold">{relCount} edges</span>
      </div>

      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-2.5">
            {step.status === 'complete' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 mt-0.5 shrink-0" />
            ) : step.status === 'processing' ? (
              <Loader2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0 animate-spin" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground/25 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0">
              <p className={`text-xs font-medium leading-none mb-0.5 ${step.status === 'pending' ? 'text-muted-foreground/40' : 'text-foreground'}`}>
                {step.label}
              </p>
              {step.message && step.status !== 'pending' && (
                <p className="text-xs text-muted-foreground leading-relaxed">{step.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {ontology && ontology.entityTypes.length > 0 && (
        <div className="pt-3 border-t border-border/40 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entity Types</p>
          <div className="flex flex-wrap gap-1.5">
            {ontology.entityTypes.map((type) => (
              <span
                key={type}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${getEntityColor(type)}22`,
                  color: getEntityColor(type),
                  border: `1px solid ${getEntityColor(type)}44`,
                }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
