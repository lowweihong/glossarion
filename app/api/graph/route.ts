import { NextResponse } from 'next/server'
import {
  getGraphData,
  getDocuments,
  getInsightStats,
  createEntity,
  createRelationship,
  createDocument,
  isNeo4jConfigured,
} from '@/lib/neo4j'
import type { Entity, Relationship, Document } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    switch (type) {
      case 'documents':
        const documents = await getDocuments()
        return NextResponse.json({ documents, usingDemo: !isNeo4jConfigured() })

      case 'insights':
        const insights = await getInsightStats()
        return NextResponse.json({ insights, usingDemo: !isNeo4jConfigured() })

      default:
        const graphData = await getGraphData()
        return NextResponse.json({ ...graphData, usingDemo: !isNeo4jConfigured() })
    }
  } catch (error) {
    console.error('Graph API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch graph data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'entity':
        const entity = await createEntity(data as Entity)
        return NextResponse.json({ entity })

      case 'relationship':
        const relationship = await createRelationship(data as Relationship)
        return NextResponse.json({ relationship })

      case 'document':
        const document = await createDocument(data as Document)
        return NextResponse.json({ document })

      default:
        return NextResponse.json(
          { error: 'Invalid type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Graph API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create data' },
      { status: 500 }
    )
  }
}
