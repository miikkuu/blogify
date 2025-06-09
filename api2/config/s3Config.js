const multer = require('multer');
const fs = require('fs');
const path = require('path');

// AWS SDK imports (conditional to avoid errors if not installed/configured)
let S3Client, multerS3; // Removed GetObjectCommand, DeleteObjectCommand, getSignedUrl
try {
  ({ S3Client } = require('@aws-sdk/client-s3')); // Only S3Client needed here
  multerS3 = require('multer-s3');
} catch (e) {
  console.warn("AWS SDK modules not found. S3 functionality will be disabled.");
}

// Check if AWS credentials are provided and valid
const hasValidAwsCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_BUCKET_NAME &&
  process.env.AWS_ACCESS_KEY_ID !== 'dummy_key' && // Prevent using dummy credentials
  process.env.AWS_SECRET_ACCESS_KEY !== 'dummy_secret' && // Prevent using dummy credentials
  S3Client && multerS3; // Ensure SDK modules are loaded (removed GetObjectCommand, DeleteObjectCommand, getSignedUrl)

// Initialize S3 client if credentials are valid
const s3Client = hasValidAwsCredentials ? new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}) : null;

if (hasValidAwsCredentials) {
  console.log('AWS S3 client initialized successfully.');
} else {
  console.log('AWS S3 disabled: No valid AWS credentials or SDK modules provided.');
  // Ensure local 'uploads' directory exists if S3 is not used
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created local uploads directory.');
  }
}

// Configure multer storage based on AWS availability
const upload = hasValidAwsCredentials ? multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Use original filename, replacing spaces for S3 compatibility
      const filename = file.originalname.replace(/\s/g, '_');
      console.log("Uploading to S3:", filename);
      cb(null, filename);
    }
  })
}) : multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '..', 'uploads/'));
    },
    filename: (req, file, cb) => {
      // Use original filename, replacing spaces for local compatibility
      const filename = file.originalname.replace(/\s/g, '_');
      console.log("Saving locally:", filename);
      cb(null, filename);
    }
  })
});

// The getPresignedUrl function has been removed as its logic is now in FileService.getFileUrl()

// Export necessary components for use in other modules
module.exports = {
  s3Client,
  upload,
  // getPresignedUrl, // Removed
  // DeleteObjectCommand, // Removed: No longer needed by postController directly
  hasValidAwsCredentials
};
