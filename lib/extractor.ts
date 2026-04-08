import { generateObject } from 'ai'
import { createGroq } from '@ai-sdk/groq'
import * as z from 'zod'
import type { Entity, Relationship, Ontology } from './types'
import { generateMockExtraction } from './demo-data'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

export function isAIConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}

export async function generateOntology(content: string): Promise<Ontology> {
  if (!isAIConfigured()) {
    return {
      entityTypes: ['PERSON', 'ORGANIZATION', 'CONCEPT', 'LOCATION', 'EVENT', 'PRODUCT', 'TECHNOLOGY'],
      relationTypes: ['RELATES_TO', 'WORKS_AT', 'LOCATED_IN', 'PART_OF'],
    }
  }

  const ontologySchema = z.object({
    entityTypes: z.array(z.string()).min(3).max(12)
      .describe('Domain-specific entity type names in UPPER_CASE (e.g. PROFESSOR, UNIVERSITY, POLICY)'),
    relationTypes: z.array(z.string()).min(3).max(15)
      .describe('Domain-specific relationship type names in UPPER_CASE (e.g. TEACHES_AT, AFFILIATED_WITH, OPPOSES)'),
  })

  try {
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: ontologySchema,
      messages: [
        {
          role: 'system',
          content: 'Generate a domain-specific ontology for the given document. Entity and relation types must be highly specific to the document\'s domain. Use UPPER_CASE_WITH_UNDERSCORES format.',
        },
        {
          role: 'user',
          content: `Analyze this document and generate appropriate entity types and relationship types:\n\n${content.slice(0, 3000)}`,
        },
      ],
    })
    return {
      entityTypes: object.entityTypes.map(t => t.toUpperCase().replace(/\s+/g, '_')),
      relationTypes: object.relationTypes.map(t => t.toUpperCase().replace(/\s+/g, '_')),
    }
  } catch {
    return {
      entityTypes: ['PERSON', 'ORGANIZATION', 'CONCEPT', 'LOCATION', 'EVENT', 'PRODUCT', 'TECHNOLOGY'],
      relationTypes: ['RELATES_TO', 'WORKS_AT', 'LOCATED_IN', 'PART_OF'],
    }
  }
}

export async function extractKnowledge(
  content: string,
  documentId: string,
  ontology?: Ontology
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  if (!isAIConfigured()) {
    const mock = generateMockExtraction(content)
    return {
      entities: mock.entities.map((e) => ({ ...e, documentId })),
      relationships: mock.relationships,
    }
  }

  const entityTypes = ontology?.entityTypes ?? ['PERSON', 'ORGANIZATION', 'CONCEPT', 'LOCATION', 'EVENT', 'PRODUCT', 'TECHNOLOGY']
  const relationTypes = ontology?.relationTypes

  const extractionSchema = z.object({
    entities: z.array(z.object({
      name: z.string(),
      type: z.string().describe(`One of: ${entityTypes.join(', ')}`),
      description: z.string().nullable(),
    })),
    relationships: z.array(z.object({
      sourceName: z.string(),
      targetName: z.string(),
      type: z.string().describe(relationTypes ? `One of: ${relationTypes.join(', ')}` : 'Relationship type in UPPER_SNAKE_CASE'),
      description: z.string().nullable(),
      confidence: z.number().min(0).max(1),
    })),
  })

  try {
    const { object: output } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: extractionSchema,
      messages: [
        {
          role: 'system',
          content: `Extract entities and relationships from the text.
Entity types: ${entityTypes.join(', ')}
${relationTypes ? `Relationship types: ${relationTypes.join(', ')}` : ''}
Only extract entities clearly mentioned. Be thorough.`,
        },
        {
          role: 'user',
          content: `Extract entities and relationships:\n\n${content}`,
        },
      ],
    })

    const entityMap = new Map<string, string>()
    const entities: Entity[] = output.entities.map((e, idx) => {
      const id = `e-${documentId}-${idx}`
      entityMap.set(e.name.toLowerCase(), id)
      return {
        id,
        name: e.name,
        type: e.type.toUpperCase().replace(/\s+/g, '_'),
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
    console.error('Extraction error:', error)
    const mock = generateMockExtraction(content)
    return {
      entities: mock.entities.map((e) => ({ ...e, documentId })),
      relationships: mock.relationships,
    }
  }
}
