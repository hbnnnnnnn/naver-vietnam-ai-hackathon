import IngredientAI from "../models/ingredientAI.js";
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

/**
 * Enriches ingredient names with full details from AI or LLM
 * Priority: IngredientAI -> HYPER CLOVA LLM (with cache)
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

  // Step 2: Find still missing ingredients (need LLM)
  const stillMissing = ingredientNames.filter(name => !aiMap.has(name));

  // Step 3: Call HYPER CLOVA LLM for remaining ingredients and cache results
  if (stillMissing.length > 0) {
    try {
      const llmResults = await fetchIngredientFromLLM(stillMissing);
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
      console.error('Failed to fetch ingredients from LLM:', error.message);
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
 * Fetches ingredient information from HYPER CLOVA LLM
 * @param {string} ingredientName - Name of the ingredient
 * @returns {Promise<Object>} LLM-generated ingredient details
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
export async function fetchIngredientFromLLM(ingredientNames) {
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
  - name: The standard INCI name (should match the input name)
  - description: A brief, informative description (1-2 sentences)
  - benefits: Array of 3-4 key benefits (each as a full sentence)
  - good_for: Array of specific keywords for skin types, conditions, or situations. You MUST select ONLY from this exact list: ['oily', 'dry', 'combination', 'sensitive', 'normal', 'acne', 'aging', 'pigmentation', 'sensitivity', 'oiliness', 'dryness']. Do NOT use generic terms like "all" or "all skin types". If an ingredient is suitable for multiple types, list them individually.
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
            content: 'You are a skincare ingredient expert. Provide accurate, concise information in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          },
        ],
        response_format: { "type": "json_object" },
        maxTokens: 1500,
        temperature: 0.3,
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
    console.error('Error calling HYPER CLOVA LLM:', error.message);
    throw error;
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
        response_format: { "type": "json_object" },
        maxTokens: 1000,
        temperature: 0.3,
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
