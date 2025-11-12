import express from 'express';
import multer from 'multer';
import { extractIngredientsFromImage } from '../controllers/ocr.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /ocr/extract-ingredients - Extract ingredients from image
router.post('/extract-ingredients', upload.single('image'), extractIngredientsFromImage);

export default router;
