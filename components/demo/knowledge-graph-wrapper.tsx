'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { GraphData, Entity } from '@/lib/types'

const KnowledgeGraph = dynamic(
  () => import('./knowledge-graph').then((mod) => mod.KnowledgeGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

interface KnowledgeGraphWrapperProps {
  data: GraphData
  onNodeClick?: (node: Entity) => void
  selectedNodeId?: string | null
}

export function KnowledgeGraphWrapper(props: KnowledgeGraphWrapperProps) {
  return <KnowledgeGraph {...props} />
}
