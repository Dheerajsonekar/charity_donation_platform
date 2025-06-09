const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only images allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadToS3 = async (file) => {
  const key = `${uuidv4()}-${file.originalname.replace(/\s+/g, "_")}`;
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    },
  });
  const result = await upload.done();
  return result.Location;
};

const uploadPdfToS3 = async (pdfBuffer, filename) => {
  const key = `${uuidv4()}-${filename.replace(/\s+/g, "_")}`;
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ACL: "public-read",
    },
  });
  const result = await upload.done();
  return result.Location;
};

module.exports = { upload, uploadToS3, uploadPdfToS3 };
