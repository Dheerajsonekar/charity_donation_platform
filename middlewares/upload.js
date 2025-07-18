const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require('cloudinary').v2;
require("dotenv").config();

// Cloudinary configuration for free tier
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB for free tier
    files: 1
  },
  fileFilter,
});

// Upload image to Cloudinary (optimized for free tier)
const uploadToS3 = async (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "charity-platform/campaigns",
        public_id: `campaign-${uuidv4()}-${Date.now()}`,
        transformation: [
          { width: 1000, height: 700, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        } else {
          console.log('✅ Image uploaded successfully to Cloudinary');
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(file.buffer);
  });
};

// Upload PDF to Cloudinary
const uploadPdfToS3 = async (pdfBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "charity-platform/pdfs",
        public_id: `report-${uuidv4()}-${filename.split('.')[0]}`,
        format: "pdf"
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary PDF upload error:', error);
          reject(new Error(`PDF upload failed: ${error.message}`));
        } else {
          console.log('✅ PDF uploaded successfully to Cloudinary');
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(pdfBuffer);
  });
};

// Legacy support - keeping your existing function names
const uploadToCloudinary = uploadToS3;

module.exports = { 
  upload, 
  uploadToS3,
  uploadPdfToS3,
  uploadToCloudinary
};