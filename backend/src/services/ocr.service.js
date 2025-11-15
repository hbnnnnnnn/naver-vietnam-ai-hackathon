import { callNaverOcr, matchIngredientsWithFuzzy, extractIngredientsFromText, sortFieldsByPosition, buildLinesFromFields, cleanAndSplitIngredients } from "../utils/ocrLogic.js";
import IngredientCosing from "../models/ingredientCosing.js";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function extractIngredientsService(secretKey, apiUrl, imagePath, imageFormat = 'png') {
  try {
    if (!secretKey || !apiUrl || !imagePath) throw new Error('Missing required parameters');

    const ocrData = await callNaverOcr({ secretKey, apiUrl, imagePath, imageFormat });
    if (!ocrData?.images?.[0]?.fields) throw new Error('Invalid OCR response');

    const sorted = sortFieldsByPosition(ocrData.images[0].fields);
    const lines = buildLinesFromFields(sorted);
    const fullText = lines.join('\n');

    const ingredientsBlock = extractIngredientsFromText(fullText);
    const tokens = cleanAndSplitIngredients(ingredientsBlock).map(t => t.toLowerCase());

    // Query your ingredient collection for normalized names
    const ingredientDocs = await IngredientCosing.find({}, 'inci_normalized inci_name').lean();
    const normalizedList = ingredientDocs.map(d => d.inci_normalized).filter(Boolean);

    const matchedNormalized = await matchIngredientsWithFuzzy(tokens, normalizedList, 75);

    // Map normalized back to display names
    const matchedNames = ingredientDocs
      .filter(d => matchedNormalized.includes(d.inci_normalized))
      .map(d => d.inci_name || d.inci_normalized);

    return {
      success: true,
      ingredients: matchedNames
    };
  } catch (err) {
    console.error('extractIngredientsService err', err);
    return { success: false, error: err.message, ingredients_found: 0, ingredients: [] };
  }
}
