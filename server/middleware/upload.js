const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const maxFileSize = 5 * 1024 * 1024;
const maxFiles = 8;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: maxFiles
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }

    cb(null, true);
  }
});

const uploadPropertyImages = (req, res, next) => {
  upload.array('images', maxFiles)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Each image must be 5MB or smaller'
      : error.message || 'Image upload failed';

    res.status(400).json({
      success: false,
      message,
      data: null
    });
  });
};

const ensureCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL || (cloudName && apiKey && apiSecret)) {
    return;
  }

  throw new Error('Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to .env.');
};

const uploadImageToCloudinary = (file, folder) => {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(file.buffer);
  });
};

const uploadImagesToCloudinary = async (files, folder) => {
  return Promise.all(files.map(file => uploadImageToCloudinary(file, folder)));
};

module.exports = {
  uploadPropertyImages,
  uploadImagesToCloudinary
};
