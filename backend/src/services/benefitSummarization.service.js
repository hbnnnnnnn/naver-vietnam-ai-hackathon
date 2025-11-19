import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

/**
 * Summarizes benefits from ingredient list using NAVER Hyper CLOVA LLM
 * @param {Array<Object>} ingredients - Array of ingredient objects with benefits
 * @returns {Promise<Array<string>>} Summarized benefits
 */
export async function summarizeBenefitsFromIngredients(ingredients) {
	if (!Array.isArray(ingredients) || ingredients.length === 0) {
		return [];
	}

	// Extract all benefits from ingredients
	const allBenefits = ingredients
		.flatMap(ingredient => ingredient.benefits || [])
		.filter(benefit => benefit && benefit.trim().length > 0);

	if (allBenefits.length === 0) {
		return [];
	}

	// Create prompt for LLM
	const benefitsList = allBenefits.map((benefit, idx) => `${idx + 1}. ${benefit}`).join('\n');
	
	const prompt = `Given the following benefits from various skincare ingredients, summarize them into 3-5 key product benefits. Make them concise, clear, and consumer-friendly.

Ingredient Benefits:
${benefitsList}

Return a JSON object with a single field "benefits" containing an array of 3-5 summarized benefit strings. Each benefit should be a short phrase (5-10 words).`;

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
						content: 'You are a skincare expert who summarizes ingredient benefits into clear, consumer-friendly product benefits. Return only valid JSON.'
					},
					{
						role: 'user',
						content: prompt
					},
				],
				response_format: { "type": "json_object" },
				maxTokens: 500,
				temperature: 0.5,
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

		// Parse JSON response
		try {
			const result = JSON.parse(content);
			return Array.isArray(result.benefits) ? result.benefits : [];
		} catch (directParseError) {
			// Fallback: extract JSON object with regex
			const jsonMatch = content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No JSON found in LLM response');
			}
			const result = JSON.parse(jsonMatch[0]);
			return Array.isArray(result.benefits) ? result.benefits : [];
		}
	} catch (error) {
		console.error('Error calling HYPER CLOVA LLM for benefit summarization:', error.message);
		// Fallback: return empty array
		return [];
	}
}
