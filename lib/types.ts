export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'CONCEPT'
  | 'LOCATION'
  | 'EVENT'
  | 'PRODUCT'
  | 'TECHNOLOGY'

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

export const ENTITY_COLORS: Record<EntityType, string> = {
  PERSON: '#3b82f6',
  ORGANIZATION: '#22c55e',
  CONCEPT: '#a855f7',
  LOCATION: '#f97316',
  EVENT: '#ec4899',
  PRODUCT: '#06b6d4',
  TECHNOLOGY: '#eab308',
}

export const ENTITY_LABELS: Record<EntityType, string> = {
  PERSON: 'Person',
  ORGANIZATION: 'Organization',
  CONCEPT: 'Concept',
  LOCATION: 'Location',
  EVENT: 'Event',
  PRODUCT: 'Product',
  TECHNOLOGY: 'Technology',
}
