import { runOcrService, getOcrTextFromData } from '../services/ocr.service.js';
import { extractIngredientsFromTextService } from '../services/ingredientExtract.service.js';
import { extractProductInfoFromTextService } from '../services/productInfoExtract.service.js';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Handles product analysis from front and back images
 * @param {Request} req
 * @param {Response} res
 */
export const productAnalyzeFromImages = async (req, res) => {
  try {
    const frontImageFile = req.files?.frontImage?.[0];
    const backImageFile = req.files?.backImage?.[0];
    if (!frontImageFile || !backImageFile) {
      return res.status(400).json({ error: 'Both front and back images are required.' });
    }
    const frontImagePath = path.resolve(frontImageFile.path);
    const backImagePath = path.resolve(backImageFile.path);
    const secretKey = process.env.OCR_SECRET_KEY;
    const apiUrl = process.env.OCR_API_URL;
    if (!secretKey || !apiUrl) {
      return res.status(500).json({ error: 'OCR API credentials are not set in environment variables.' });
    }

    // Run OCR on both images
    const frontOcrData = await runOcrService(secretKey, apiUrl, frontImagePath);
    const backOcrData = await runOcrService(secretKey, apiUrl, backImagePath);

    // Get OCR text from both images
    const frontOcrText = getOcrTextFromData(frontOcrData);
    const backOcrText = getOcrTextFromData(backOcrData);

    // Extract ingredients from back image OCR text
    const ingredientResult = await extractIngredientsFromTextService(backOcrText);
    const productInfo = await extractProductInfoFromTextService(frontOcrText);
    
    res.json({
        status: 'success',
        data: {
            product: productInfo,
            risk: {},
            suitable: {},
            ingredients: ingredientResult
        }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
