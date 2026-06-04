const { model } = require('../config/gemini');

function buildAreaMarketData(properties = []) {
  const areaMap = new Map();

  properties.forEach(property => {
    const areaName = (property.areaName || property.area || property.city || 'Unknown area').trim();
    const areaMarla = Number(property.areaMarla || 0);
    const price = Number(property.price || 0);

    if (price <= 0 || areaMarla <= 0) {
      return;
    }

    const pricePerMarla = price / areaMarla;
    const current = areaMap.get(areaName) || {
      area: areaName,
      averagePricePerMarla: 0,
      totalPricePerMarla: 0,
      listingCount: 0
    };

    current.totalPricePerMarla += pricePerMarla;
    current.listingCount += 1;
    current.averagePricePerMarla = Math.round(current.totalPricePerMarla / current.listingCount);
    areaMap.set(areaName, current);
  });

  return Array.from(areaMap.values())
    .sort((a, b) => b.listingCount - a.listingCount || a.averagePricePerMarla - b.averagePricePerMarla)
    .map(({ totalPricePerMarla, ...area }) => area);
}

function cleanGeminiText(text) {
  if (!text) return '';

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    const firstNewLine = cleaned.indexOf('\n');
    if (firstNewLine !== -1) {
      cleaned = cleaned.substring(firstNewLine + 1);
    } else {
      cleaned = cleaned.replace(/^```[a-zA-Z]*/, '');
    }

    cleaned = cleaned.replace(/```$/, '').trim();
  }

  return cleaned;
}

async function generateMarketTrends(city, properties = []) {
  try {
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      throw new Error('City must be a non-empty string');
    }

    const cityName = city.trim();
    const areaMarketData = buildAreaMarketData(properties);
    const totalListings = properties.length;
    const prompt = `You are a Pakistani real estate market analyst. Analyze the city market data below and return a concise but insightful market intelligence report in JSON only.

City: ${cityName}
Total Listings in Dataset: ${totalListings}

Area-level market snapshot:
${areaMarketData.length > 0
  ? areaMarketData.map(area => `- ${area.area}: average price per marla PKR ${area.averagePricePerMarla.toLocaleString('en-PK')} across ${area.listingCount} listing(s)`).join('\n')
  : '- No local listing data is available, so provide a city-level market estimate based on your general knowledge.'}

Return ONLY valid JSON in this exact structure:
{
  "city": string,
  "priceTrend": "Rising" | "Stable" | "Falling",
  "averagePricePerMarlaByArea": [
    {
      "area": string,
      "averagePricePerMarla": number,
      "listingCount": number,
      "trend": "Rising" | "Stable" | "Falling"
    }
  ],
  "bestAreasToInvest": [
    {
      "area": string,
      "reason": string
    }
  ],
  "marketSummary": string,
  "investmentRecommendation": string
}

Guidelines:
- Use only the provided area names when local listing data exists
- Keep the analysis practical for investors in ${cityName}
- If local data is sparse, note that in the summary and provide a careful estimate
- marketSummary should be one short paragraph
- investmentRecommendation should be action-oriented and specific
- Respond with ONLY JSON, no markdown or extra text`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = cleanGeminiText(response.text());

    if (!text) {
      throw new Error('Received empty response from Gemini AI');
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Failed to parse market trends response as JSON: ${parseError.message}. Response text was: "${text}"`);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Market trends response is not a valid object');
    }

    return {
      city: parsed.city || cityName,
      priceTrend: ['Rising', 'Stable', 'Falling'].includes(parsed.priceTrend) ? parsed.priceTrend : 'Stable',
      averagePricePerMarlaByArea: Array.isArray(parsed.averagePricePerMarlaByArea)
        ? parsed.averagePricePerMarlaByArea.map(area => ({
            area: String(area.area || 'Unknown area'),
            averagePricePerMarla: Number(area.averagePricePerMarla || 0),
            listingCount: Number(area.listingCount || 0),
            trend: ['Rising', 'Stable', 'Falling'].includes(area.trend) ? area.trend : 'Stable'
          }))
        : areaMarketData.map(area => ({
            area: area.area,
            averagePricePerMarla: area.averagePricePerMarla,
            listingCount: area.listingCount,
            trend: 'Stable'
          })),
      bestAreasToInvest: Array.isArray(parsed.bestAreasToInvest)
        ? parsed.bestAreasToInvest.map(item => ({
            area: String(item.area || 'Unknown area'),
            reason: String(item.reason || '')
          }))
        : [],
      marketSummary: String(parsed.marketSummary || ''),
      investmentRecommendation: String(parsed.investmentRecommendation || '')
    };
  } catch (error) {
    console.warn(`[Market Trends] Falling back for ${city}: ${error.message}`);
    return buildFallbackMarketReport(city, properties, error.message);
  }
}

function buildFallbackMarketReport(city, properties, reason) {
  const areaMarketData = buildAreaMarketData(properties);
  const trend = deriveTrend(areaMarketData);
  const bestAreas = areaMarketData
    .slice()
    .sort((a, b) => a.averagePricePerMarla - b.averagePricePerMarla)
    .slice(0, 3)
    .map(area => ({
      area: area.area,
      reason: `Lower average price per marla of PKR ${area.averagePricePerMarla.toLocaleString('en-PK')} with ${area.listingCount} listing(s) makes it a competitive entry point.`
    }));

  const marketSummary = areaMarketData.length > 0
    ? `Local market data for ${city} is currently ${trend.toLowerCase()}. The dataset includes ${areaMarketData.length} area segment(s), with pricing differences suggesting that well-located sub-areas are commanding stronger demand.`
    : `No local property listings were available for ${city}, so this outlook is based on a conservative city-level heuristic rather than live area data.`;

  const investmentRecommendation = bestAreas.length > 0
    ? `Focus on ${bestAreas.map(item => item.area).join(', ')} first. These areas currently offer the best balance between entry price and market activity.`
    : `Wait for more local inventory before making a concentrated move in ${city}; the current dataset is too thin to support a strong area-level recommendation.`;

  return {
    city,
    priceTrend: trend,
    averagePricePerMarlaByArea: areaMarketData.map(area => ({
      area: area.area,
      averagePricePerMarla: area.averagePricePerMarla,
      listingCount: area.listingCount,
      trend
    })),
    bestAreasToInvest: bestAreas,
    marketSummary: reason ? `${marketSummary} (Fallback analysis used because Gemini was unavailable.)` : marketSummary,
    investmentRecommendation
  };
}

function deriveTrend(areaMarketData) {
  if (areaMarketData.length === 0) {
    return 'Stable';
  }

  const prices = areaMarketData.map(area => area.averagePricePerMarla);
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const spread = Math.max(...prices) - Math.min(...prices);

  if (average >= 1500000 || spread >= average * 0.35) {
    return 'Rising';
  }

  if (average <= 700000) {
    return 'Falling';
  }

  return 'Stable';
}

module.exports = {
  generateMarketTrends,
  buildAreaMarketData
};
