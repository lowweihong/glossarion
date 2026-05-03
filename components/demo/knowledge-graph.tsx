'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import { ZoomIn, ZoomOut, Maximize2, Info, Download, FileJson } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { GraphData, Entity, Relationship } from '@/lib/types'
import { getEntityColor } from '@/lib/types'

interface KnowledgeGraphProps {
  data: GraphData
  onNodeClick?: (node: Entity) => void
  selectedNodeId?: string | null
  newNodeIds?: Set<string>
  webNodeIds?: Set<string>
  hiddenTypes?: Set<string>
  searchTerm?: string
  colorByDocument?: boolean
  documentColorMap?: Map<string, string>
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
  webNodeIds = new Set(),
  hiddenTypes = new Set(),
  searchTerm = '',
  colorByDocument = false,
  documentColorMap,
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
      if (hiddenTypes.has(node.type)) return
      if (onNodeClick) onNodeClick(node)
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 500)
        graphRef.current.zoom(2, 500)
      }
    },
    [onNodeClick, hiddenTypes]
  )

  const handleZoomIn = () => {
    if (graphRef.current) graphRef.current.zoom(graphRef.current.zoom() * 1.5, 300)
  }
  const handleZoomOut = () => {
    if (graphRef.current) graphRef.current.zoom(graphRef.current.zoom() / 1.5, 300)
  }
  const handleFitView = () => {
    if (graphRef.current) graphRef.current.zoomToFit(400, 50)
  }

  const handleExportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ nodes: data.nodes, links: data.links }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge-graph.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPNG = () => {
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'knowledge-graph.png'
    a.click()
  }

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (hiddenTypes.has(node.type)) return

      const isSearchActive = searchTerm.length > 0
      const isMatch = isSearchActive && node.name.toLowerCase().includes(searchTerm.toLowerCase())
      const isDimmed = isSearchActive && !isMatch

      const label = node.name
      const fontSize = 12 / globalScale
      const nodeRadius = 8
      const isSelected = selectedNodeId === node.id
      const isHovered = hoveredNode?.id === node.id
      const isNew = newNodeIds.has(node.id)
      const isWeb = webNodeIds.has(node.id) || node.source === 'web'

      const color =
        colorByDocument && documentColorMap?.has(node.documentId)
          ? documentColorMap.get(node.documentId)!
          : getEntityColor(node.type)

      // Search match glow
      if (isMatch) {
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + 8, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(250, 204, 21, 0.12)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()
      }

      // Pulse ring for new nodes
      if (isNew && !isDimmed) {
        const pulse = (Math.sin(Date.now() / 200) + 1) / 2
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + 4 + pulse * 6, 0, 2 * Math.PI)
        ctx.strokeStyle = isWeb ? '#06b6d4' : color
        ctx.lineWidth = 1.5 / globalScale
        ctx.globalAlpha = 0.4 * (1 - pulse * 0.5)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Main node fill
      ctx.beginPath()
      ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.globalAlpha = isDimmed ? 0.15 : isWeb ? 0.75 : 1
      ctx.fill()
      ctx.globalAlpha = 1

      // Web dashed ring
      if (isWeb && !isDimmed) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + 3, 0, 2 * Math.PI)
        ctx.setLineDash([3 / globalScale, 2 / globalScale])
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 1.5 / globalScale
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      // Selection / hover ring
      if ((isSelected || isHovered) && !isDimmed) {
        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2 / globalScale
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(node.x!, node.y!, nodeRadius + (isWeb ? 6 : 4), 0, 2 * Math.PI)
        ctx.strokeStyle = color
        ctx.lineWidth = 2 / globalScale
        ctx.globalAlpha = 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Label
      if (!isDimmed && (globalScale > 0.8 || isSelected || isHovered)) {
        ctx.font = `${fontSize}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = isMatch ? '#fbbf24' : isWeb ? '#67e8f9' : '#ffffff'
        ctx.fillText(label, node.x!, node.y! + nodeRadius + (isWeb ? 7 : 4))
      }
    },
    [selectedNodeId, hoveredNode, newNodeIds, webNodeIds, hiddenTypes, searchTerm, colorByDocument, documentColorMap]
  )

  const linkCanvasObject = useCallback(
    (link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const source = link.source as GraphNode
      const target = link.target as GraphNode
      if (!source.x || !source.y || !target.x || !target.y) return
      if (hiddenTypes.has(source.type) || hiddenTypes.has(target.type)) return

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
    [hiddenTypes]
  )

  const fgData = {
    nodes: data.nodes as GraphNode[],
    links: data.links as GraphLink[],
  }

  const activeTypes = [...new Set(data.nodes.filter((n) => !hiddenTypes.has(n.type)).map((n) => n.type))]

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={fgData}
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
          if (graphRef.current) graphRef.current.zoomToFit(400, 50)
        }}
      />

      {/* Zoom + Export controls */}
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleExportPNG}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Export PNG</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="icon" onClick={handleExportJSON}>
                <FileJson className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Export JSON</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-lg border border-border/50 bg-card/90 p-3 backdrop-blur-sm max-w-[180px]">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Legend</span>
        </div>
        {activeTypes.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {activeTypes.slice(0, 8).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: colorByDocument ? '#888' : getEntityColor(type) }}
                />
                <span className="text-xs text-muted-foreground truncate">{type}</span>
              </div>
            ))}
          </div>
        )}
        <div className="pt-2 border-t border-border/40 space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            <span className="text-xs text-muted-foreground">Document</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full border border-dashed border-cyan-400 bg-slate-400/50" />
            <span className="text-xs text-cyan-400">Web expanded</span>
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredNode && !hiddenTypes.has(hoveredNode.type) && (
        <div className="absolute left-4 top-4 max-w-xs rounded-lg border border-border/50 bg-card/90 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor:
                  colorByDocument && documentColorMap?.has(hoveredNode.documentId)
                    ? documentColorMap.get(hoveredNode.documentId)
                    : getEntityColor(hoveredNode.type),
              }}
            />
            <span className="font-medium text-foreground">{hoveredNode.name}</span>
            {hoveredNode.source === 'web' && (
              <span className="ml-1 rounded px-1 py-0.5 text-[10px] font-medium border border-dashed border-cyan-400 text-cyan-400">
                web
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{hoveredNode.type}</p>
          {hoveredNode.description && (
            <p className="mt-2 text-xs text-muted-foreground">{hoveredNode.description}</p>
          )}
        </div>
      )}
    </div>
  )
}
