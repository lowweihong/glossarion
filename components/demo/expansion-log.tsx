'use client'

import { useEffect, useRef } from 'react'

export interface LogEntry {
  id: string
  message: string
  type: 'info' | 'entity' | 'relationship' | 'web' | 'complete' | 'error'
  timestamp: Date
}

export function ExpansionLog({ entries }: { entries: LogEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  if (entries.length === 0) return null

  const colors: Record<LogEntry['type'], string> = {
    info: 'text-muted-foreground',
    entity: 'text-primary',
    relationship: 'text-chart-2',
    web: 'text-chart-3',
    complete: 'text-green-400',
    error: 'text-destructive',
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Log</p>
      <div className="font-mono text-xs space-y-0.5 max-h-28 overflow-y-auto scrollbar-hide">
        {entries.map((entry) => (
          <div key={entry.id} className={`${colors[entry.type]} leading-relaxed flex gap-2`}>
            <span className="text-muted-foreground/40 shrink-0 tabular-nums">
              {entry.timestamp.toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span>{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
