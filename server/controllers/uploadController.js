const { storeUploadedImages, resolvePublicUploadUrl } = require('../middleware/upload');

exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one image to upload',
        data: null
      });
    }

    const uploadedImages = await storeUploadedImages(req.files, 'estateiq/uploads');
    const urls = uploadedImages.map(image => resolvePublicUploadUrl(req, image.url));

    return res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: { urls }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error uploading images',
      data: null
    });
  }
};
