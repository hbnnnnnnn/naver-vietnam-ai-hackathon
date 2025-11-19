import { callNaverOcr, sortFieldsByPosition, buildLinesFromFields } from "../utils/ocrLogic.js";
import IngredientCosing from "../models/ingredientCosing.js";
import { extractIngredientsFromText, cleanAndSplitIngredients, matchIngredientsWithFuzzy } from "../utils/ocrLogic.js";
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pure OCR service: returns OCR data from image
export async function runOcrService(secretKey, apiUrl, imagePath, imageFormat = 'png') {
  if (!secretKey || !apiUrl || !imagePath) throw new Error('Missing required parameters');
  return await callNaverOcr({ secretKey, apiUrl, imagePath, imageFormat });
}

// Ingredient extraction from OCR text
export async function extractIngredientsFromTextService(ocrText) {
  if (!ocrText) throw new Error('No OCR text provided');
  const ingredientsBlock = extractIngredientsFromText(ocrText);
  const tokens = cleanAndSplitIngredients(ingredientsBlock).map(t => t.toLowerCase());
  const ingredientDocs = await IngredientCosing.find({}, 'inci_normalized inci_name').lean();
  const normalizedList = ingredientDocs.map(d => d.inci_normalized).filter(Boolean);
  const matchedNormalized = await matchIngredientsWithFuzzy(tokens, normalizedList, 75);
  const matchedNames = ingredientDocs
    .filter(d => matchedNormalized.includes(d.inci_normalized))
    .map(d => d.inci_name || d.inci_normalized);
  return matchedNames
}

// Utility to get full OCR text from OCR data
export function getOcrTextFromData(ocrData) {
  if (!ocrData?.images?.[0]?.fields) throw new Error('Invalid OCR response');
  const sorted = sortFieldsByPosition(ocrData.images[0].fields);
  const lines = buildLinesFromFields(sorted);
  return lines.join('\n');
}
