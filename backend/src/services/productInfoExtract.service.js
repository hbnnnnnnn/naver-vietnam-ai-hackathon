import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

/**
 * Extracts product info (name, brand, category, benefits) from OCR text using NAVER LLM
 * @param {string} ocrText - Raw OCR text from product packaging
 * @returns {Promise<Object>} Extracted product info
 */
export async function extractProductInfoFromTextService(ocrText) {
	if (!ocrText || typeof ocrText !== 'string') {
		return {
			name: '',
			brand: '',
			category: '',
			benefits: []
		};
	}

	const prompt = `Given the following OCR text from a skincare product, extract and return a JSON object with ONLY these fields:
	- name: The full product name
	- brand: The brand name
	- category: The product category (e.g. Brightening Serum, Cleanser, etc.)
	- benefits: Array of key benefits (each as a short string)
OCR Text:\n${ocrText}\nReturn a single JSON object with these fields, no extra text.`;

	// Setup API credentials
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	dotenv.config({ path: path.join(__dirname, '../../.env') });
	const apiKey = process.env.HYPER_CLOVA_API_KEY;
	const apiUrl = process.env.HYPER_CLOVA_API_URL;

	if (!apiKey || !apiUrl) {
		throw new Error('HYPER CLOVA API credentials not set');
	}

	try {
		const response = await axios.post(
			apiUrl,
			{
				messages: [
					{
						role: 'system',
						content: 'You are a skincare product expert. Extract accurate, concise product info in JSON format.'
					},
					{
						role: 'user',
						content: prompt
					},
				],
				response_format: { "type": "json_object" },
				maxTokens: 1000,
				temperature: 0.3,
				topP: 0.8,
				repeatPenalty: 1.2
			},
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				}
			}
		);

		const content = response.data?.result?.message?.content || response.data?.message?.content;
		if (!content) {
			throw new Error('Invalid LLM response format');
		}

		// Try direct JSON parsing first
		try {
			const productData = JSON.parse(content);
			return {
				name: productData.name || '',
				brand: productData.brand || '',
				category: productData.category || '',
				benefits: Array.isArray(productData.benefits) ? productData.benefits : []
			};
		} catch (directParseError) {
			// Fallback: extract JSON object with regex
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No JSON found in LLM response');
			}
			const productData = JSON.parse(jsonMatch[0]);
			return {
				name: productData.name || '',
				brand: productData.brand || '',
				category: productData.category || '',
				benefits: Array.isArray(productData.benefits) ? productData.benefits : []
			};
		}
	} catch (error) {
		console.error('Error calling HYPER CLOVA LLM for product info:', error.message);
		// Fallback: return empty fields
		return {
			name: '',
			brand: '',
			category: '',
			benefits: []
		};
	}
}