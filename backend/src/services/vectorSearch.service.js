import SafetyDataEmbedding from '../models/SafetyDataEmbedding.js';
import { generateEmbedding, findTopSimilar } from './embedding.service.js';

/**
 * Vector search cache for performance optimization
 */
let vectorCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Load all safety data embeddings into memory for fast vector search
 * @returns {Promise<Array>} Array of items with embeddings
 */
async function loadVectorCache() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (vectorCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return vectorCache;
  }
  
  console.log('Loading safety data embeddings into cache...');
  const safetyData = await SafetyDataEmbedding.find({}).lean();
  
  vectorCache = safetyData.map(item => ({
    embedding: item.embedding,
    data: {
      id: item.id,
      ingredient_name: item.ingredient_name,
      cas_no: item.cas_no,
      details: item.details,
      risk: item.risk || 'Unknown',
      embedding_text: item.embedding_text
    }
  }));
  
  cacheTimestamp = now;
  console.log(`Loaded ${vectorCache.length} safety data embeddings into cache`);
  
  return vectorCache;
}

/**
 * Search for relevant safety data using vector similarity
 * @param {string} query - Ingredient name or description to search
 * @param {number} topK - Number of top results to return
 * @param {number} threshold - Minimum similarity threshold (0-1)
 * @returns {Promise<Array>} Array of relevant safety data with similarity scores
 */
export async function searchSafetyData(query, topK = 5, threshold = 0.5) {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Load vector cache
    const vectorData = await loadVectorCache();
    
    // Find top similar items
    const results = findTopSimilar(queryEmbedding, vectorData, topK, threshold);
    
    return results;
  } catch (error) {
    console.error('Error in vector search:', error.message);
    
    // Fallback to text search if vector search fails
    return await textSearchSafetyData(query, topK);
  }
}

/**
 * Fallback text-based search for safety data
 * @param {string} query - Ingredient name to search
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} Array of matching safety data
 */
async function textSearchSafetyData(query, limit = 5) {
  try {
    const queryLower = query.toLowerCase();
    
    const results = await SafetyDataEmbedding.find({
      $or: [
        { ingredient_name: { $regex: query, $options: 'i' } },
        { details: { $regex: query, $options: 'i' } }
      ]
    })
    .limit(limit)
    .lean();
    
    return results.map(item => ({
      data: {
        id: item.id,
        ingredient_name: item.ingredient_name,
        details: item.details,
        risk: item.risk || 'Unknown',
        embedding_text: item.embedding_text
      },
      similarity: 0.5
    }));
  } catch (error) {
    console.error('Error in text search:', error.message);
    return [];
  }
}

/**
 * Batch search for multiple ingredients
 * @param {string[]} queries - Array of ingredient names
 * @param {number} topK - Number of results per query
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Promise<Object>} Map of query -> results
 */
export async function batchSearchSafetyData(queries, topK = 3, threshold = 0.5) {
  const results = {};
  
  for (const query of queries) {
    results[query] = await searchSafetyData(query, topK, threshold);
  }
  
  return results;
}

/**
 * Check if an ingredient matches any banned/restricted substances
 * @param {string} ingredientName - Ingredient to check
 * @param {number} threshold - Similarity threshold for matching
 * @returns {Promise<Object|null>} Matching safety data or null
 */
export async function checkIngredientSafety(ingredientName, threshold = 0.7) {
  const results = await searchSafetyData(ingredientName, 1, threshold);
  
  if (results.length > 0 && results[0].similarity >= threshold) {
    return {
      is_safe: false,
      match: results[0].data,
      similarity: results[0].similarity,
      warning: `This ingredient may be related to: ${results[0].data.details}`
    };
  }
  
  return {
    is_safe: true,
    match: null,
    similarity: 0,
    warning: null
  };
}

/**
 * Clear the vector cache (useful after updating embeddings)
 */
export function clearVectorCache() {
  vectorCache = null;
  cacheTimestamp = null;
  console.log('Vector cache cleared');
}

/**
 * Get statistics about the safety data
 * @returns {Promise<Object>} Statistics object
 */
export async function getSafetyDataStats() {
  const total = await SafetyDataEmbedding.countDocuments();
  const byRiskLevel = await SafetyDataEmbedding.aggregate([
    {
      $group: {
        _id: '$risk_level',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    total,
    by_risk_level: byRiskLevel.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    cache_status: vectorCache ? 'loaded' : 'not_loaded',
    cache_size: vectorCache ? vectorCache.length : 0
  };
}
