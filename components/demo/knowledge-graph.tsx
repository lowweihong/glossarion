'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { ZoomIn, ZoomOut, Maximize2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { GraphData, Entity, Relationship } from '@/lib/types'
import { ENTITY_COLORS, ENTITY_LABELS, getEntityColor } from '@/lib/types'

interface KnowledgeGraphProps {
  data: GraphData
  onNodeClick?: (node: Entity) => void
  selectedNodeId?: string | null
  newNodeIds?: Set<string>
}

interface GraphNode extends Entity {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

interface GraphLink extends Omit<Relationship, 'source' | 'target'> {
  source: string | GraphNode
  target: string | GraphNode
}

export function KnowledgeGraph({
  data,
  onNodeClick,
  selectedNodeId,
  newNodeIds = new Set(),
}: KnowledgeGraphProps) {
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink>>(null!)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (onNodeClick) {
        onNodeClick(node)
      }
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 500)
        graphRef.current.zoom(2, 500)
      }
    },
    [onNodeClick]
  )

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom * 1.5, 300)
    }
  }

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom()
      graphRef.current.zoom(currentZoom / 1.5, 300)
    }
  }

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50)
    }
  }

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name
      const fontSize = 12 / globalScale
      const nodeRadius = 8
      const isSelected = selectedNodeId === node.id
      const isHovered = hoveredNode?.id === node.id
      const isNew = newNodeIds.has(node.id)
      const color = getEntityColor(node.type)

      // Pulse ring for new nodes
      if (isNew) {
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + 4 + pulse * 6, 0, 2 * Math.PI)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5 / globalScale
        ctx.globalAlpha = 0.4 * (1 - pulse * 0.5)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      ctx.beginPath()
      ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      if (isSelected || isHovered) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = color
        ctx.lineWidth = 2 / globalScale
        ctx.globalAlpha = 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      if (globalScale > 0.8 || isSelected || isHovered) {
        ctx.font = `${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(label, node.x!, node.y! + nodeRadius + 4)
      }
    },
    [selectedNodeId, hoveredNode]
  )

  const linkCanvasObject = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = link.source as GraphNode
      const target = link.target as GraphNode
      if (!source.x || !source.y || !target.x || !target.y) return

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.strokeStyle = `rgba(100, 116, 139, ${0.3 + link.confidence * 0.4})`
      ctx.lineWidth = 1 + link.confidence * 2
      ctx.stroke()

      if (globalScale > 1.5) {
        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2
        const fontSize = 8 / globalScale
        ctx.font = `${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
        ctx.fillText(link.type, midX, midY)
      }
    },
    []
  )

  const graphData = {
    nodes: data.nodes as GraphNode[],
    links: data.links as GraphLink[],
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => setHoveredNode(node as GraphNode | null)}
        nodeRelSize={8}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleSpeed={0.005}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50)
          }
        }}
      />

      <div className="absolute right-4 top-4 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Zoom Out</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleFitView}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Fit to View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="absolute bottom-4 left-4 rounded-lg border border-border/50 bg-card/90 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Entity Types</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {Object.entries(ENTITY_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: ENTITY_COLORS[type as keyof typeof ENTITY_COLORS],
                }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {hoveredNode && (
        <div className="absolute left-4 top-4 max-w-xs rounded-lg border border-border/50 bg-card/90 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: ENTITY_COLORS[hoveredNode.type] }}
            />
            <span className="font-medium text-foreground">{hoveredNode.name}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {ENTITY_LABELS[hoveredNode.type]}
          </p>
          {hoveredNode.description && (
            <p className="mt-2 text-xs text-muted-foreground">
              {hoveredNode.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
