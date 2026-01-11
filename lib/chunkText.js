/**
 * Token-based text chunking with overlap
 * Uses js-tiktoken for accurate token counting
 */

import { encodingForModel } from 'js-tiktoken';

const ENCODING = encodingForModel('gpt-4');

/**
 * Chunk text into segments of 800-1200 tokens with 10-15% overlap
 * @param {string} text - The text to chunk
 * @param {number} minTokens - Minimum tokens per chunk (default: 800)
 * @param {number} maxTokens - Maximum tokens per chunk (default: 1200)
 * @param {number} overlapPercent - Overlap percentage (default: 12.5%)
 * @returns {Array<{text: string, tokens: number, start: number, end: number}>}
 */
export function chunkText(text, minTokens = 800, maxTokens = 1200, overlapPercent = 12.5) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks = [];
  const tokens = ENCODING.encode(text);
  const totalTokens = tokens.length;
  
  if (totalTokens <= maxTokens) {
    return [{
      text,
      tokens: totalTokens,
      start: 0,
      end: text.length,
    }];
  }

  const overlapTokens = Math.floor(maxTokens * (overlapPercent / 100));
  const stepSize = maxTokens - overlapTokens;
  
  let currentPos = 0;
  
  while (currentPos < totalTokens) {
    const chunkEnd = Math.min(currentPos + maxTokens, totalTokens);
    const chunkTokens = tokens.slice(currentPos, chunkEnd);
    
    // Decode tokens back to text
    const chunkText = ENCODING.decode(chunkTokens);
    
    // Find actual text positions
    const textStart = currentPos === 0 ? 0 : findTextPosition(text, tokens, currentPos);
    const textEnd = findTextPosition(text, tokens, chunkEnd);
    
    chunks.push({
      text: chunkText,
      tokens: chunkTokens.length,
      start: textStart,
      end: textEnd,
    });
    
    // Move forward by step size
    currentPos += stepSize;
    
    // If we're at the end, break
    if (chunkEnd >= totalTokens) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Find approximate text position from token position
 */
function findTextPosition(text, tokens, tokenPos) {
  if (tokenPos >= tokens.length) {
    return text.length;
  }
  
  // Decode tokens up to position to get approximate text position
  const tokensToPos = tokens.slice(0, tokenPos);
  const decoded = ENCODING.decode(tokensToPos);
  return Math.min(decoded.length, text.length);
}

/**
 * Count tokens in text
 */
export function countTokens(text) {
  if (!text) return 0;
  return ENCODING.encode(text).length;
}
