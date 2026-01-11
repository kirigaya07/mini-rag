/**
 * API Route: /api/upload
 * Handles text/file upload, chunking, embedding, and indexing
 */

import { NextResponse } from 'next/server';
import { chunkText, countTokens } from '@/lib/chunkText';
import { embedBatch } from '@/lib/embed';
import { upsertChunks } from '@/lib/vector';
import { createTimer } from '@/lib/timing';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/upload
 * Accepts:
 * - text: raw text string
 * - file: File object (txt or pdf)
 * - title: optional document title
 * - source: optional source identifier
 */
export async function POST(request) {
  const timer = createTimer();
  
  try {
    const formData = await request.formData();
    const text = formData.get('text');
    const file = formData.get('file');
    const title = formData.get('title') || 'Untitled Document';
    const source = formData.get('source') || 'manual-upload';

    let content = '';
    let fileName = '';

    // Extract content from file or text
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      fileName = file.name;

      if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
        // Use unpdf for Next.js 16/Turbopack compatibility
        const { extractText, getDocumentProxy } = await import('unpdf');
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text } = await extractText(pdf, { mergePages: true });
        content = text;
      } else if (file.type === 'text/plain' || fileName.endsWith('.txt')) {
        content = buffer.toString('utf-8');
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Only .txt and .pdf are supported.' },
          { status: 400 }
        );
      }
    } else if (text) {
      content = text;
    } else {
      return NextResponse.json(
        { error: 'Either text or file must be provided' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    // Chunk the text
    const chunks = chunkText(content, 800, 1200, 12.5);
    
    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks generated from content' },
        { status: 400 }
      );
    }

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await embedBatch(chunkTexts);

    if (embeddings.length !== chunks.length) {
      return NextResponse.json(
        { error: 'Embedding generation failed' },
        { status: 500 }
      );
    }

    // Prepare vectors for Pinecone
    const vectors = chunks.map((chunk, idx) => ({
      id: `${source}-${Date.now()}-${idx}`,
      values: embeddings[idx],
      metadata: {
        chunk_id: `${source}-${Date.now()}-${idx}`,
        text: chunk.text,
        source: source,
        title: title,
        section: `chunk-${idx + 1}`,
        position: idx,
        tokens: chunk.tokens,
        fileName: fileName || null,
      },
    }));

    // Upsert to Pinecone
    await upsertChunks(vectors);

    const elapsed = timer.elapsed();

    return NextResponse.json({
      success: true,
      chunkCount: chunks.length,
      totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
      processingTime: elapsed,
      processingTimeFormatted: `${(elapsed / 1000).toFixed(2)}s`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process upload',
        success: false 
      },
      { status: 500 }
    );
  }
}
