const { calculateInvestmentScore } = require('../services/investmentService');
const Property = require('../models/Property');
const mongoose = require('mongoose');

/**
 * Handle POST request for property investment score calculation.
 */
exports.calculate = async (req, res) => {
  try {
    const { propertyId } = req.body;

    // Validate propertyId parameter
    if (!propertyId || typeof propertyId !== 'string' || propertyId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Property ID is required and must be a non-empty string',
        data: null
      });
    }

    // Validate if propertyId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid property ID format',
        data: null
      });
    }

    // Fetch property from database
    const property = await Property.findById(propertyId).lean();

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    // Calculate investment score
    const investmentData = await calculateInvestmentScore({
      city: property.city,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      areaSqFt: property.areaSqFt,
      propertyType: property.propertyType,
      amenities: property.amenities || [],
      propertyAge: property.propertyAge || 0
    });

    return res.status(200).json({
      success: true,
      message: 'Investment score generated',
      data: investmentData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during investment score calculation',
      data: null
    });
  }
};
