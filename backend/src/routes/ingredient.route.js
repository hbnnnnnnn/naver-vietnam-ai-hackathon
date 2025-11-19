import express from 'express';
import multer from 'multer';
import { productAnalyzeFromImages } from '../controllers/ingredient.controller.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 }
]), productAnalyzeFromImages);

export default router;
