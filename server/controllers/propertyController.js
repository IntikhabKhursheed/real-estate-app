const Property = require('../models/Property');
const { uploadImagesToCloudinary } = require('../middleware/upload');

// GET /api/properties
exports.getAllProperties = async (req, res) => {
  try {
    const filters = {};
    const { query } = req;

    if (query.city) filters.city = new RegExp(escapeRegex(String(query.city)), 'i');
    if (query.propertyType) filters.propertyType = new RegExp(`^${escapeRegex(String(query.propertyType))}$`, 'i');
    if (query.purpose) filters.purpose = new RegExp(`^${escapeRegex(String(query.purpose))}$`, 'i');

    const bedroomsFilter = buildNumericRangeFilter(query.bedrooms, query.minBedrooms, query.maxBedrooms);
    if (bedroomsFilter) filters.bedrooms = bedroomsFilter;

    const priceFilter = buildNumericRangeFilter(query.price, query.minPrice, query.maxPrice);
    if (priceFilter) filters.price = priceFilter;

    const areaFilter = buildNumericRangeFilter(query.areaMarla, query.minAreaMarla, query.maxAreaMarla);
    if (areaFilter) filters.areaMarla = areaFilter;

    let properties = await Property.find(filters)
      .populate('createdBy', 'fullName email phone role')
      .lean();

    if (String(query.sortBy || '').toLowerCase() === 'investment-score') {
      properties = properties
        .map(property => ({
          ...property,
          investmentScore: calculateListingInvestmentScore(property)
        }))
        .sort((a, b) => b.investmentScore - a.investmentScore);
    } else if (String(query.sortBy || '').toLowerCase() === 'price-low-high') {
      properties.sort((a, b) => a.price - b.price);
    } else if (String(query.sortBy || '').toLowerCase() === 'price-high-low') {
      properties.sort((a, b) => b.price - a.price);
    } else {
      properties.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return res.status(200).json({
      success: true,
      message: 'Properties retrieved successfully',
      data: properties
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving properties',
      data: null
    });
  }
};

// GET /api/properties/:id
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('createdBy', 'fullName email phone role');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    property.views = Number(property.views || 0) + 1;
    await property.save();

    return res.status(200).json({
      success: true,
      message: 'Property retrieved successfully',
      data: property
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving property',
      data: null
    });
  }
};

// POST /api/properties
exports.createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      city,
      areaName,
      address,
      country,
      bedrooms,
      bathrooms,
      areaSqFt,
      areaMarla,
      propertyType,
      purpose,
      features,
      amenities,
      propertyAge,
      images
    } = req.body;

    const createdBy = req.user ? req.user.id : null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User identification missing',
        data: null
      });
    }

    if (!title || !description || price === undefined || !city || !country || bedrooms === undefined || bathrooms === undefined || areaSqFt === undefined || !propertyType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required property fields',
        data: null
      });
    }

    const newProperty = new Property({
      title,
      description,
      price,
      city,
      areaName: areaName || '',
      address: address || '',
      country,
      bedrooms,
      bathrooms,
      areaSqFt,
      areaMarla: areaMarla || 0,
      propertyType,
      purpose: purpose || 'Sale',
      features: features || [],
      amenities: amenities || [],
      propertyAge: propertyAge || 0,
      images: images || [],
      createdBy
    });

    await newProperty.save();

    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: newProperty
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating property',
      data: null
    });
  }
};

// PUT /api/properties/:id
exports.updateProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      city,
      areaName,
      address,
      country,
      bedrooms,
      bathrooms,
      areaSqFt,
      areaMarla,
      propertyType,
      purpose,
      features,
      amenities,
      propertyAge,
      images
    } = req.body;

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    // Check ownership or admin role
    if (!canUserManageProperty(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this property',
        data: null
      });
    }

    // Update fields
    if (title !== undefined) property.title = title;
    if (description !== undefined) property.description = description;
    if (price !== undefined) property.price = price;
    if (city !== undefined) property.city = city;
    if (areaName !== undefined) property.areaName = areaName;
    if (address !== undefined) property.address = address;
    if (country !== undefined) property.country = country;
    if (bedrooms !== undefined) property.bedrooms = bedrooms;
    if (bathrooms !== undefined) property.bathrooms = bathrooms;
    if (areaSqFt !== undefined) property.areaSqFt = areaSqFt;
    if (areaMarla !== undefined) property.areaMarla = areaMarla;
    if (propertyType !== undefined) property.propertyType = propertyType;
    if (purpose !== undefined) property.purpose = purpose;
    if (features !== undefined) property.features = features;
    if (amenities !== undefined) property.amenities = amenities;
    if (propertyAge !== undefined) property.propertyAge = propertyAge;
    if (images !== undefined) property.images = images;

    await property.save();

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating property',
      data: null
    });
  }
};

// POST /api/properties/:id/images
exports.uploadPropertyImages = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    if (!canUserManageProperty(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this property',
        data: null
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one image to upload',
        data: null
      });
    }

    const uploadedImages = await uploadImagesToCloudinary(
      req.files,
      `estateiq/properties/${property._id}`
    );

    property.images = [
      ...(property.images || []),
      ...uploadedImages.map(image => image.url)
    ];

    await property.save();

    const populatedProperty = await Property.findById(property._id).populate('createdBy', 'fullName email phone role');

    return res.status(200).json({
      success: true,
      message: 'Property images uploaded successfully',
      data: populatedProperty
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error uploading property images',
      data: null
    });
  }
};

// PATCH /api/properties/:id/status
exports.updatePropertyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be Active or Inactive',
        data: null
      });
    }

    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    if (!canUserManageProperty(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to update this property',
        data: null
      });
    }

    property.status = status;
    await property.save();

    const populatedProperty = await Property.findById(property._id).populate('createdBy', 'fullName email phone role');

    return res.status(200).json({
      success: true,
      message: 'Property status updated successfully',
      data: populatedProperty
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating property status',
      data: null
    });
  }
};

// DELETE /api/properties/:id
exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }

    // Check ownership or admin role
    if (!canUserManageProperty(property, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this property',
        data: null
      });
    }

    await Property.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
      data: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting property',
      data: null
    });
  }
};

function buildNumericRangeFilter(exactValue, minValue, maxValue) {
  const filter = {};
  let hasValue = false;

  if (exactValue !== undefined && exactValue !== null && String(exactValue).trim() !== '') {
    const parsed = parseBedroomsValue(exactValue);
    if (parsed.min !== null) {
      filter.$gte = parsed.min;
      hasValue = true;
    }
    if (parsed.max !== null) {
      filter.$lte = parsed.max;
      hasValue = true;
    }
    return hasValue ? filter : null;
  }

  if (minValue !== undefined && minValue !== null && String(minValue).trim() !== '') {
    const parsedMin = Number(minValue);
    if (!Number.isNaN(parsedMin)) {
      filter.$gte = parsedMin;
      hasValue = true;
    }
  }

  if (maxValue !== undefined && maxValue !== null && String(maxValue).trim() !== '') {
    const parsedMax = Number(maxValue);
    if (!Number.isNaN(parsedMax)) {
      filter.$lte = parsedMax;
      hasValue = true;
    }
  }

  return hasValue ? filter : null;
}

function parseBedroomsValue(value) {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.endsWith('+')) {
    const minimum = Number(normalized.replace('+', ''));
    return Number.isNaN(minimum) ? { min: null, max: null } : { min: minimum, max: null };
  }

  const exact = Number(normalized);
  return Number.isNaN(exact) ? { min: null, max: null } : { min: exact, max: exact };
}

function calculateListingInvestmentScore(property) {
  const price = Number(property.price || 0);
  const areaSqFt = Number(property.areaSqFt || 0);
  const bedrooms = Number(property.bedrooms || 0);
  const bathrooms = Number(property.bathrooms || 0);
  const areaMarla = Number(property.areaMarla || 0);

  let score = 50;

  if (areaSqFt > 0) {
    const pricePerSqFt = price / areaSqFt;
    if (pricePerSqFt < 12000) score += 20;
    else if (pricePerSqFt < 20000) score += 10;
    else if (pricePerSqFt > 40000) score -= 15;
  }

  if (bedrooms >= 3) score += 8;
  if (bathrooms >= 2) score += 6;
  if (areaMarla >= 10) score += 10;
  if (String(property.purpose || '').toLowerCase() === 'rent') score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function canUserManageProperty(property, user) {
  if (!property || !user) {
    return false;
  }

  if (user.role === 'admin') {
    return true;
  }

  const userId = String(user._id || user.id || '');
  const ownerValue = property.createdBy;
  const ownerId = typeof ownerValue === 'object'
    ? String(ownerValue._id || ownerValue.id || '')
    : String(ownerValue || '');

  return Boolean(userId && ownerId && userId === ownerId);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
