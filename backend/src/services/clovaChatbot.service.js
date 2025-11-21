import crypto from 'crypto';
import axios from 'axios';

export default class ClovaChatbot {
  constructor(invokeUrl, secretKey) {
    this.invokeUrl = invokeUrl;
    this.secretKey = secretKey;
  }

  generateSignature(bodyString) {
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(bodyString)
      .digest('base64');
  }

  async sendText(message, userId = 'guest') {
    const timestamp = Date.now();
    const payload = {
      version: 'v2',
      userId,
      timestamp,
      bubbles: [
        {
          type: 'text',
          data: { description: message }
        }
      ],
      event: 'send'
    };

    return this.request(payload);
  }

  async sendPostback(postbackValue, userId = 'guest', postbackFull = null) {
    const timestamp = Date.now();
    const payload = {
      version: 'v2',
      userId,
      timestamp,
      bubbles: [
        {
          type: 'event',
          data: {
            type: 'postback',
            data: {
              postback: postbackValue,
              postbackFull: postbackFull || `_T_${postbackValue}`  // default format used by most builders
            }
          }
        }
      ],
      event: 'send'
    };

    return this.request(payload);
  }

  async sendWelcome(userId = 'guest') {
    const timestamp = Date.now();
    const payload = {
      version: 'v2',
      userId,
      timestamp,
      bubbles: [
        {
          type: 'text',
          data: { description: 'welcome' }  
        }
      ],
      event: 'open'
    };

    return this.request(payload);
  }

  // Shared request method (DRY)
  async request(payload) {
    const bodyString = JSON.stringify(payload);
    const signature = this.generateSignature(bodyString);

    try {
      const response = await axios.post(this.invokeUrl, payload, {
        headers: {
          'Content-Type': 'application/json;UTF-8',
          'X-NCP-CHATBOT_SIGNATURE': signature
        },
        timeout: 10000
      });

      return response.data; 
    } catch (error) {
      const err = error.response?.data || error.message;
      console.error('CLOVA Chatbot API Error:', err);
      throw new Error(`Chatbot error: ${JSON.stringify(err)}`);
    }
  }
}