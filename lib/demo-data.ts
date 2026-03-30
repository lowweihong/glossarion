import type { Entity, Relationship, Document, GraphData } from './types'

export const demoDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'TechCorp Annual Report 2025.pdf',
    type: 'pdf',
    content:
      'TechCorp, led by CEO Sarah Chen, announced a strategic partnership with CloudScale Inc. The collaboration focuses on AI infrastructure development...',
    uploadedAt: '2026-03-28T10:00:00Z',
    status: 'completed',
  },
  {
    id: 'doc-2',
    name: 'Product Launch Notes.md',
    type: 'markdown',
    content:
      'The new DataFlow platform integrates machine learning capabilities with real-time analytics. Lead engineer Marcus Johnson presented the architecture...',
    uploadedAt: '2026-03-27T14:30:00Z',
    status: 'completed',
  },
]

export const demoEntities: Entity[] = [
  {
    id: 'e1',
    name: 'TechCorp',
    type: 'ORGANIZATION',
    description:
      'Leading technology company specializing in enterprise software solutions',
    documentId: 'doc-1',
  },
  {
    id: 'e2',
    name: 'Sarah Chen',
    type: 'PERSON',
    description: 'CEO of TechCorp with 15 years of industry experience',
    documentId: 'doc-1',
  },
  {
    id: 'e3',
    name: 'CloudScale Inc',
    type: 'ORGANIZATION',
    description: 'Cloud infrastructure provider',
    documentId: 'doc-1',
  },
  {
    id: 'e4',
    name: 'AI Infrastructure',
    type: 'CONCEPT',
    description: 'Computing infrastructure optimized for AI workloads',
    documentId: 'doc-1',
  },
  {
    id: 'e5',
    name: 'Strategic Partnership',
    type: 'EVENT',
    description: 'Business collaboration between TechCorp and CloudScale',
    documentId: 'doc-1',
  },
  {
    id: 'e6',
    name: 'DataFlow',
    type: 'PRODUCT',
    description:
      'Real-time analytics platform with ML capabilities',
    documentId: 'doc-2',
  },
  {
    id: 'e7',
    name: 'Marcus Johnson',
    type: 'PERSON',
    description: 'Lead engineer at TechCorp',
    documentId: 'doc-2',
  },
  {
    id: 'e8',
    name: 'Machine Learning',
    type: 'TECHNOLOGY',
    description: 'AI subset focused on pattern recognition and prediction',
    documentId: 'doc-2',
  },
  {
    id: 'e9',
    name: 'Real-time Analytics',
    type: 'CONCEPT',
    description: 'Processing and analyzing data as it arrives',
    documentId: 'doc-2',
  },
  {
    id: 'e10',
    name: 'San Francisco',
    type: 'LOCATION',
    description: 'TechCorp headquarters location',
    documentId: 'doc-1',
  },
]

export const demoRelationships: Relationship[] = [
  {
    id: 'r1',
    source: 'e2',
    target: 'e1',
    type: 'LEADS',
    description: 'Sarah Chen is the CEO of TechCorp',
    confidence: 0.95,
  },
  {
    id: 'r2',
    source: 'e1',
    target: 'e3',
    type: 'PARTNERS_WITH',
    description: 'TechCorp partners with CloudScale Inc',
    confidence: 0.92,
  },
  {
    id: 'r3',
    source: 'e5',
    target: 'e4',
    type: 'FOCUSES_ON',
    description: 'Partnership focuses on AI infrastructure',
    confidence: 0.88,
  },
  {
    id: 'r4',
    source: 'e1',
    target: 'e6',
    type: 'DEVELOPS',
    description: 'TechCorp develops DataFlow platform',
    confidence: 0.9,
  },
  {
    id: 'r5',
    source: 'e7',
    target: 'e6',
    type: 'ARCHITECTS',
    description: 'Marcus Johnson leads DataFlow development',
    confidence: 0.85,
  },
  {
    id: 'r6',
    source: 'e6',
    target: 'e8',
    type: 'USES',
    description: 'DataFlow integrates machine learning',
    confidence: 0.93,
  },
  {
    id: 'r7',
    source: 'e6',
    target: 'e9',
    type: 'ENABLES',
    description: 'DataFlow enables real-time analytics',
    confidence: 0.91,
  },
  {
    id: 'r8',
    source: 'e1',
    target: 'e10',
    type: 'LOCATED_IN',
    description: 'TechCorp is headquartered in San Francisco',
    confidence: 0.97,
  },
  {
    id: 'r9',
    source: 'e7',
    target: 'e1',
    type: 'WORKS_AT',
    description: 'Marcus Johnson works at TechCorp',
    confidence: 0.94,
  },
  {
    id: 'r10',
    source: 'e3',
    target: 'e4',
    type: 'PROVIDES',
    description: 'CloudScale provides AI infrastructure services',
    confidence: 0.86,
  },
]

export const demoGraphData: GraphData = {
  nodes: demoEntities,
  links: demoRelationships,
}

export function generateMockExtraction(content: string): {
  entities: Entity[]
  relationships: Relationship[]
} {
  const words = content.split(/\s+/)
  const entities: Entity[] = []
  const relationships: Relationship[] = []

  const entityTypes: Entity['type'][] = [
    'PERSON',
    'ORGANIZATION',
    'CONCEPT',
    'TECHNOLOGY',
    'PRODUCT',
  ]

  const capitalizedWords = words.filter((w) => /^[A-Z][a-z]+/.test(w))
  const uniqueWords = [...new Set(capitalizedWords)].slice(0, 6)

  uniqueWords.forEach((word, idx) => {
    entities.push({
      id: `new-e${idx}`,
      name: word,
      type: entityTypes[idx % entityTypes.length],
      description: `Extracted from uploaded document`,
      documentId: 'new-doc',
    })
  })

  for (let i = 0; i < entities.length - 1; i++) {
    relationships.push({
      id: `new-r${i}`,
      source: entities[i].id,
      target: entities[i + 1].id,
      type: 'RELATED_TO',
      description: 'Relationship extracted from document context',
      confidence: 0.7 + Math.random() * 0.25,
    })
  }

  return { entities, relationships }
}
