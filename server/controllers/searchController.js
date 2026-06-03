const { searchProperties } = require('../services/searchService');
const Property = require('../models/Property');

/**
 * Handle POST request for natural language property search.
 */
exports.search = async (req, res) => {
  try {
    const { query } = req.body;

    // Validate query parameter
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required and must be a non-empty string',
        data: null
      });
    }

    // Parse natural language query into structured filters
    const filter = await searchProperties(query.trim());

    // Build MongoDB query
    const mongoQuery = {};

    // Apply city filter (case-insensitive partial match)
    if (filter.city) {
      mongoQuery.city = { $regex: filter.city, $options: 'i' };
    }

    // Apply property type filter (case-insensitive)
    if (filter.propertyType) {
      mongoQuery.propertyType = { $regex: filter.propertyType, $options: 'i' };
    }

    // Apply bedroom filters
    if (filter.minBedrooms !== null || filter.maxBedrooms !== null) {
      mongoQuery.bedrooms = {};
      if (filter.minBedrooms !== null) {
        mongoQuery.bedrooms.$gte = filter.minBedrooms;
      }
      if (filter.maxBedrooms !== null) {
        mongoQuery.bedrooms.$lte = filter.maxBedrooms;
      }
    }

    // Apply bathroom filters
    if (filter.minBathrooms !== null || filter.maxBathrooms !== null) {
      mongoQuery.bathrooms = {};
      if (filter.minBathrooms !== null) {
        mongoQuery.bathrooms.$gte = filter.minBathrooms;
      }
      if (filter.maxBathrooms !== null) {
        mongoQuery.bathrooms.$lte = filter.maxBathrooms;
      }
    }

    // Apply price filters
    if (filter.minPrice !== null || filter.maxPrice !== null) {
      mongoQuery.price = {};
      if (filter.minPrice !== null) {
        mongoQuery.price.$gte = filter.minPrice;
      }
      if (filter.maxPrice !== null) {
        mongoQuery.price.$lte = filter.maxPrice;
      }
    }

    // Apply amenities filter (if any)
    if (filter.amenities && filter.amenities.length > 0) {
      // Note: amenities should be checked if the Property model has an amenities field
      // For now, we'll include this as a potential filter
      // Uncomment if Property model has amenities array field
      // mongoQuery.amenities = { $in: filter.amenities };
    }

    // Execute MongoDB query
    const properties = await Property.find(mongoQuery)
      .select('-createdBy') // Exclude sensitive creator info by default
      .limit(50) // Limit results to prevent overwhelming responses
      .lean(); // Use lean for better performance on read-only queries

    return res.status(200).json({
      success: true,
      message: `Found ${properties.length} properties matching your search`,
      data: properties
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during property search',
      data: null
    });
  }
};
