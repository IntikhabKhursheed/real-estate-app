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
    const reasoning = buildSearchReasoning(filter);

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
      data: {
        results: properties,
        reasoning
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred during property search',
      data: null
    });
  }
};

function buildSearchReasoning(filter) {
  const parts = [];

  if (filter.city) parts.push(`city: ${filter.city}`);
  if (filter.propertyType) parts.push(`property type: ${filter.propertyType}`);
  if (filter.minBedrooms !== null && filter.maxBedrooms !== null && filter.minBedrooms === filter.maxBedrooms) {
    parts.push(`bedrooms: ${filter.minBedrooms}`);
  } else {
    if (filter.minBedrooms !== null) parts.push(`minimum bedrooms: ${filter.minBedrooms}`);
    if (filter.maxBedrooms !== null) parts.push(`maximum bedrooms: ${filter.maxBedrooms}`);
  }
  if (filter.minBathrooms !== null && filter.maxBathrooms !== null && filter.minBathrooms === filter.maxBathrooms) {
    parts.push(`bathrooms: ${filter.minBathrooms}`);
  } else {
    if (filter.minBathrooms !== null) parts.push(`minimum bathrooms: ${filter.minBathrooms}`);
    if (filter.maxBathrooms !== null) parts.push(`maximum bathrooms: ${filter.maxBathrooms}`);
  }
  if (filter.minPrice !== null) parts.push(`min price: ${filter.minPrice}`);
  if (filter.maxPrice !== null) parts.push(`max price: ${filter.maxPrice}`);
  if (Array.isArray(filter.amenities) && filter.amenities.length > 0) {
    parts.push(`amenities: ${filter.amenities.join(', ')}`);
  }

  if (parts.length === 0) {
    return 'No strong filters were extracted, so the search used the query as a broad match.';
  }

  return `Parsed search intent with ${parts.join('; ')}.`;
}
