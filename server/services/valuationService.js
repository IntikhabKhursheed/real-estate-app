const { model } = require('../config/gemini');

/**
 * Estimate the value of a property based on its characteristics using Gemini AI.
 * 
 * @param {Object} propertyData
 * @param {string} propertyData.city
 * @param {string} propertyData.country
 * @param {string} propertyData.propertyType
 * @param {number} propertyData.bedrooms
 * @param {number} propertyData.bathrooms
 * @param {number} propertyData.areaSqFt
 * @param {number} propertyData.propertyAge
 * @param {string[]} propertyData.amenities
 * 
 * @returns {Promise<Object>} Object containing estimatedPrice, confidence, investmentRating, and reasoning.
 */
const estimatePropertyValue = async (propertyData) => {
  try {
    const {
      city,
      country,
      propertyType,
      bedrooms,
      bathrooms,
      areaSqFt,
      propertyAge,
      amenities
    } = propertyData;

    // Structured prompt requiring JSON output
    const prompt = `You are a real estate valuation expert. Estimate the property value and analysis for the following property details:
- City: ${city || 'Unknown'}
- Country: ${country || 'Unknown'}
- Property Type: ${propertyType || 'Unknown'}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Area: ${areaSqFt} sq ft
- Property Age: ${propertyAge} years
- Amenities: ${(amenities || []).join(', ')}

Provide an estimate in the following JSON format:
{
  "estimatedPrice": number,
  "confidence": "High" | "Medium" | "Low",
  "investmentRating": number (scale 1-10),
  "reasoning": string[]
}

Respond ONLY with valid JSON. Do not include any conversational filler, markdown formatting (like \`\`\`json), or extra text outside the JSON object.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (!text) {
      throw new Error('Received empty response from Gemini AI');
    }

    // Clean up markdown block styling if present
    text = text.trim();
    if (text.startsWith('```')) {
      // Find first newline to strip language identifier (e.g., ```json)
      const firstNewLine = text.indexOf('\n');
      if (firstNewLine !== -1) {
        text = text.substring(firstNewLine + 1);
      } else {
        text = text.replace(/^```[a-zA-Z]*/, '');
      }
      // Remove trailing ```
      text = text.replace(/```$/, '').trim();
    }

    // Safely parse Gemini response to valid JSON
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Failed to parse valuation response as JSON: ${parseError.message}. Response text was: "${text}"`);
    }

    // Extract and standardize fields
    const { estimatedPrice, confidence, investmentRating, reasoning } = parsedData;

    // Validate that we have the required structure
    if (estimatedPrice === undefined || confidence === undefined || investmentRating === undefined || !Array.isArray(reasoning)) {
      throw new Error('Valuation response JSON is missing required fields or has an invalid structure');
    }

    return {
      estimatedPrice,
      confidence,
      investmentRating,
      reasoning
    };
  } catch (error) {
    throw new Error(`Property valuation service error: ${error.message}`);
  }
};

module.exports = {
  estimatePropertyValue
};
