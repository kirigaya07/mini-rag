/**
 * API Route: /api/query
 * Full RAG pipeline: Embed → Retrieve → Rerank → Answer
 */

import { NextResponse } from 'next/server';
import { embedText } from '@/lib/embed';
import { queryChunks } from '@/lib/vector';
import { rerank } from '@/lib/rerank';
import { generateAnswer } from '@/lib/answer';
import { createTimer } from '@/lib/timing';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/query
 * Body: { query: string, topK?: number }
 */
export async function POST(request) {
  const overallTimer = createTimer();
  const timings = {};

  try {
    const body = await request.json();
    const { query, topK = 10 } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Step 1: Embed query
    const embedTimer = createTimer();
    const queryEmbedding = await embedText(query);
    timings.embedding = embedTimer.elapsed();

    // Step 2: Retrieve chunks from Pinecone
    const retrieveTimer = createTimer();
    const rawChunks = await queryChunks(queryEmbedding, topK * 2); // Retrieve more for reranking
    timings.retrieval = retrieveTimer.elapsed();

    if (rawChunks.length === 0) {
      return NextResponse.json({
        error: 'No relevant chunks found',
        query,
        timings,
      }, { status: 404 });
    }

    // Step 3: Rerank chunks
    const rerankTimer = createTimer();
    const rerankedChunks = await rerank(
      query,
      rawChunks.map(chunk => ({
        id: chunk.id,
        text: chunk.metadata.text || '',
        metadata: chunk.metadata,
      })),
      topK
    );
    timings.reranking = rerankTimer.elapsed();

    // Step 4: Generate answer with citations
    const answerTimer = createTimer();
    const answerResult = await generateAnswer(query, rerankedChunks);
    timings.answering = answerTimer.elapsed();

    const totalTime = overallTimer.elapsed();

    return NextResponse.json({
      success: true,
      query,
      final_answer: answerResult.answer,
      citations: answerResult.citations,
      reranked_chunks: rerankedChunks.map(chunk => ({
        id: chunk.id,
        text: chunk.text,
        score: chunk.score,
        metadata: chunk.metadata,
      })),
      raw_chunks: rawChunks.map(chunk => ({
        id: chunk.id,
        score: chunk.score,
        metadata: chunk.metadata,
      })),
      timing_metrics: {
        embedding: timings.embedding,
        retrieval: timings.retrieval,
        reranking: timings.reranking,
        answering: timings.answering,
        total: totalTime,
        formatted: {
          embedding: `${timings.embedding}ms`,
          retrieval: `${timings.retrieval}ms`,
          reranking: `${timings.reranking}ms`,
          answering: `${timings.answering}ms`,
          total: `${(totalTime / 1000).toFixed(2)}s`,
        },
      },
      token_usage: answerResult.tokenUsage,
      cost_estimate: answerResult.cost,
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to process query',
        success: false,
        timing_metrics: {
          total: overallTimer.elapsed(),
        },
      },
      { status: 500 }
    );
  }
}
