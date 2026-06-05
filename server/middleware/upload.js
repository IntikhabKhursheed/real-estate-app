const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const maxFileSize = 5 * 1024 * 1024;
const maxFiles = 5;
const uploadsDir = path.join(__dirname, '../uploads');

const cloudinaryUrl = process.env.CLOUDINARY_URL || '';
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

const hasCloudinaryConfig = Boolean(cloudinaryUrl || (cloudName && apiKey && apiSecret));
const useCloudinary = hasCloudinaryConfig || isVercel;

if (cloudinaryUrl) {
  const parsed = new URL(cloudinaryUrl);
  cloudinary.config({
    cloud_name: parsed.hostname,
    api_key: decodeURIComponent(parsed.username),
    api_secret: decodeURIComponent(parsed.password),
    secure: true
  });
} else if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: maxFiles
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Only JPG, PNG, and WebP image files are allowed'));
      return;
    }

    cb(null, true);
  }
});

const handleUploadError = (res, error) => {
  const message = error.code === 'LIMIT_FILE_SIZE'
    ? 'Each image must be 5MB or smaller'
    : error.code === 'LIMIT_FILE_COUNT'
      ? 'You can upload up to 5 images at a time'
      : error.message || 'Image upload failed';

  res.status(400).json({
    success: false,
    message,
    data: null
  });
};

const uploadPropertyImages = (req, res, next) => {
  upload.array('images', maxFiles)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    handleUploadError(res, error);
  });
};

const ensureUploadDir = async () => {
  await fs.mkdir(uploadsDir, { recursive: true });
};

const uploadImageToCloudinary = (file, folder) => {
  if (!useCloudinary) {
    throw new Error('Cloudinary is not configured');
  }

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
          publicId: result.public_id,
          storage: 'cloudinary'
        });
      }
    );

    stream.end(file.buffer);
  });
};

const uploadImagesToCloudinary = async (files, folder) => {
  return Promise.all(files.map(file => uploadImageToCloudinary(file, folder)));
};

const saveImageLocally = async (file) => {
  await ensureUploadDir();

  const extension = getFileExtension(file);
  const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.writeFile(filePath, file.buffer);

  return {
    url: `/uploads/${filename}`,
    filename,
    storage: 'local'
  };
};

const storeUploadedImages = async (files, folder = 'estateiq/uploads') => {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  if (useCloudinary) {
    if (!hasCloudinaryConfig) {
      throw new Error('Cloudinary is required for image uploads on Vercel. Please set the Cloudinary environment variables.');
    }
    return uploadImagesToCloudinary(files, folder);
  }

  return Promise.all(files.map(file => saveImageLocally(file)));
};

const resolvePublicUploadUrl = (req, url) => {
  if (!url) {
    return '';
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const host = req.get('host');
  return `${req.protocol}://${host}${url}`;
};

function getFileExtension(file) {
  const originalName = String(file.originalname || '').toLowerCase();
  const extension = path.extname(originalName);

  if (extension) {
    return extension;
  }

  switch (file.mimetype) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}

module.exports = {
  maxFileSize,
  maxFiles,
  uploadPropertyImages,
  uploadImagesToCloudinary,
  storeUploadedImages,
  resolvePublicUploadUrl
};
