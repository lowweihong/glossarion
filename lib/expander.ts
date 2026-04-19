import { generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import * as z from 'zod'
import type { Entity, Relationship, Ontology } from './types'

const client = createOpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
})

export function isTavilyConfigured(): boolean {
  return !!process.env.TAVILY_API_KEY
}

interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  results: TavilySearchResult[]
}

async function searchTavily(query: string, maxResults = 5): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: false,
      }),
    })

    if (!res.ok) {
      console.error(`Tavily search failed: ${res.status} ${res.statusText}`)
      return []
    }

    const data: TavilyResponse = await res.json()
    return data.results ?? []
  } catch (err) {
    console.error('Tavily fetch error:', err)
    return []
  }
}

const expansionSchema = z.object({
  newEntities: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string().nullable(),
  })),
  newRelationships: z.array(z.object({
    sourceName: z.string().describe('Name of source entity (may be the focal entity or a new entity)'),
    targetName: z.string().describe('Name of target entity (may be the focal entity or a new entity)'),
    type: z.string().describe('Relationship type in UPPER_SNAKE_CASE'),
    confidence: z.number().min(0).max(1),
  })),
})

async function extractFromSearchResults(
  focalEntity: Entity,
  searchResults: TavilySearchResult[],
  ontology?: Ontology,
  existingEntityNames?: Set<string>
): Promise<{ newEntities: Omit<Entity, 'id' | 'documentId'>[], newRelationships: Omit<Relationship, 'id'>[] }> {
  if (searchResults.length === 0) return { newEntities: [], newRelationships: [] }

  const entityTypes = ontology?.entityTypes ?? ['PERSON', 'ORGANIZATION', 'CONCEPT', 'LOCATION', 'EVENT', 'PRODUCT', 'TECHNOLOGY']
  const combinedText = searchResults
    .slice(0, 3)
    .map((r) => `[${r.title}]\n${r.content}`)
    .join('\n\n')
    .slice(0, 4000)

  try {
    const { object } = await generateObject({
      model: client(process.env.AI_MODEL ?? 'claude-sonnet-4-6'),
      schema: expansionSchema,
      messages: [
        {
          role: 'system',
          content: `You are expanding a knowledge graph node via web search results.
Focal entity: "${focalEntity.name}" (type: ${focalEntity.type})
Entity types available: ${entityTypes.join(', ')}

Extract NEW entities and relationships found in the search results that are related to the focal entity.
Only include entities NOT already in: ${[...(existingEntityNames ?? [])].slice(0, 20).join(', ')}
Focus on high-quality, factually grounded entities. Limit to 5 new entities max.`,
        },
        {
          role: 'user',
          content: `Web search results for "${focalEntity.name}":\n\n${combinedText}`,
        },
      ],
    })

    const docId = `web-${focalEntity.id}`

    const newEntities: Omit<Entity, 'id' | 'documentId'>[] = object.newEntities
      .filter((e) => !existingEntityNames?.has(e.name.toLowerCase()))
      .map((e) => ({
        name: e.name,
        type: e.type.toUpperCase().replace(/\s+/g, '_'),
        description: e.description || undefined,
        source: 'web' as const,
      }))

    // Build a local name→id map including the focal entity
    const nameToId = new Map<string, string>()
    nameToId.set(focalEntity.name.toLowerCase(), focalEntity.id)
    newEntities.forEach((e, i) => {
      nameToId.set(e.name.toLowerCase(), `${docId}-${i}`)
    })

    const newRelationships: Omit<Relationship, 'id'>[] = object.newRelationships
      .map((r) => {
        const sourceId = nameToId.get(r.sourceName.toLowerCase())
        const targetId = nameToId.get(r.targetName.toLowerCase())
        if (!sourceId || !targetId) return null
        return {
          source: sourceId,
          target: targetId,
          type: r.type,
          confidence: r.confidence,
        }
      })
      .filter(Boolean) as Omit<Relationship, 'id'>[]

    return { newEntities, newRelationships }
  } catch (err) {
    console.error('Expansion extraction error:', err)
    return { newEntities: [], newRelationships: [] }
  }
}

export interface ExpansionEvent {
  type: 'searching' | 'entity' | 'relationship' | 'entity_done' | 'complete' | 'error'
  entityName?: string
  entity?: Entity
  relationship?: Omit<Relationship, 'id'>
  newCount?: number
  totalEntities?: number
  totalRelationships?: number
  message?: string
}

/**
 * Expand the graph by searching the web for each of the provided entities.
 * Calls onEvent for each expansion event so callers can stream results.
 */
export async function expandWithWeb(
  entities: Entity[],
  onEvent: (event: ExpansionEvent) => void,
  options?: {
    ontology?: Ontology
    maxEntities?: number  // max entities to expand (default 5)
  }
): Promise<void> {
  const { ontology, maxEntities = 5 } = options ?? {}

  // Pick top entities to expand (prefer higher-degree / first N)
  const entitiesToExpand = entities.slice(0, maxEntities)
  const existingEntityNames = new Set(entities.map((e) => e.name.toLowerCase()))

  let totalNewEntities = 0
  let totalNewRelationships = 0
  let entityIndexOffset = 0

  for (const focalEntity of entitiesToExpand) {
    onEvent({ type: 'searching', entityName: focalEntity.name, message: `Searching web for: ${focalEntity.name}...` })

    const searchResults = await searchTavily(`${focalEntity.name} overview facts`)
    if (searchResults.length === 0) {
      onEvent({ type: 'searching', entityName: focalEntity.name, message: `No results for ${focalEntity.name}, skipping` })
      continue
    }

    const { newEntities, newRelationships } = await extractFromSearchResults(
      focalEntity,
      searchResults,
      ontology,
      existingEntityNames
    )

    const docId = `web-${focalEntity.id}`

    // Emit new entities
    for (let i = 0; i < newEntities.length; i++) {
      const entity: Entity = {
        ...newEntities[i],
        id: `${docId}-${entityIndexOffset + i}`,
        documentId: docId,
        source: 'web',
      }
      existingEntityNames.add(entity.name.toLowerCase())
      onEvent({ type: 'entity', entity })
      totalNewEntities++
    }

    // Emit new relationships (fix IDs now that we have them)
    const nameToId = new Map<string, string>()
    nameToId.set(focalEntity.name.toLowerCase(), focalEntity.id)
    for (let i = 0; i < newEntities.length; i++) {
      nameToId.set(newEntities[i].name.toLowerCase(), `${docId}-${entityIndexOffset + i}`)
    }

    for (let i = 0; i < newRelationships.length; i++) {
      const rel: Relationship = {
        ...newRelationships[i],
        id: `${docId}-rel-${entityIndexOffset}-${i}`,
        source: newRelationships[i].source,
        target: newRelationships[i].target,
      }
      onEvent({ type: 'relationship', relationship: rel })
      totalNewRelationships++
    }

    entityIndexOffset += newEntities.length

    onEvent({
      type: 'entity_done',
      entityName: focalEntity.name,
      newCount: newEntities.length,
      message: `+ ${newEntities.length} new entities found for ${focalEntity.name}`,
    })
  }

  onEvent({
    type: 'complete',
    totalEntities: totalNewEntities,
    totalRelationships: totalNewRelationships,
    message: `Web expansion complete — ${totalNewEntities} new entities, ${totalNewRelationships} new relationships`,
  })
}
