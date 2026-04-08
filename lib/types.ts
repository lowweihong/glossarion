export type EntityType = string

export interface Ontology {
  entityTypes: string[]
  relationTypes: string[]
}

export interface Entity {
  id: string
  name: string
  type: EntityType
  description?: string
  documentId: string
  createdAt?: string
}

export interface Relationship {
  id: string
  source: string
  target: string
  type: string
  description?: string
  confidence: number
}

export interface Document {
  id: string
  name: string
  type: 'pdf' | 'text' | 'markdown'
  content: string
  uploadedAt: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export interface GraphData {
  nodes: Entity[]
  links: Relationship[]
}

export interface ExtractedKnowledge {
  entities: Omit<Entity, 'id' | 'documentId' | 'createdAt'>[]
  relationships: Omit<Relationship, 'id'>[]
}

export interface InsightStats {
  totalEntities: number
  totalRelationships: number
  entitiesByType: Record<EntityType, number>
  mostConnectedEntities: Array<{
    entity: Entity
    connectionCount: number
  }>
  recentDocuments: Document[]
}

const BASE_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f97316',
  '#ec4899', '#06b6d4', '#eab308', '#ef4444',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#84cc16',
]

const colorCache = new Map<string, string>()

export function getEntityColor(type: string): string {
  if (!colorCache.has(type)) {
    let hash = 0
    for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash)
    colorCache.set(type, BASE_COLORS[Math.abs(hash) % BASE_COLORS.length])
  }
  return colorCache.get(type)!
}

// Keep for backwards compat
export const ENTITY_COLORS: Record<string, string> = {
  PERSON: '#3b82f6',
  ORGANIZATION: '#22c55e',
  CONCEPT: '#a855f7',
  LOCATION: '#f97316',
  EVENT: '#ec4899',
  PRODUCT: '#06b6d4',
  TECHNOLOGY: '#eab308',
}

export const ENTITY_LABELS: Record<string, string> = {
  PERSON: 'Person',
  ORGANIZATION: 'Organization',
  CONCEPT: 'Concept',
  LOCATION: 'Location',
  EVENT: 'Event',
  PRODUCT: 'Product',
  TECHNOLOGY: 'Technology',
}
