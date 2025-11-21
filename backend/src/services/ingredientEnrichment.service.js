import IngredientAI from "../models/ingredientAI.js";
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchSafetyData, checkIngredientSafety } from './vectorSearch.service.js';
dotenv.config();

/**
 * Enriches ingredient names with full details from AI or LLM
 * Priority: IngredientAI -> Safety Data Vector Search (RAG) -> HYPER CLOVA LLM (with RAG context)
 * Note: This function assumes Renude lookup has already been done
 * @param {string[]} ingredientNames - Array of ingredient names to enrich (not found in Renude)
 * @returns {Promise<Array>} Array of enriched ingredient details
 */
export async function enrichIngredientsWithDetails(ingredientNames) {
  if (!ingredientNames || ingredientNames.length === 0) {
    return [];
  }

  // Step 1: Query IngredientAI for cached results
  const aiResults = await IngredientAI.find({
    name: { $in: ingredientNames }
  }).lean();

  const aiMap = new Map();
  aiResults.forEach(item => {
    aiMap.set(item.name, item);
  });

  // Step 2: Find still missing ingredients (need LLM or RAG)
  const stillMissing = ingredientNames.filter(name => !aiMap.has(name));

  // Step 3: Use RAG + LLM for remaining ingredients
  if (stillMissing.length > 0) {
    try {
      // Perform vector search for safety data (RAG retrieval)
      const ragContext = await retrieveSafetyContext(stillMissing);
      
      // Call HYPER CLOVA LLM with RAG context and cache results
      const llmResults = await fetchIngredientFromLLMWithRAG(stillMissing, ragContext);
      
      // Cache LLM results to IngredientAI DB
      for (let idx = 0; idx < llmResults.length; idx++) {
        const llmResult = llmResults[idx];
        const ingredientName = stillMissing[idx];

        const doc = {
          name: llmResult.name || llmResult.inci_name || ingredientName,
          description: llmResult.description || llmResult.summary || '',
          benefits: Array.isArray(llmResult.benefits) ? llmResult.benefits : [],
          good_for: llmResult.good_for || [],
          risk_level: llmResult.risk_level || 'Unknown',
          reason: llmResult.reason || ''
        };
        aiMap.set(ingredientName, doc);
        
        // Upsert to IngredientAI DB
        try {
          await IngredientAI.updateOne(
            { name: doc.name },
            { $set: doc },
            { upsert: true }
          );
        } catch (dbError) {
          console.error('Failed to cache ingredient to IngredientAI:', doc.name, dbError.message);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ingredients from LLM with RAG:', error.message);
      // Add minimal fallback for all missing ingredients
      stillMissing.forEach(ingredientName => {
        aiMap.set(ingredientName, {
          name: ingredientName,
          description: 'Information not available',
          benefits: [],
          good_for: [],
          risk_level: 'Unknown',
          reason: 'LLM fetch failed'
        });
      });
    }
  }

  // Step 4: Return results in original order, only front-end fields
  const enrichedIngredients = ingredientNames.map(name => {
    const doc = aiMap.get(name);
    if (!doc) return null;
    return {
      name: doc.name,
      description: doc.description,
      benefits: doc.benefits,
      good_for: doc.good_for,
      risk_level: doc.risk_level,
      reason: doc.reason
    };
  }).filter(Boolean);

  return enrichedIngredients;
}

/**
 * Retrieve safety context using RAG (Retrieval-Augmented Generation) - OPTIMIZED with parallel processing
 * @param {string[]} ingredientNames - Array of ingredient names
 * @returns {Promise<Object>} Map of ingredient name -> safety context
 */
async function retrieveSafetyContext(ingredientNames) {
  const contextMap = {};
  
  try {
    const searchPromises = ingredientNames.map(ingredientName => 
      searchSafetyData(ingredientName, 1, 0.8) // High threshold (0.8) to avoid false positives like Madecassic Acid vs Picric Acid
        .then(safetyResults => ({ ingredientName, safetyResults }))
        .catch(err => {
          console.error(`Safety search failed for ${ingredientName}:`, err.message);
          return { ingredientName, safetyResults: [] };
        })
    );
    
    const allResults = await Promise.all(searchPromises);
    
    // Build context map from results
    allResults.forEach(({ ingredientName, safetyResults }) => {
      // Only flag safety concerns for very high similarity (>0.85) to avoid false positives
      // e.g., Madecassic Acid should not match Picric Acid despite both containing "acid"
      const highConfidenceMatches = safetyResults.filter(result => result.similarity > 0.85);
      
      if (highConfidenceMatches.length > 0) {
        contextMap[ingredientName] = {
          has_safety_concerns: true,
          matched_substances: highConfidenceMatches.map(result => ({
            name: result.data.ingredient_name || 'Unknown substance',
            details: result.data.details || 'No details available',
            risk: result.data.risk || 'Unknown',
            similarity: result.similarity
          })),
          highest_similarity: highConfidenceMatches[0].similarity
        };
      } else {
        contextMap[ingredientName] = {
          has_safety_concerns: false,
          matched_substances: [],
          highest_similarity: 0
        };
      }
    });
  } catch (error) {
    console.error('Error retrieving safety context:', error.message);
    // Return empty context on error
    ingredientNames.forEach(name => {
      contextMap[name] = {
        has_safety_concerns: false,
        matched_substances: [],
        highest_similarity: 0
      };
    });
  }
  
  return contextMap;
}

/**
 * Fetches ingredient information from HYPER CLOVA LLM with RAG context
 * @param {string[]} ingredientNames - Array of ingredient names
 * @param {Object} ragContext - Safety context from vector search
 * @returns {Promise<Array>} LLM-generated ingredient details
 */
async function fetchIngredientFromLLMWithRAG(ingredientNames, ragContext) {
  const apiKey = process.env.HYPER_CLOVA_API_KEY;
  const apiUrl = process.env.HYPER_CLOVA_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('HYPER CLOVA API credentials not set');
  }

  const BATCH_SIZE = 5;
  const batches = [];
  for (let i = 0; i < ingredientNames.length; i += BATCH_SIZE) {
    batches.push(ingredientNames.slice(i, i + BATCH_SIZE));
  }

  // Process all batches in parallel
  const batchPromises = batches.map(batch => processBatch(batch, ragContext, apiKey, apiUrl));
  const batchResults = await Promise.all(batchPromises);
  
  // Flatten results
  return batchResults.flat();
}

async function processBatch(batch, ragContext, apiKey, apiUrl) {
  // Build context-aware prompt for this batch only
  let contextSection = '';
  for (const ingredientName of batch) {
    const context = ragContext[ingredientName];
    // Only use safety alerts with very high similarity (>85%) to avoid false positives
    // e.g., prevent Madecassic Acid from being flagged due to low similarity with Picric Acid
    if (context?.has_safety_concerns && context.highest_similarity > 0.85) {
      const topMatch = context.matched_substances[0];
      const riskInfo = topMatch.risk && topMatch.risk !== 'Unknown' ? topMatch.risk : 'safety concern';
      contextSection += `\n"${ingredientName}": ${topMatch.name} (${(topMatch.similarity * 100).toFixed(0)}% match, ${riskInfo})`;
    }
  }

  if (contextSection) {
    contextSection = '\n**SAFETY ALERTS:**' + contextSection + '\n';
  }

  const prompt = `Analyze these skincare ingredients and return a valid JSON array.
${contextSection}

**INGREDIENTS:**${batch.map((name, i) => `${i + 1}. ${name}`).join('\n')}

**OUTPUT:** Valid JSON array with one object per ingredient. Each object must have:
- "name": exact ingredient name
- "description": 1-2 sentences about the ingredient
- "benefits": array of exactly 3 benefit strings
- "good_for": array from ["oily","dry","combination","sensitive","normal","acne","aging","pigmentation","sensitivity","dryness","oilness"]
- "risk_level": one of "no-risk","low-risk","moderate-risk","high-risk"
- "reason": 1-2 sentences explaining the assigned risk_level 

**CRITICAL RISK ASSESSMENT RULES:**
1. ALWAYS check SAFETY ALERTS first before assigning risk_level
2. ONLY use SAFETY ALERTS if similarity is >85% - lower similarity may indicate false matches (e.g., Madecassic Acid vs Picric Acid)
3. If an ingredient appears in SAFETY ALERTS with very high similarity (>90%), the risk_level MUST match the safety alert risk
4. If SAFETY ALERTS indicates "banned", the risk_level MUST be "high-risk"
5. The "reason" field MUST be 1-2 complete, professional sentences that explain WHY the risk level was assigned
6. If SAFETY ALERTS data is used, paraphrase it into natural sentences - DO NOT copy the raw format like "(99% match, High (Banned))"
7. Only assign "no-risk" or "low-risk" if NO safety concerns are found in SAFETY ALERTS OR if SAFETY ALERTS similarity is too low (<85%)

**REASON FIELD EXAMPLES:**
- GOOD: "This ingredient shows high similarity to phenylbutazone, a banned substance in cosmetics, and therefore carries significant safety concerns."
- GOOD: "Contains glutaraldehyde which is a regulated preservative that may cause skin irritation in sensitive individuals."
- BAD: "Phenylbutazone (98% match, High (Banned))"
- BAD: "Contains Glycyclamide, a banned substance."

CRITICAL: Return complete, valid JSON only. NO ellipsis (...), NO truncation, NO explanatory text.

Example for 1 ingredient:
[{"name":"Adenosine","description":"A molecule that reduces wrinkles and soothes skin.","benefits":["Reduces fine lines","Brightens skin tone","Controls sebum"],"good_for":["aging","dry","sensitive"],"risk_level":"low-risk","reason":"This is a safe, naturally occurring molecule with proven anti-aging benefits and minimal risk of irritation."}]
  
Return the complete JSON array`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert cosmetic chemist and dermatological researcher specializing in ingredient safety analysis. Provide accurate, evidence-based assessments in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          },
        ],
        response_format: { "type": "json_object" },
        maxTokens: Math.min(200 * batch.length, 2500), 
        temperature: 0.2,
        topP: 0.8,
        repeatPenalty: 1.2
        
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60s timeout per batch
      }
    );

    const content = response.data?.result?.message?.content || response.data?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response format');
    }
    
    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : (parsed.ingredients || [parsed]);
    
    // Ensure we have results for all ingredients in batch
    return batch.map((name, idx) => results[idx] || {
      name,
      description: 'Information not available',
      benefits: [],
      good_for: [],
      risk_level: 'Unknown',
      reason: 'LLM response incomplete'
    });
  } catch (error) {
    console.error('Batch LLM call failed:', error.message);
    // Return fallback for entire batch
    return batch.map(name => ({
      name,
      description: 'Information not available',
      benefits: [],
      good_for: [],
      risk_level: 'Unknown',
      reason: 'LLM error: ' + error.message
    }));
  }
}

/**
 * Fetches only risk_level and reason for ingredients from HYPER CLOVA LLM
 * Used for seeding Renude database where other fields already exist
 * @param {string[]} ingredientNames - Array of ingredient names
 * @returns {Promise<Array>} Array of objects with name, risk_level, and reason
 */
export async function fetchRiskAssessmentFromLLM(ingredientNames) {
  const apiKey = process.env.HYPER_CLOVA_API_KEY;
  const apiUrl = process.env.HYPER_CLOVA_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('HYPER CLOVA API credentials not set');
  }

  // Accepts array of ingredient names
  if (!Array.isArray(ingredientNames)) {
    ingredientNames = [ingredientNames];
  }

  const prompt = `For each of the following skincare ingredients, return a JSON array where each object has ONLY these fields:
  - name: The ingredient name (should match the input name)
  - risk_level: One of ['no-risk', 'low-risk', 'moderate-risk', 'high-risk', 'unknown'] indicating the safety risk of the ingredient
  - reason: A brief explanation (1-2 sentences) for the assigned risk level
Ingredients:
${ingredientNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}
Return a JSON array of objects, one for each ingredient, in the same order as listed above. Do not include any extra fields.`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'system',
            content: 'You are a skincare ingredient safety expert. Provide accurate risk assessments in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          },
        ],
        maxTokens: 1000,
        temperature: 0.2,
        topP: 0.8,
        repeatPenalty: 1.2
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data?.result?.message?.content || response.data?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response format');
    }

    // Try direct JSON parsing first
    try {
      const ingredientData = JSON.parse(content);
      // If not an array, wrap in array
      return Array.isArray(ingredientData) ? ingredientData : [ingredientData];
    } catch (directParseError) {
      // Fallback: extract JSON array/object with regex
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }
      const ingredientData = JSON.parse(jsonMatch[0]);
      return Array.isArray(ingredientData) ? ingredientData : [ingredientData];
    }
  } catch (error) {
    console.error('Error calling HYPER CLOVA LLM for risk assessment:', error.message);
    throw error;
  }
}
