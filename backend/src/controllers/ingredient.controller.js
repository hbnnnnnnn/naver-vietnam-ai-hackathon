import { runOcrService, getOcrTextFromData } from "../services/ocr.service.js";
import { convertImageToPng } from "../services/imageConvert.service.js";
import { extractIngredientsFromTextService } from "../services/ingredientExtract.service.js";
import { extractProductInfoFromTextService } from "../services/productInfoExtract.service.js";
import { summarizeBenefitsFromIngredients } from "../services/benefitSummarization.service.js";
import { calculateSuitableScore } from "../services/calcSuitableScore.service.js";
import path from "path";
import dotenv from "dotenv";
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
    let user_skin = req.body.userSkin;

    if (typeof user_skin === "string") {
      user_skin = [user_skin];
    }

    if (!frontImageFile || !backImageFile) {
      return res
        .status(400)
        .json({ error: "Both front and back images are required." });
    }
    let frontImagePath = path.resolve(frontImageFile.path);
    let backImagePath = path.resolve(backImageFile.path);

    // Convert images to PNG if needed
    // frontImagePath = await convertImageToPng(frontImagePath);
    // backImagePath = await convertImageToPng(backImagePath);
    const secretKey = process.env.OCR_SECRET_KEY;
    const apiUrl = process.env.OCR_API_URL;
    if (!secretKey || !apiUrl) {
      return res.status(500).json({
        error: "OCR API credentials are not set in environment variables.",
      });
    }

    const startOcr = Date.now();
    const [frontOcrData, backOcrData] = await Promise.all([
      runOcrService(secretKey, apiUrl, frontImagePath),
      runOcrService(secretKey, apiUrl, backImagePath)
    ]);

    // Get OCR text from both images
    const frontOcrText = getOcrTextFromData(frontOcrData);
    const backOcrText = getOcrTextFromData(backOcrData);
    console.log(backOcrText);

    const startExtract = Date.now();
    const [ingredientResult, productInfo] = await Promise.all([
      extractIngredientsFromTextService(backOcrText),
      extractProductInfoFromTextService(frontOcrText)
    ]);
    
    // Ensure all risk levels are present in the result
    const riskLevels = ["no-risk", "low-risk", "moderate-risk", "high-risk"];
    const groupedByRisk = ingredientResult.reduce((acc, ingredient) => {
      const riskLevel = ingredient.risk_level.toLowerCase() || 'unknown';
      if (!acc[riskLevel]) {
        acc[riskLevel] = [];
      }
      acc[riskLevel].push({
        name: ingredient.name,
        reason: ingredient.reason,
      });
      return acc;
    }, {});
    // Add missing risk levels as empty arrays
    riskLevels.forEach((level) => {
      if (!groupedByRisk[level]) {
        groupedByRisk[level] = [];
      }
    });

    // Calculate suitability scores
    const suitabilityScores = Array.isArray(user_skin) && user_skin.length > 0
      ? calculateSuitableScore(ingredientResult, user_skin)
      : null;
    
    // Summarize benefits from ingredients using LLM
    const summarizedBenefits = await summarizeBenefitsFromIngredients(ingredientResult);
    
    // Enrich product info by combining original benefits with ingredient-based benefits
    const enrichedProductInfo = {
      ...productInfo,
      benefits: [...productInfo.benefits, ...summarizedBenefits],
    };

    // If no ingredients or no product info found, set success to false
    const hasIngredients = Array.isArray(ingredientResult) && ingredientResult.length > 0;
    const hasProductInfo = productInfo && Array.isArray(productInfo.benefits) && productInfo.benefits.length > 0;
    const success = hasIngredients && hasProductInfo;
    res.json({
    success,
    data: success
        ? {
            product: enrichedProductInfo,
            suitable: suitabilityScores,
            risk: groupedByRisk,
            ingredients: ingredientResult,
        }
        : null,
    });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
