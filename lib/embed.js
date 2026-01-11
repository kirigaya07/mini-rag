/**
 * OpenAI Embeddings utility
 * Uses text-embedding-3-small model
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'text-embedding-3-small';
const DIMENSION = 1536;

/**
 * Generate embeddings for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  const response = await openai.embeddings.create({
    model: MODEL,
    input: text,
    dimensions: DIMENSION,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>}
 */
export async function embedBatch(texts) {
  if (!texts || texts.length === 0) {
    return [];
  }

  // Filter out empty texts
  const validTexts = texts.filter(t => t && t.trim().length > 0);
  if (validTexts.length === 0) {
    return [];
  }

  const response = await openai.embeddings.create({
    model: MODEL,
    input: validTexts,
    dimensions: DIMENSION,
  });

  return response.data.map(item => item.embedding);
}

/**
 * Get embedding model info
 */
export function getEmbeddingInfo() {
  return {
    model: MODEL,
    dimension: DIMENSION,
  };
}
