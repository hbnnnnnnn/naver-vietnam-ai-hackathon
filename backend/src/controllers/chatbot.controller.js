import dotenv from 'dotenv';
dotenv.config();
import ClovaChatbot from "../services/clovaChatbot.service.js";

const secretKey = process.env.CLOVA_CHATBOT_SECRET_KEY || '';
const apiUrl = process.env.CLOVA_CHATBOT_INVOKE_URL || '';
const domainId = process.env.CLOVA__CHATBOT_DOMAIN_ID

const chatbot = new ClovaChatbot(
  apiUrl,
  secretKey
);

export const sendMessageToChatbot = async (req, res) => {
    try {
        const { message, userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'UserID is required.' });
        }
        const response = await chatbot.sendMessage(message, userId);
        return res.status(200).json(response);

    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data 
        });
    }
}

export const getOpenMessage = async (req, res) => {
    try {
        const response = await chatbot.openMessage();
        return res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: error.response?.data 
        });
    }
}