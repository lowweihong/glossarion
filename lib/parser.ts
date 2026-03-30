import pdfParse from 'pdf-parse'

export async function parseDocument(
  file: File
): Promise<{ content: string; type: 'pdf' | 'text' | 'markdown' }> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const data = await pdfParse(buffer)
    return { content: data.text, type: 'pdf' }
  }

  if (fileName.endsWith('.md')) {
    const content = await file.text()
    return { content, type: 'markdown' }
  }

  const content = await file.text()
  return { content, type: 'text' }
}

export function chunkText(text: string, maxChunkSize: number = 4000): string[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      if (paragraph.length > maxChunkSize) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/)
        let sentenceChunk = ''
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length + 1 > maxChunkSize) {
            if (sentenceChunk) chunks.push(sentenceChunk.trim())
            sentenceChunk = sentence
          } else {
            sentenceChunk += (sentenceChunk ? ' ' : '') + sentence
          }
        }
        currentChunk = sentenceChunk
      } else {
        currentChunk = paragraph
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
