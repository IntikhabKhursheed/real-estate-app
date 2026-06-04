const Property = require('../models/Property');
const { generateMarketTrends } = require('../services/marketService');

exports.getMarketTrends = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'City is required',
        data: null
      });
    }

    const cityName = city.trim();
    let properties = [];
    try {
      properties = await Property.find({
        city: new RegExp(escapeRegex(cityName), 'i')
      })
        .select('title city areaName areaMarla price propertyType purpose bedrooms bathrooms createdAt')
        .lean();
    } catch (dbError) {
      console.warn(`[Market Trends] Falling back to empty property dataset for ${cityName}: ${dbError.message}`);
    }

    const trends = await generateMarketTrends(cityName, properties);

    return res.status(200).json({
      success: true,
      message: 'Market trends retrieved successfully',
      data: {
        ...trends,
        sampleSize: properties.length,
        hasLocalData: properties.length > 0,
        areaData: trends.averagePricePerMarlaByArea
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving market trends',
      data: null
    });
  }
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
