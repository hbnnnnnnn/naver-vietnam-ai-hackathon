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

  async sendMessage(message, userId = 'guest') {
    const timestamp = Date.now();

    const payload = {
      version: 'v2',
      userId: userId,
      timestamp: timestamp,
      bubbles: [
        {
          type: 'text',
          data: {
            description: message
          }
        }
      ],
      event: 'send'
    };

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

      const replyBubble = response.data.bubbles?.[0];
      if (!replyBubble) return 'No response';

      if (replyBubble.type === 'text') {
        return replyBubble.data.description;
      }
      if (replyBubble.type === 'template' && replyBubble.data?.cover?.data?.description) {
        return replyBubble.data.cover.data.description;
      }

      return 'Rich message received (buttons/image)';
    } catch (error) {
      console.error('CLOVA Chatbot Error:', error.response?.data || error.message);
      throw error;
    }
  }
  async openMessage(message, userId = 'guest') {
    const timestamp = Date.now();

    const payload = {
      version: 'v2',
      userId: userId,
      timestamp: timestamp,
      bubbles: [
        {
          type: 'text',
          data: {
            description: message
          }
        }
      ],
      event: 'open'
    };

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

      const replyBubble = response.data.bubbles?.[0];
      if (!replyBubble) return 'No response';

      if (replyBubble.type === 'text') {
        return replyBubble.data.description;
      }
      if (replyBubble.type === 'template' && replyBubble.data?.cover?.data?.description) {
        return replyBubble.data.cover.data.description;
      }

      return 'Rich message received (buttons/image)';
    } catch (error) {
      console.error('CLOVA Chatbot Error:', error.response?.data || error.message);
      throw error;
    }
  }
}