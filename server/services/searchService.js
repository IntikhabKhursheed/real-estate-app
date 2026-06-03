const { model } = require('../config/gemini');

/**
 * Parse a natural language query into structured property search filters using Gemini AI.
 * 
 * @param {string} query - Natural language search query (e.g., "3-bedroom house in Islamabad under 2 crore")
 * @returns {Promise<Object>} Structured filter object with search criteria
 */
const searchProperties = async (query) => {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query must be a non-empty string');
    }

    const prompt = `You are a real estate search assistant. Parse the following natural language property search query and convert it into a structured filter object.

Query: "${query}"

Extract the following information if present in the query:
- city (location/area name)
- propertyType (e.g., house, apartment, condo, villa, commercial, land)
- bedrooms (min and max)
- bathrooms (min and max)
- price range in any currency (convert to a reasonable numeric range; if currency is not USD, provide approximate USD conversion)
- amenities (e.g., pool, gym, parking, garden, balcony)

Return ONLY a valid JSON object with this structure (use null for missing values, empty array for amenities if not mentioned):
{
  "city": string or null,
  "propertyType": string or null,
  "minBedrooms": number or null,
  "maxBedrooms": number or null,
  "minBathrooms": number or null,
  "maxBathrooms": number or null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "amenities": string[]
}

Guidelines:
- If only one bedroom/bathroom number is mentioned, use it for both min and max
- For price: if "under X" is mentioned, set minPrice to 0 and maxPrice to X; if "above X", set minPrice to X
- If a price is given with a currency indicator (crore, lakh, thousand, etc.), convert appropriately
- Keep amenities as a simple array of lowercase strings
- Respond with ONLY valid JSON, no other text`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    if (!text) {
      throw new Error('Received empty response from Gemini AI');
    }

    // Parse the JSON response
    let structuredFilter;
    try {
      structuredFilter = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Failed to parse Gemini response as JSON: ${parseError.message}`);
    }

    // Validate the structure
    if (!structuredFilter || typeof structuredFilter !== 'object') {
      throw new Error('Gemini response is not a valid object');
    }

    // Ensure all expected fields exist
    const filter = {
      city: structuredFilter.city || null,
      propertyType: structuredFilter.propertyType || null,
      minBedrooms: structuredFilter.minBedrooms || null,
      maxBedrooms: structuredFilter.maxBedrooms || null,
      minBathrooms: structuredFilter.minBathrooms || null,
      maxBathrooms: structuredFilter.maxBathrooms || null,
      minPrice: structuredFilter.minPrice || null,
      maxPrice: structuredFilter.maxPrice || null,
      amenities: Array.isArray(structuredFilter.amenities) ? structuredFilter.amenities : []
    };

    return filter;
  } catch (error) {
    throw new Error(`Search service error: ${error.message}`);
  }
};

module.exports = {
  searchProperties
};
