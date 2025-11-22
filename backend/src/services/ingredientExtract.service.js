import IngredientCosing from "../models/ingredientCosing.js";
import IngredientRenude from "../models/IngredientRenude.js";
import { extractIngredientsFromText, cleanAndSplitIngredients, matchIngredientsWithFuzzy } from "../utils/ocrLogic.js";
import { enrichIngredientsWithDetails } from "./ingredientEnrichment.service.js";

// Ingredient extraction from OCR text
export async function extractIngredientsFromTextService(ocrText) {
  if (!ocrText) throw new Error('No OCR text provided');
  const ingredientsBlock = extractIngredientsFromText(ocrText);
  const tokens = cleanAndSplitIngredients(ingredientsBlock);
  const ingredientDocs = await IngredientCosing.find({}, 'inci_name').lean();
  const nameList = ingredientDocs.map(d => d.inci_name).filter(Boolean);
  const matchedNames = await matchIngredientsWithFuzzy(tokens, nameList, 85);

  // Get ingredients from Renude first
  const RenudeFields = 'name description benefits good_for risk_level reason';
  const renudeResults = await IngredientRenude.find({
    name: { $in: matchedNames }
  }, RenudeFields).lean();
  const renudeMap = new Map();
  renudeResults.forEach(item => {
    renudeMap.set(item.name, item);
  });

  // Find missing ingredients that need enrichment
  const missingIngredients = matchedNames.filter(name => !renudeMap.has(name));

  // Enrich only missing ingredients with LLM
  const enrichedMissing = await enrichIngredientsWithDetails(missingIngredients);
  const enrichedMap = new Map();
  enrichedMissing.forEach(item => {
    enrichedMap.set(item.name, item);
  });

  // Combine results in original order and filter fields
  const ingredientDetails = matchedNames.map(name => {
    const item = renudeMap.get(name) || enrichedMap.get(name);
    if (!item) return null;
    
    return {
      name: item.name,
      description: item.description || '',
      benefits: item.benefits || [],
      good_for: item.good_for || [],
      risk_level: item.risk_level || 'Unknown',
      reason: item.reason || ''
    };
  }).filter(Boolean);

  return ingredientDetails
}
