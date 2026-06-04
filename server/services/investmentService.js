const { model } = require('../config/gemini');

function buildFallbackInvestmentScore(property, reason) {
  const {
    city = 'Unknown',
    price = 0,
    bedrooms = 0,
    bathrooms = 0,
    areaSqFt = 0,
    propertyType = 'Unknown',
    amenities = [],
    propertyAge = 0
  } = property || {};

  let score = 5.5;

  if (Number(areaSqFt || 0) > 0) {
    const pricePerSqFt = Number(price || 0) / Number(areaSqFt || 1);
    if (pricePerSqFt < 15000) score += 1.2;
    else if (pricePerSqFt < 25000) score += 0.6;
    else if (pricePerSqFt > 40000) score -= 1.0;
  }

  if (Number(bedrooms || 0) >= 3) score += 0.4;
  if (Number(bathrooms || 0) >= 2) score += 0.3;
  if (Number(propertyAge || 0) <= 10) score += 0.4;
  if (['apartment', 'house', 'commercial'].includes(String(propertyType || '').toLowerCase())) score += 0.2;
  if (Array.isArray(amenities) && amenities.length > 0) score += Math.min(amenities.length, 4) * 0.1;
  if (['lahore', 'karachi', 'islamabad', 'rawalpindi'].includes(String(city || '').toLowerCase())) score += 0.3;

  const normalized = Math.max(1, Math.min(10, Number(score.toFixed(1))));

  return {
    investmentScore: normalized,
    confidence: 'Low',
    reasoning: [
      'Gemini is temporarily unavailable, so this is a conservative fallback score.',
      `Based on ${bedrooms || 0} bedrooms, ${bathrooms || 0} bathrooms, and ${areaSqFt || 0} sq ft.`,
      city ? `City adjustment applied for ${city}.` : 'No city-specific adjustment was available.',
      `Property type considered as ${propertyType || 'unknown'} for the fallback model.`,
      Array.isArray(amenities) && amenities.length > 0
        ? 'Amenities contributed a small positive adjustment.'
        : 'No amenities were provided for extra adjustment.'
    ],
    source: 'fallback',
    note: reason || 'Fallback score generated because the AI investment service was unavailable.'
  };
}

/**
 * Calculate an investment score for a property using Gemini AI.
 * 
 * @param {Object} property - Property object containing:
 *   - city: string
 *   - price: number
 *   - bedrooms: number
 *   - bathrooms: number
 *   - areaSqFt: number
 *   - propertyType: string
 *   - amenities: string[] (optional)
 *   - propertyAge: number (optional, in years)
 * @returns {Promise<Object>} Investment score object with score, confidence, and reasoning
 */
const calculateInvestmentScore = async (property) => {
  try {
    if (!property || typeof property !== 'object') {
      throw new Error('Property must be a valid object');
    }

    const {
      city = 'Unknown',
      price = 0,
      bedrooms = 0,
      bathrooms = 0,
      areaSqFt = 0,
      propertyType = 'Unknown',
      amenities = [],
      propertyAge = 0
    } = property;

    const prompt = `You are a professional real estate investment analyst. Evaluate the investment potential of the following property and provide a comprehensive investment score.

Property Details:
- City: ${city}
- Price: $${price}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Area: ${areaSqFt} sq ft
- Property Type: ${propertyType}
- Amenities: ${amenities.length > 0 ? amenities.join(', ') : 'None specified'}
- Property Age: ${propertyAge} years

Analyze the property considering:
1. Location attractiveness and market demand in ${city}
2. Price-to-area ratio and value proposition
3. Rental yield potential
4. Capital appreciation likelihood
5. Property condition and maintenance costs (based on age)
6. Amenities and desirability factors
7. Market trends and future development potential

Provide your analysis in the following JSON format ONLY:
{
  "investmentScore": number (1-10, where 10 is excellent investment),
  "confidence": "High" | "Medium" | "Low",
  "reasoning": [
    "reason 1",
    "reason 2",
    "reason 3",
    "reason 4",
    "reason 5"
  ]
}

Guidelines:
- investmentScore must be between 1 and 10
- confidence reflects how certain you are about this assessment
- reasoning should be an array of 4-5 specific, actionable insights
- Consider local market conditions and economic factors for ${city}
- Respond with ONLY valid JSON, no markdown formatting or extra text`;

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

    // Parse the JSON response
    let investmentData;
    try {
      investmentData = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Failed to parse investment score response as JSON: ${parseError.message}. Response text was: "${text}"`);
    }

    // Validate the structure
    if (!investmentData || typeof investmentData !== 'object') {
      throw new Error('Investment score response is not a valid object');
    }

    const { investmentScore, confidence, reasoning } = investmentData;

    // Validate required fields
    if (
      investmentScore === undefined ||
      typeof investmentScore !== 'number' ||
      investmentScore < 1 ||
      investmentScore > 10
    ) {
      throw new Error('Investment score must be a number between 1 and 10');
    }

    if (!['High', 'Medium', 'Low'].includes(confidence)) {
      throw new Error('Confidence must be one of: High, Medium, or Low');
    }

    if (!Array.isArray(reasoning) || reasoning.length === 0) {
      throw new Error('Reasoning must be a non-empty array of strings');
    }

    return {
      investmentScore,
      confidence,
      reasoning
    };
  } catch (error) {
    return buildFallbackInvestmentScore(property, error.message);
  }
};

module.exports = {
  calculateInvestmentScore
};
