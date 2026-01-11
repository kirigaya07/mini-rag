/**
 * OpenAI LLM answer generator with citation mapping
 * Uses GPT-4o Mini or GPT-4.1 for generating grounded answers
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'gpt-4o-mini';

/**
 * Generate grounded answer with citations
 * @param {string} query - User query
 * @param {Array<{id: string, text: string, metadata: object, score: number}>} chunks - Reranked chunks
 * @returns {Promise<{answer: string, citations: Array<{chunkId: string, position: number}>, tokenUsage: object}>}
 */
export async function generateAnswer(query, chunks) {
  if (!query || !chunks || chunks.length === 0) {
    throw new Error('Query and chunks are required');
  }

  // Build context from chunks
  const context = chunks
    .map((chunk, idx) => `[${idx + 1}] ${chunk.text}`)
    .join('\n\n');

  const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided context. 
Always answer based on the context provided. When you reference information from the context, cite it using [1], [2], etc. corresponding to the chunk numbers.
Use the context to answer the question - the context contains the information needed. Be concise, accurate, and directly answer the question.`;

  const userPrompt = `Based on the following context, answer the question. Use citations [1], [2], etc. when referencing specific chunks.

Context:
${context}

Question: ${query}

Answer:`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const answer = response.choices[0].message.content;
    
    // Extract citations from answer
    const citations = extractCitations(answer, chunks);
    
    // Calculate token usage
    const tokenUsage = {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
    };

    // Estimate cost (GPT-4o Mini pricing as of 2024)
    const cost = estimateCost(tokenUsage);

    return {
      answer,
      citations,
      tokenUsage,
      cost,
    };
  } catch (error) {
    console.error('Answer generation error:', error);
    throw new Error(`Failed to generate answer: ${error.message}`);
  }
}

/**
 * Extract citations from answer text
 * @param {string} answer - Generated answer text
 * @param {Array} chunks - Chunks array
 * @returns {Array<{chunkId: string, position: number}>}
 */
function extractCitations(answer, chunks) {
  const citations = [];
  const citationRegex = /\[(\d+)\]/g;
  let match;

  while ((match = citationRegex.exec(answer)) !== null) {
    const chunkIndex = parseInt(match[1]) - 1; // Convert [1] to index 0
    if (chunkIndex >= 0 && chunkIndex < chunks.length) {
      const chunkId = chunks[chunkIndex].id;
      const position = match.index;
      
      // Avoid duplicates
      if (!citations.find(c => c.chunkId === chunkId && c.position === position)) {
        citations.push({
          chunkId,
          position,
          chunkIndex,
        });
      }
    }
  }

  return citations;
}

/**
 * Estimate cost based on token usage
 * GPT-4o Mini pricing (approximate as of 2024):
 * - Input: $0.15 per 1M tokens
 * - Output: $0.60 per 1M tokens
 */
function estimateCost(tokenUsage) {
  const inputCostPerMillion = 0.15;
  const outputCostPerMillion = 0.60;

  const inputCost = (tokenUsage.promptTokens / 1_000_000) * inputCostPerMillion;
  const outputCost = (tokenUsage.completionTokens / 1_000_000) * outputCostPerMillion;
  const totalCost = inputCost + outputCost;

  return {
    input: inputCost,
    output: outputCost,
    total: totalCost,
    formatted: `$${totalCost.toFixed(6)}`,
  };
}

/**
 * Get LLM model info
 */
export function getLLMInfo() {
  return {
    model: MODEL,
  };
}
