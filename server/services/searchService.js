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
    return parseQueryLocally(query);
  }
};

function parseQueryLocally(query) {
  const normalized = String(query || '').trim().toLowerCase();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const filter = {
    city: extractCity(normalized),
    propertyType: extractPropertyType(normalized),
    minBedrooms: extractBedrooms(normalized).min,
    maxBedrooms: extractBedrooms(normalized).max,
    minBathrooms: extractBathrooms(normalized).min,
    maxBathrooms: extractBathrooms(normalized).max,
    minPrice: extractPrice(normalized).min,
    maxPrice: extractPrice(normalized).max,
    amenities: extractAmenities(tokens)
  };

  return filter;
}

function extractCity(query) {
  const knownCities = [
    'islamabad',
    'lahore',
    'karachi',
    'peshawar',
    'rawalpindi',
    'multan',
    'faisalabad',
    'sialkot',
    'gujranwala'
  ];

  const match = knownCities.find(city => query.includes(city));
  return match ? capitalize(match) : null;
}

function extractPropertyType(query) {
  if (/\b(commercial|shop|office|plaza)\b/.test(query)) return 'Commercial';
  if (/\b(apartment|flat|condo)\b/.test(query)) return 'Apartment';
  if (/\b(plot|land|lot)\b/.test(query)) return 'Plot';
  if (/\b(villa|house|home|bungalow)\b/.test(query)) return 'House';
  return null;
}

function extractBedrooms(query) {
  const match = query.match(/(\d+)\s*(?:-?\s*bed(?:room)?s?|\s*bed(?:room)?s?)/i);
  if (!match) {
    return { min: null, max: null };
  }

  const count = Number(match[1]);
  return Number.isNaN(count) ? { min: null, max: null } : { min: count, max: count };
}

function extractBathrooms(query) {
  const match = query.match(/(\d+)\s*(?:-?\s*bath(?:room)?s?|\s*bath(?:room)?s?)/i);
  if (!match) {
    return { min: null, max: null };
  }

  const count = Number(match[1]);
  return Number.isNaN(count) ? { min: null, max: null } : { min: count, max: count };
}

function extractPrice(query) {
  const underMatch = query.match(/under\s+\$?([\d,.]+)\s*(crore|crores|lakh|lakhs|million|millions|thousand|thousands)?/i);
  const aboveMatch = query.match(/above\s+\$?([\d,.]+)\s*(crore|crores|lakh|lakhs|million|millions|thousand|thousands)?/i);
  const aroundMatch = query.match(/(?:around|about|near)\s+\$?([\d,.]+)\s*(crore|crores|lakh|lakhs|million|millions|thousand|thousands)?/i);

  if (underMatch) {
    return { min: 0, max: convertAmountToNumber(underMatch[1], underMatch[2]) };
  }

  if (aboveMatch) {
    return { min: convertAmountToNumber(aboveMatch[1], aboveMatch[2]), max: null };
  }

  if (aroundMatch) {
    const value = convertAmountToNumber(aroundMatch[1], aroundMatch[2]);
    return { min: Math.max(0, Math.round(value * 0.8)), max: Math.round(value * 1.2) };
  }

  return { min: null, max: null };
}

function extractAmenities(tokens) {
  const amenities = [];
  const includes = (keyword) => tokens.some(token => token.includes(keyword));

  if (includes('pool')) amenities.push('pool');
  if (includes('gym')) amenities.push('gym');
  if (includes('parking')) amenities.push('parking');
  if (includes('garden')) amenities.push('garden');
  if (includes('balcony')) amenities.push('balcony');
  if (includes('security')) amenities.push('security');

  return amenities;
}

function convertAmountToNumber(amount, unit) {
  const value = Number(String(amount).replace(/,/g, ''));
  if (Number.isNaN(value)) {
    return 0;
  }

  const normalizedUnit = String(unit || '').toLowerCase();
  if (normalizedUnit.includes('crore')) return value * 10000000;
  if (normalizedUnit.includes('lakh')) return value * 100000;
  if (normalizedUnit.includes('million')) return value * 1000000;
  if (normalizedUnit.includes('thousand')) return value * 1000;

  return value;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = {
  searchProperties
};
