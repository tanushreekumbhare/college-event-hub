const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary SDK with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || ''
});

// Configure Multer in-memory storage for handling image uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max file size limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed!'), false);
    }
  }
});

/**
 * Upload buffer directly to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {String} folder 
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = 'college_events') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary
};
