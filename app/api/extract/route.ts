import { parseDocument, chunkText } from '@/lib/parser'
import { extractKnowledge, generateOntology, isAIConfigured } from '@/lib/extractor'
import { createDocument, createEntity, createRelationship, updateDocumentStatus, isNeo4jConfigured } from '@/lib/neo4j'
import type { Document } from '@/lib/types'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const documentId = formData.get('documentId') as string

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // Step 1: Parse
        send({ type: 'status', step: 'parsing', status: 'processing', message: 'Reading document...' })
        const { content, type } = await parseDocument(file)

        const document: Document = {
          id: documentId,
          name: file.name,
          type,
          content: content.slice(0, 10000),
          uploadedAt: new Date().toISOString(),
          status: 'processing',
        }
        if (isNeo4jConfigured()) await createDocument(document)
        send({ type: 'status', step: 'parsing', status: 'complete', message: `Read ${Math.round(content.length / 1000)}k characters` })

        // Step 2: Ontology
        send({ type: 'status', step: 'ontology', status: 'processing', message: 'Generating ontology...' })
        const ontology = await generateOntology(content)
        send({ type: 'ontology', entityTypes: ontology.entityTypes, relationTypes: ontology.relationTypes })
        send({ type: 'status', step: 'ontology', status: 'complete', message: `${ontology.entityTypes.length} entity types · ${ontology.relationTypes.length} relation types` })

        // Step 3: Extract
        const chunks = chunkText(content)
        const totalChunks = Math.min(chunks.length, 3)
        send({ type: 'status', step: 'extraction', status: 'processing', message: `Extracting from ${totalChunks} chunk${totalChunks > 1 ? 's' : ''}...` })

        const seenEntities = new Map<string, string>()
        let entityCount = 0
        let relCount = 0

        for (let i = 0; i < totalChunks; i++) {
          send({ type: 'progress', chunk: i + 1, total: totalChunks, message: `Processing chunk ${i + 1} of ${totalChunks}...` })

          const { entities, relationships } = await extractKnowledge(chunks[i], documentId, ontology)

          for (const entity of entities) {
            if (!seenEntities.has(entity.name.toLowerCase())) {
              seenEntities.set(entity.name.toLowerCase(), entity.id)
              send({ type: 'entity', entity })
              entityCount++
              if (isNeo4jConfigured()) await createEntity(entity)
            }
          }

          for (const rel of relationships) {
            send({ type: 'relationship', relationship: rel })
            relCount++
            if (isNeo4jConfigured()) await createRelationship(rel)
          }
        }

        if (isNeo4jConfigured()) await updateDocumentStatus(documentId, 'completed')

        send({ type: 'status', step: 'extraction', status: 'complete', message: `Found ${entityCount} entities · ${relCount} relationships` })
        send({ type: 'complete', entityCount, relCount, usingAI: isAIConfigured(), usingNeo4j: isNeo4jConfigured() })

      } catch (error) {
        console.error('Extraction error:', error)
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
