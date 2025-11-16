import express from 'express';
import multer from 'multer';
import { productAnalyzeFromImages } from '../controllers/productAnalyze.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /product-analyze/upload - Upload front and back images for product analysis
router.post('/upload', upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 }
]), productAnalyzeFromImages);

export default router;
