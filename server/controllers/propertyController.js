const Property = require('../models/Property');

// GET /api/properties
exports.getAllProperties = async (req, res) => {
  try {
    const filters = {};
    if (req.query.city) filters.city = new RegExp(req.query.city, 'i');
    if (req.query.propertyType) filters.propertyType = req.query.propertyType;

    const properties = await Property.find(filters).populate('createdBy', 'fullName email role');

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
    const property = await Property.findById(req.params.id).populate('createdBy', 'fullName email role');
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found',
        data: null
      });
    }
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
      country,
      bedrooms,
      bathrooms,
      areaSqFt,
      propertyType,
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
      country,
      bedrooms,
      bathrooms,
      areaSqFt,
      propertyType,
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
      country,
      bedrooms,
      bathrooms,
      areaSqFt,
      propertyType,
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
    if (property.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
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
    if (country !== undefined) property.country = country;
    if (bedrooms !== undefined) property.bedrooms = bedrooms;
    if (bathrooms !== undefined) property.bathrooms = bathrooms;
    if (areaSqFt !== undefined) property.areaSqFt = areaSqFt;
    if (propertyType !== undefined) property.propertyType = propertyType;
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
    if (property.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
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
