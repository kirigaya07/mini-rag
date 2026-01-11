/**
 * Pinecone Vector Database utility
 * Handles index initialization, upsert, and query operations
 */

import { Pinecone } from '@pinecone-database/pinecone';

const INDEX_NAME = process.env.PINECONE_INDEX || 'mini-rag';
const DIMENSION = 1536;
const METRIC = 'cosine';

let pinecone = null;
let index = null;

/**
 * Initialize Pinecone client and index
 */
async function initializePinecone() {
  if (pinecone) {
    return pinecone;
  }

  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY is not set');
  }

  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  // Get or create index
  const indexes = await pinecone.listIndexes();
  const existingIndex = indexes.indexes?.find(idx => idx.name === INDEX_NAME);

  if (!existingIndex) {
    console.log(`Creating Pinecone index: ${INDEX_NAME}`);
    await pinecone.createIndex({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: METRIC,
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    
    // Wait for index to be ready
    await waitForIndexReady(INDEX_NAME);
  }

  index = pinecone.index(INDEX_NAME);
  return pinecone;
}

/**
 * Wait for index to be ready
 */
async function waitForIndexReady(indexName, maxWait = 60) {
  const start = Date.now();
  while (Date.now() - start < maxWait * 1000) {
    const indexes = await pinecone.listIndexes();
    const index = indexes.indexes?.find(idx => idx.name === indexName);
    if (index && index.status?.ready) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error(`Index ${indexName} did not become ready in time`);
}

/**
 * Upsert chunks into Pinecone
 * @param {Array<{id: string, embedding: number[], metadata: object}>} vectors
 * @returns {Promise<void>}
 */
export async function upsertChunks(vectors) {
  if (!vectors || vectors.length === 0) {
    return;
  }

  await initializePinecone();

  // Upsert in batches of 100 (Pinecone limit)
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
  }
}

/**
 * Query Pinecone for similar chunks
 * @param {number[]} embedding - Query embedding
 * @param {number} topK - Number of results to return
 * @param {object} filter - Optional metadata filter
 * @returns {Promise<Array<{id: string, score: number, metadata: object}>>}
 */
export async function queryChunks(embedding, topK = 10, filter = null) {
  await initializePinecone();

  const queryOptions = {
    vector: embedding,
    topK,
    includeMetadata: true,
  };

  if (filter) {
    queryOptions.filter = filter;
  }

  const results = await index.query(queryOptions);

  return results.matches.map(match => ({
    id: match.id,
    score: match.score,
    metadata: match.metadata || {},
  }));
}

/**
 * Get index stats
 */
export async function getIndexStats() {
  await initializePinecone();
  return await index.describeIndexStats();
}
