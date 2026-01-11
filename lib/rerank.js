/**
 * Cohere Reranker utility
 * Reranks retrieved chunks based on query relevance
 */

import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const MODEL = 'rerank-english-v3.0';

/**
 * Rerank documents based on query
 * @param {string} query - The search query
 * @param {Array<{id: string, text: string, metadata?: object}>} documents - Documents to rerank
 * @param {number} topN - Number of top results to return
 * @returns {Promise<Array<{id: string, text: string, score: number, metadata: object, index: number}>>}
 */
export async function rerank(query, documents, topN = 10) {
  if (!query || !documents || documents.length === 0) {
    return [];
  }

  // Extract text from documents
  const documentTexts = documents.map(doc => doc.text || doc.metadata?.text || '');

  try {
    const response = await cohere.rerank({
      model: MODEL,
      query,
      documents: documentTexts,
      topN: Math.min(topN, documents.length),
    });

    // Map results back to original documents with scores
    return response.results.map(result => {
      const originalDoc = documents[result.index];
      return {
        id: originalDoc.id,
        text: originalDoc.text || originalDoc.metadata?.text || '',
        score: result.relevanceScore,
        metadata: originalDoc.metadata || {},
        index: result.index,
      };
    });
  } catch (error) {
    console.error('Reranking error:', error);
    // Fallback: return original documents with dummy scores
    return documents.slice(0, topN).map((doc, idx) => ({
      id: doc.id,
      text: doc.text || doc.metadata?.text || '',
      score: 1.0 - (idx * 0.01),
      metadata: doc.metadata || {},
      index: idx,
    }));
  }
}

/**
 * Get reranker model info
 */
export function getRerankerInfo() {
  return {
    model: MODEL,
  };
}
