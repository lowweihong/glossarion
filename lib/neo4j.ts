import neo4j, { Driver, Session } from 'neo4j-driver'
import type { Entity, Relationship, Document, GraphData, InsightStats, EntityType } from './types'
import { demoGraphData, demoDocuments } from './demo-data'

let driver: Driver | null = null

function getDriver(): Driver | null {
  if (driver) return driver

  const uri = process.env.NEO4J_URI
  const user = process.env.NEO4J_USERNAME
  const password = process.env.NEO4J_PASSWORD

  if (!uri || !user || !password) {
    return null
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
  return driver
}

export function isNeo4jConfigured(): boolean {
  return !!(
    process.env.NEO4J_URI &&
    process.env.NEO4J_USERNAME &&
    process.env.NEO4J_PASSWORD
  )
}

async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const d = getDriver()
  if (!d) {
    throw new Error('Neo4j not configured')
  }

  const session: Session = d.session()
  try {
    const result = await session.run(cypher, params)
    return result.records.map((record) => record.toObject() as T)
  } finally {
    await session.close()
  }
}

export async function initializeSchema(): Promise<void> {
  if (!isNeo4jConfigured()) return

  await runQuery(`
    CREATE CONSTRAINT entity_id IF NOT EXISTS
    FOR (e:Entity) REQUIRE e.id IS UNIQUE
  `)
  await runQuery(`
    CREATE CONSTRAINT document_id IF NOT EXISTS
    FOR (d:Document) REQUIRE d.id IS UNIQUE
  `)
}

export async function createDocument(doc: Document): Promise<Document> {
  if (!isNeo4jConfigured()) {
    return doc
  }

  await runQuery(
    `
    CREATE (d:Document {
      id: $id,
      name: $name,
      type: $type,
      content: $content,
      uploadedAt: $uploadedAt,
      status: $status
    })
    RETURN d
  `,
    doc
  )
  return doc
}

export async function updateDocumentStatus(
  id: string,
  status: Document['status']
): Promise<void> {
  if (!isNeo4jConfigured()) return

  await runQuery(
    `
    MATCH (d:Document {id: $id})
    SET d.status = $status
  `,
    { id, status }
  )
}

export async function createEntity(entity: Entity): Promise<Entity> {
  if (!isNeo4jConfigured()) {
    return entity
  }

  await runQuery(
    `
    MERGE (e:Entity {id: $id})
    SET e.name = $name,
        e.type = $type,
        e.description = $description,
        e.documentId = $documentId,
        e.createdAt = datetime()
    WITH e
    MATCH (d:Document {id: $documentId})
    MERGE (e)-[:EXTRACTED_FROM]->(d)
    RETURN e
  `,
    entity
  )
  return entity
}

export async function createRelationship(rel: Relationship): Promise<Relationship> {
  if (!isNeo4jConfigured()) {
    return rel
  }

  await runQuery(
    `
    MATCH (source:Entity {id: $source})
    MATCH (target:Entity {id: $target})
    MERGE (source)-[r:RELATED_TO {id: $id}]->(target)
    SET r.type = $type,
        r.description = $description,
        r.confidence = $confidence
    RETURN r
  `,
    rel
  )
  return rel
}

export async function getGraphData(): Promise<GraphData> {
  if (!isNeo4jConfigured()) {
    return demoGraphData
  }

  const nodesResult = await runQuery<{ e: { properties: Entity } }>(`
    MATCH (e:Entity)
    RETURN e
  `)

  const linksResult = await runQuery<{
    r: { properties: { id: string; type: string; description: string; confidence: number } }
    source: string
    target: string
  }>(`
    MATCH (source:Entity)-[r:RELATED_TO]->(target:Entity)
    RETURN r, source.id as source, target.id as target
  `)

  const nodes: Entity[] = nodesResult.map((row) => ({
    id: row.e.properties.id,
    name: row.e.properties.name,
    type: row.e.properties.type,
    description: row.e.properties.description,
    documentId: row.e.properties.documentId,
  }))

  const links: Relationship[] = linksResult.map((row) => ({
    id: row.r.properties.id,
    source: row.source,
    target: row.target,
    type: row.r.properties.type,
    description: row.r.properties.description,
    confidence: row.r.properties.confidence,
  }))

  if (nodes.length === 0) {
    return demoGraphData
  }

  return { nodes, links }
}

export async function getDocuments(): Promise<Document[]> {
  if (!isNeo4jConfigured()) {
    return demoDocuments
  }

  const result = await runQuery<{ d: { properties: Document } }>(`
    MATCH (d:Document)
    RETURN d
    ORDER BY d.uploadedAt DESC
  `)

  const docs = result.map((row) => row.d.properties)
  return docs.length > 0 ? docs : demoDocuments
}

export async function getInsightStats(): Promise<InsightStats> {
  const graphData = await getGraphData()
  const documents = await getDocuments()

  const entitiesByType = graphData.nodes.reduce(
    (acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    },
    {} as Record<EntityType, number>
  )

  const connectionCounts = new Map<string, number>()
  graphData.links.forEach((link) => {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as unknown as Entity).id
    const targetId = typeof link.target === 'string' ? link.target : (link.target as unknown as Entity).id
    connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
    connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
  })

  const mostConnectedEntities = graphData.nodes
    .map((entity) => ({
      entity,
      connectionCount: connectionCounts.get(entity.id) || 0,
    }))
    .sort((a, b) => b.connectionCount - a.connectionCount)
    .slice(0, 5)

  return {
    totalEntities: graphData.nodes.length,
    totalRelationships: graphData.links.length,
    entitiesByType,
    mostConnectedEntities,
    recentDocuments: documents.slice(0, 5),
  }
}

export async function clearAllData(): Promise<void> {
  if (!isNeo4jConfigured()) return

  await runQuery('MATCH (n) DETACH DELETE n')
}
