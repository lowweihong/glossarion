import { expandWithWeb, isTavilyConfigured, type ExpansionEvent } from '@/lib/expander'
import type { Entity, Ontology } from '@/lib/types'

export async function POST(request: Request) {
  const body = await request.json() as {
    entities: Entity[]
    ontology?: Ontology
    maxEntities?: number
  }

  const { entities, ontology, maxEntities } = body

  if (!entities || entities.length === 0) {
    return new Response(JSON.stringify({ error: 'No entities provided' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        send({
          type: 'status',
          step: 'expansion',
          status: 'processing',
          message: `Starting web expansion for ${Math.min(entities.length, maxEntities ?? 5)} entities...`,
          usingTavily: isTavilyConfigured(),
        })

        if (!isTavilyConfigured()) {
          // Emit mock expansion data so UI still demonstrates the feature
          send({ type: 'status', step: 'expansion', status: 'processing', message: 'No TAVILY_API_KEY — using mock expansion data' })
          await simulateMockExpansion(entities, send)
        } else {
          await expandWithWeb(
            entities,
            (event: ExpansionEvent) => {
              switch (event.type) {
                case 'searching':
                  send({ type: 'log', subtype: 'web', message: event.message })
                  break
                case 'entity':
                  send({ type: 'entity', entity: event.entity })
                  break
                case 'relationship':
                  send({ type: 'relationship', relationship: event.relationship })
                  break
                case 'entity_done':
                  send({ type: 'log', subtype: 'web', message: event.message })
                  break
                case 'complete':
                  send({
                    type: 'status',
                    step: 'expansion',
                    status: 'complete',
                    message: event.message,
                  })
                  send({
                    type: 'complete',
                    totalEntities: event.totalEntities,
                    totalRelationships: event.totalRelationships,
                  })
                  break
                case 'error':
                  send({ type: 'error', message: event.message })
                  break
              }
            },
            { ontology, maxEntities }
          )
        }
      } catch (error) {
        console.error('Expand route error:', error)
        send({ type: 'error', message: String(error) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/**
 * Generates plausible-looking mock expansion data when Tavily is not configured.
 * Each entity gets 1–2 related entities with relationships.
 */
async function simulateMockExpansion(
  entities: Entity[],
  send: (data: object) => void
): Promise<void> {
  const mockRelations: Record<string, { names: string[]; rel: string }> = {
    PERSON:       { names: ['Stanford University', 'MIT'], rel: 'AFFILIATED_WITH' },
    ORGANIZATION: { names: ['Annual Conference', 'Industry Report'], rel: 'PUBLISHES' },
    CONCEPT:      { names: ['Research Framework', 'Applied Theory'], rel: 'LEADS_TO' },
    LOCATION:     { names: ['Regional Hub', 'Local Agency'], rel: 'CONTAINS' },
    TECHNOLOGY:   { names: ['Open Source Community', 'Patent Portfolio'], rel: 'USED_BY' },
    EVENT:        { names: ['Follow-up Workshop', 'Policy Brief'], rel: 'RESULTS_IN' },
    PRODUCT:      { names: ['Competitor Product', 'Industry Standard'], rel: 'COMPETES_WITH' },
  }

  let globalIdx = 0
  const toExpand = entities.slice(0, 5)

  for (const focal of toExpand) {
    send({ type: 'log', subtype: 'web', message: `Searching web for: ${focal.name}...` })
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 300))

    const template = mockRelations[focal.type] ?? { names: ['Related Concept', 'Related Entity'], rel: 'RELATES_TO' }
    const newName = template.names[globalIdx % template.names.length] + ` (${focal.name.split(' ')[0]})`

    const newEntity: Entity = {
      id: `web-mock-${focal.id}-${globalIdx}`,
      name: newName,
      type: focal.type,
      description: `Web-sourced entity related to ${focal.name}`,
      documentId: `web-${focal.id}`,
      source: 'web',
    }
    send({ type: 'entity', entity: newEntity })
    send({
      type: 'relationship',
      relationship: {
        id: `web-mock-rel-${focal.id}-${globalIdx}`,
        source: focal.id,
        target: newEntity.id,
        type: template.rel,
        confidence: 0.7,
      },
    })
    send({ type: 'log', subtype: 'web', message: `+ 1 new entity found for ${focal.name}` })
    globalIdx++
  }

  const totalNew = toExpand.length
  send({
    type: 'status',
    step: 'expansion',
    status: 'complete',
    message: `Web expansion complete (mock) — ${totalNew} new entities`,
  })
  send({ type: 'complete', totalEntities: totalNew, totalRelationships: totalNew })
}
