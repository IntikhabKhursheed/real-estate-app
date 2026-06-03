const mongoose = require('mongoose');
const Property = require('../models/Property');
const { estimatePropertyValue } = require('../services/valuationService');
const { calculateInvestmentScore } = require('../services/investmentService');

/**
 * Handle POST request for property valuation estimation.
 */
exports.estimateValuation = async (req, res) => {
  try {
    const { city, country, propertyType, bedrooms, bathrooms, areaSqFt } = req.body;

    // Validate required fields
    if (
      !city || 
      !country || 
      !propertyType || 
      bedrooms === undefined || 
      bathrooms === undefined || 
      areaSqFt === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        data: null
      });
    }

    // Call valuation service
    const valuation = await estimatePropertyValue(req.body);

    return res.status(200).json({
      success: true,
      message: 'Property valuation generated',
      data: valuation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during property valuation',
      data: null
    });
  }
};

// GET /api/valuation/investment-score/:id
exports.getInvestmentScoreByPropertyId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
        data: null
      });
    }

    const property = await Property.findById(id).lean();
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    const investmentData = await calculateInvestmentScore({
      city: property.city,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqFt: property.areaSqFt,
      propertyType: property.propertyType,
      amenities: property.amenities || property.features || [],
      propertyAge: property.propertyAge || 0
    });

    const scoreOutOf100 = Math.round(investmentData.investmentScore * 10);

    return res.status(200).json({
      success: true,
      message: 'Investment score generated',
      data: {
        investmentScore: scoreOutOf100,
        score: scoreOutOf100,
        confidence: investmentData.confidence,
        recommendation: getInvestmentLabel(scoreOutOf100),
        reasoning: investmentData.reasoning
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during investment score calculation',
      data: null
    });
  }
};

const getInvestmentLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};
