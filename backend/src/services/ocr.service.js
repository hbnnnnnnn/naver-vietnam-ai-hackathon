import path from "path";
import { callNaverOcr, loadINCIList, matchIngredientsWithDatabase } from "../utils/ocrLogic.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sortFieldsByPosition(fields) {
  return fields.sort((a, b) => {
    const aY = a.boundingPoly?.vertices?.[0]?.y || 0;
    const bY = b.boundingPoly?.vertices?.[0]?.y || 0;
    if (aY !== bY) return aY - bY;
    const aX = a.boundingPoly?.vertices?.[0]?.x || 0;
    const bX = b.boundingPoly?.vertices?.[0]?.x || 0;
    return aX - bX;
  });
}

function extractIngredientsFromText(fullText) {
  const headerPatterns = [
    /전\s*성\s*분/i,
    /성\s*분/i,
    /ingredients?/i,
    /full\s*ingredients?/i,
    /ingredient\s*list/i,
  ];
  let startIndex = null;
  for (const pattern of headerPatterns) {
    const match = pattern.exec(fullText);
    if (match) {
      startIndex = match.index;
      break;
    }
  }
  let ingredientsText = startIndex !== null ? fullText.slice(startIndex) : fullText;
  const endMarkers = [
    '용량', '사용법', '화장품책임판매업자', '피엘인터내셔널',
    'directions', 'how to use', 'usage', 'manufacturer', 'distributor', 'volume'
  ];
  const splitPattern = new RegExp(endMarkers.join('|'), 'i');
  ingredientsText = ingredientsText.split(splitPattern)[0];
  ingredientsText = ingredientsText.replace(/(전\s*성\s*분|ingredients?|full\s*ingredients?|ingredient\s*list)/gi, '');
  ingredientsText = ingredientsText.replace(/\s+/g, ' ').trim();
  return ingredientsText;
}

export async function extractIngredientsService(secretKey, apiUrl, imagePath, imageFormat = 'png') {
  try {
    if (!secretKey || !apiUrl || !imagePath) {
      throw new Error('Missing required parameters: secretKey, apiUrl, and imagePath are required');
    }
  const csvPath = path.join(__dirname, '..', '..', 'data', 'cosing_ingredients.csv');
    const ocrData = await callNaverOcr({ secretKey, apiUrl, imagePath, imageFormat });
    if (!ocrData?.images?.[0]?.fields) {
      throw new Error('Invalid OCR response format');
    }
    const sortedFields = sortFieldsByPosition(ocrData.images[0].fields);
    const fullText = sortedFields.map(field => field.inferText || '').join(' ');
    const ingredientsText = extractIngredientsFromText(fullText);
    const ingredientList = await loadINCIList(csvPath);
    const tokens = ingredientsText.split(',').map(token => token.trim().toLowerCase()).filter(Boolean);
    const foundIngredients = matchIngredientsWithDatabase(tokens, ingredientList);
    return {
      success: true,
      text_length: fullText.length,
      ingredients_found: foundIngredients.length,
      ingredients: foundIngredients
    };
  } catch (error) {
    console.error('Error extracting ingredients:', error.message);
    return {
      success: false,
      error: error.message,
      ingredients_found: 0,
      ingredients: []
    };
  }
}
