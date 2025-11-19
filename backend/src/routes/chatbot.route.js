import express from 'express';
import { sendMessageToChatbot, getOpenMessage } from '../controllers/chatbot.controller.js';

const router = express.Router();

router.post('/', sendMessageToChatbot);
router.post('/open', getOpenMessage);

export default router;