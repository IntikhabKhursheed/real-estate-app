const { model } = require('../config/gemini');

function buildFallbackValuation(propertyData, reason) {
  const {
    city,
    propertyType,
    bedrooms = 0,
    bathrooms = 0,
    areaSqFt = 0,
    propertyAge = 0,
    amenities = []
  } = propertyData || {};

  const normalizedCity = String(city || '').trim().toLowerCase();
  const normalizedType = String(propertyType || '').trim().toLowerCase();

  const cityMultiplier = getCityMultiplier(normalizedCity);
  const typeMultiplier = getPropertyTypeMultiplier(normalizedType);
  const baseRatePerSqFt = 12000;
  const amenityBonus = Math.min(Array.isArray(amenities) ? amenities.length : 0, 6) * 45000;
  const bedroomBonus = Number(bedrooms || 0) * 160000;
  const bathroomBonus = Number(bathrooms || 0) * 80000;
  const ageDiscount = Math.min(Number(propertyAge || 0) * 0.01, 0.2);

  const rawEstimate = (
    Number(areaSqFt || 0) * baseRatePerSqFt * cityMultiplier * typeMultiplier
    + bedroomBonus
    + bathroomBonus
    + amenityBonus
  ) * (1 - ageDiscount);

  const estimatedPrice = Math.max(0, Math.round(rawEstimate));

  return {
    estimatedPrice,
    confidence: 'Low',
    investmentRating: 6,
    reasoning: [
      'Gemini is temporarily rate-limited, so this is a conservative fallback estimate.',
      `Estimate is based on ${areaSqFt || 0} sq ft, ${bedrooms || 0} bedrooms, and ${bathrooms || 0} bathrooms.`,
      city ? `Market adjustment applied for ${city}.` : 'No city-specific adjustment was available.',
      `Property type adjustment applied for ${propertyType || 'unknown property type'}.`,
      Array.isArray(amenities) && amenities.length > 0
        ? 'Amenities were included as a small uplift in the fallback model.'
        : 'No amenities were provided, so no extra uplift was applied.'
    ],
    source: 'fallback',
    note: reason || 'Fallback estimate generated because the AI valuation service was unavailable.'
  };
}

function getCityMultiplier(city) {
  if (['islamabad', 'faisalabad', 'rawalpindi'].includes(city)) return 1.12;
  if (['lahore', 'karachi'].includes(city)) return 1.08;
  if (['peshawar', 'multan', 'sialkot', 'gujranwala'].includes(city)) return 0.98;
  return 1.0;
}

function getPropertyTypeMultiplier(propertyType) {
  if (propertyType === 'commercial') return 1.18;
  if (propertyType === 'apartment') return 1.04;
  if (propertyType === 'house') return 1.08;
  if (propertyType === 'plot') return 0.94;
  return 1.0;
}

function isGeminiQuotaError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  return [
    '429',
    'too many requests',
    'quota',
    'rate limit',
    'resource_exhausted',
    'service unavailable',
    'failed to fetch',
    'fetching from'
  ].some(token => message.includes(token));
}

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
    if (isGeminiQuotaError(error)) {
      return buildFallbackValuation(propertyData, error.message);
    }

    throw new Error('Property valuation is temporarily unavailable. Please try again later.');
  }
};

module.exports = {
  estimatePropertyValue
};
