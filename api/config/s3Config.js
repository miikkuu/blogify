const multer = require('multer');
const fs = require('fs');
const path = require('path');

// AWS SDK imports (conditional to avoid errors if not installed/configured)
let S3Client, GetObjectCommand, DeleteObjectCommand, getSignedUrl, multerS3;
try {
  ({ S3Client, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'));
  ({ getSignedUrl } = require("@aws-sdk/s3-request-presigner"));
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
  S3Client && GetObjectCommand && DeleteObjectCommand && getSignedUrl && multerS3; // Ensure SDK modules are loaded

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

// Function to get a presigned URL for S3 objects or return local URL
const getPresignedUrl = async (fileKey) => {
  // Return null for placeholder images or invalid keys
  if (!fileKey || fileKey.includes('placeholder') || fileKey === "400x200") {
    return null;
  }

  // If AWS is not configured, assume local storage and return local URL
  if (!hasValidAwsCredentials) {
    // If it's already a full URL (e.g., from a previous S3 public upload), return as is
    if (fileKey.startsWith('http')) {
      return fileKey;
    }
    // For local files, construct a local URL
    const localPath = path.join(__dirname, '..', 'uploads', path.basename(fileKey));
    return fs.existsSync(localPath) ? `/api/uploads/${path.basename(fileKey)}` : null;
  }

  // If AWS is configured, generate a presigned URL for private S3 objects
  try {
    // Extract the S3 key from the full URL if necessary
    let key = fileKey;
    if (fileKey.startsWith('http')) {
      try {
        const url = new URL(fileKey);
        key = url.pathname.substring(1); // Remove leading slash
      } catch (urlError) {
        console.warn('Invalid URL format for S3 key extraction, using full URL as key:', fileKey);
      }
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    // URL will be valid for 1 hour (3600 seconds)
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.error("Error generating presigned URL:", error.message);
    return null; // Return null to prevent application crash
  }
};

// Export necessary components for use in other modules
module.exports = {
  s3Client,
  upload,
  getPresignedUrl,
  DeleteObjectCommand, // Exported for S3 deletion in postController
  hasValidAwsCredentials
};
