const Property = require('../models/Property');
const Inquiry = require('../models/Inquiry');

exports.getAgentDashboard = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const isAdmin = role === 'admin';

    const propertyFilter = isAdmin ? {} : { createdBy: userId };
    const properties = await Property.find(propertyFilter)
      .populate('createdBy', 'fullName email phone role')
      .sort({ createdAt: -1 })
      .lean();

    const totalListings = properties.length;
    const activeListings = properties.filter(property => property.status === 'Active').length;
    const totalViews = properties.reduce((sum, property) => sum + Number(property.views || 0), 0);

    const propertyIds = properties.map(property => property._id);
    const inquiryFilter = isAdmin
      ? {}
      : { property: { $in: propertyIds } };

    const recentInquiries = await Inquiry.find(inquiryFilter)
      .populate('property', 'title city price propertyType status')
      .populate('agent', 'fullName email phone role')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Agent dashboard retrieved successfully',
      data: {
        summary: {
          totalListings,
          activeListings,
          totalViews
        },
        properties,
        recentInquiries
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error loading agent dashboard',
      data: null
    });
  }
};
