'use client'

import { BarChart3, Users, Link2, TrendingUp } from 'lucide-react'
import type { InsightStats } from '@/lib/types'
import { ENTITY_COLORS, ENTITY_LABELS, type EntityType } from '@/lib/types'

interface InsightsPanelProps {
  insights: InsightStats
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const topTypes = Object.entries(insights.entitiesByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <BarChart3 className="h-4 w-4" />
        Quick Insights
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">Entities</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {insights.totalEntities}
          </p>
        </div>
        <div className="rounded-lg bg-secondary/50 p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" />
            <span className="text-xs">Relations</span>
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">
            {insights.totalRelationships}
          </p>
        </div>
      </div>

      {topTypes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Entity Distribution
          </p>
          <div className="space-y-2">
            {topTypes.map(([type, count]) => {
              const percentage = Math.round(
                (count / insights.totalEntities) * 100
              )
              return (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        ENTITY_COLORS[type as EntityType] || '#888',
                    }}
                  />
                  <span className="flex-1 text-xs text-muted-foreground">
                    {ENTITY_LABELS[type as EntityType] || type}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {count}
                  </span>
                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          ENTITY_COLORS[type as EntityType] || '#888',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {insights.mostConnectedEntities.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Top Connected
          </p>
          <div className="space-y-1.5">
            {insights.mostConnectedEntities.slice(0, 3).map(({ entity, connectionCount }) => (
              <div
                key={entity.id}
                className="flex items-center justify-between rounded-md bg-secondary/30 px-2 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ENTITY_COLORS[entity.type] }}
                  />
                  <span className="text-xs text-foreground">{entity.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {connectionCount} links
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
