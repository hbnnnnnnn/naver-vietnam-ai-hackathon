import express from 'express';
import { getUVIndex } from '../controllers/weather.controller.js';

const router = express.Router();

router.get('/', getUVIndex);

export default router;