import { generateText, Output } from 'ai'
import * as z from 'zod'
import type { Entity, Relationship, EntityType } from './types'
import { generateMockExtraction } from './demo-data'

const entitySchema = z.object({
  name: z.string().describe('The name of the entity'),
  type: z
    .enum([
      'PERSON',
      'ORGANIZATION',
      'CONCEPT',
      'LOCATION',
      'EVENT',
      'PRODUCT',
      'TECHNOLOGY',
    ])
    .describe('The type of entity'),
  description: z
    .string()
    .nullable()
    .describe('A brief description of the entity'),
})

const relationshipSchema = z.object({
  sourceName: z.string().describe('Name of the source entity'),
  targetName: z.string().describe('Name of the target entity'),
  type: z.string().describe('The type of relationship (e.g., WORKS_AT, DEVELOPS, LOCATED_IN)'),
  description: z
    .string()
    .nullable()
    .describe('A brief description of the relationship'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0 to 1'),
})

const extractionSchema = z.object({
  entities: z.array(entitySchema).describe('List of extracted entities'),
  relationships: z
    .array(relationshipSchema)
    .describe('List of relationships between entities'),
})

export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}

export async function extractKnowledge(
  content: string,
  documentId: string
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  if (!isAIConfigured()) {
    const mock = generateMockExtraction(content)
    return {
      entities: mock.entities.map((e) => ({ ...e, documentId })),
      relationships: mock.relationships,
    }
  }

  try {
    const { output } = await generateText({
      model: 'openai/gpt-4o-mini',
      output: Output.object({
        schema: extractionSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a knowledge extraction system. Analyze the provided text and extract:
1. Entities: People, organizations, concepts, locations, events, products, and technologies mentioned
2. Relationships: How these entities are connected to each other

Be thorough but only extract entities that are clearly mentioned. Assign appropriate relationship types and confidence scores.`,
        },
        {
          role: 'user',
          content: `Extract entities and relationships from this text:\n\n${content}`,
        },
      ],
    })

    if (!output) {
      const mock = generateMockExtraction(content)
      return {
        entities: mock.entities.map((e) => ({ ...e, documentId })),
        relationships: mock.relationships,
      }
    }

    const entityMap = new Map<string, string>()
    const entities: Entity[] = output.entities.map((e, idx) => {
      const id = `e-${documentId}-${idx}`
      entityMap.set(e.name.toLowerCase(), id)
      return {
        id,
        name: e.name,
        type: e.type as EntityType,
        description: e.description || undefined,
        documentId,
      }
    })

    const relationships: Relationship[] = output.relationships
      .map((r, idx) => {
        const sourceId = entityMap.get(r.sourceName.toLowerCase())
        const targetId = entityMap.get(r.targetName.toLowerCase())

        if (!sourceId || !targetId) return null

        return {
          id: `r-${documentId}-${idx}`,
          source: sourceId,
          target: targetId,
          type: r.type,
          description: r.description || undefined,
          confidence: r.confidence,
        }
      })
      .filter((r): r is Relationship => r !== null)

    return { entities, relationships }
  } catch (error) {
    console.error('AI extraction error:', error)
    const mock = generateMockExtraction(content)
    return {
      entities: mock.entities.map((e) => ({ ...e, documentId })),
      relationships: mock.relationships,
    }
  }
}
