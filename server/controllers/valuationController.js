const { estimatePropertyValue } = require('../services/valuationService');

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
