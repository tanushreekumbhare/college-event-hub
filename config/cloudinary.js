const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Check if Cloudinary credentials are fully provided
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'demo' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Ensure public/uploads directory exists on disk for local storage fallback
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer in-memory storage for handling image uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed!'), false);
    }
  }
});

/**
 * Upload buffer to Cloudinary with automatic fallback to local disk storage
 * @param {Buffer} fileBuffer 
 * @param {String} folder 
 * @param {String} originalName
 * @returns {Promise<Object>} Object containing secure_url
 */
const uploadToCloudinary = async (fileBuffer, folder = 'college_events', originalName = 'event_poster.jpg') => {
  if (isCloudinaryConfigured) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });
      return { secure_url: result.secure_url };
    } catch (cloudErr) {
      console.warn('[Upload] Cloudinary upload failed, using local disk fallback:', cloudErr.message);
    }
  }

  // Local storage fallback
  const ext = path.extname(originalName || '') || '.jpg';
  const filename = `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.promises.writeFile(filePath, fileBuffer);
  return { secure_url: `/uploads/${filename}` };
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary
};

