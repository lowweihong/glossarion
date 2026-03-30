'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, File, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onUpload: (files: File[]) => void
  isProcessing: boolean
}

const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
}

export function UploadZone({ onUpload, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = []
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      const ext = file.name.toLowerCase().split('.').pop()
      if (ext === 'pdf' || ext === 'txt' || ext === 'md') {
        validFiles.push(file)
      }
    }

    if (validFiles.length === 0 && fileArray.length > 0) {
      setError('Please upload PDF, TXT, or MD files only.')
    } else {
      setError(null)
    }

    return validFiles
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (isProcessing) return

      const files = validateFiles(e.dataTransfer.files)
      if (files.length > 0) {
        onUpload(files)
      }
    },
    [onUpload, isProcessing]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isProcessing || !e.target.files) return

      const files = validateFiles(e.target.files)
      if (files.length > 0) {
        onUpload(files)
      }
      e.target.value = ''
    },
    [onUpload, isProcessing]
  )

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-secondary/50',
          isProcessing && 'pointer-events-none opacity-50'
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isProcessing}
        />

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
          <Upload className="h-7 w-7 text-primary" />
        </div>

        <p className="mb-2 text-center text-sm font-medium text-foreground">
          {isProcessing ? 'Processing...' : 'Drag & drop files here'}
        </p>
        <p className="mb-4 text-center text-xs text-muted-foreground">
          or click to browse
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-1">
            <File className="h-3.5 w-3.5" />
            <span>TXT</span>
          </div>
          <div className="flex items-center gap-1">
            <File className="h-3.5 w-3.5" />
            <span>MD</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
