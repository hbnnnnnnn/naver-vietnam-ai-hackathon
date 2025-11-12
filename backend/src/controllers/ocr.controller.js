import { extractIngredientsService } from '../services/ocr.service.js';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Handles OCR image upload and ingredient extraction
 * @param {Request} req
 * @param {Response} res
 */
export const extractIngredientsFromImage = async (req, res) => {
  try {
    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    const imagePath = path.resolve(imageFile.path);
    const secretKey = process.env.OCR_SECRET_KEY;
    const apiUrl = process.env.OCR_API_URL;
    if (!secretKey || !apiUrl) {
      return res.status(500).json({ error: 'OCR API credentials are not set in environment variables.' });
    }
    const result = await extractIngredientsService(secretKey, apiUrl, imagePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
