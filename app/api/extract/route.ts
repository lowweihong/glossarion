import { NextResponse } from 'next/server'
import { parseDocument, chunkText } from '@/lib/parser'
import { extractKnowledge, isAIConfigured } from '@/lib/extractor'
import {
  createDocument,
  createEntity,
  createRelationship,
  updateDocumentStatus,
  isNeo4jConfigured,
} from '@/lib/neo4j'
import type { Document, Entity, Relationship } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentId = formData.get('documentId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const { content, type } = await parseDocument(file)

    const document: Document = {
      id: documentId,
      name: file.name,
      type,
      content: content.slice(0, 10000),
      uploadedAt: new Date().toISOString(),
      status: 'processing',
    }

    if (isNeo4jConfigured()) {
      await createDocument(document)
    }

    const chunks = chunkText(content)
    const allEntities: Entity[] = []
    const allRelationships: Relationship[] = []

    for (let i = 0; i < Math.min(chunks.length, 3); i++) {
      const { entities, relationships } = await extractKnowledge(
        chunks[i],
        documentId
      )
      allEntities.push(...entities)
      allRelationships.push(...relationships)
    }

    const uniqueEntities = Array.from(
      new Map(allEntities.map((e) => [e.name.toLowerCase(), e])).values()
    )

    if (isNeo4jConfigured()) {
      for (const entity of uniqueEntities) {
        await createEntity(entity)
      }
      for (const rel of allRelationships) {
        await createRelationship(rel)
      }
      await updateDocumentStatus(documentId, 'completed')
    }

    return NextResponse.json({
      success: true,
      documentId,
      entities: uniqueEntities.length,
      relationships: allRelationships.length,
      usingAI: isAIConfigured(),
      usingNeo4j: isNeo4jConfigured(),
    })
  } catch (error) {
    console.error('Extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    )
  }
}
