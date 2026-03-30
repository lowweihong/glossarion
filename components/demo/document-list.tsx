'use client'

import { FileText, File, CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Document } from '@/lib/types'

interface DocumentListProps {
  documents: Document[]
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'text-muted-foreground',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    className: 'text-primary animate-spin',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    className: 'text-chart-2',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    className: 'text-destructive',
  },
}

const typeIcons = {
  pdf: FileText,
  text: File,
  markdown: File,
}

export function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No documents uploaded yet
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const status = statusConfig[doc.status]
        const StatusIcon = status.icon
        const TypeIcon = typeIcons[doc.type]

        return (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 transition-colors hover:bg-card"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {doc.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <StatusIcon className={cn('h-4 w-4', status.className)} />
              <span className="text-xs text-muted-foreground">
                {status.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
