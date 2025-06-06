const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Check if AWS credentials are provided and valid
const hasValidAwsCredentials =
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_BUCKET_NAME &&
  process.env.AWS_ACCESS_KEY_ID !== 'dummy_key' &&
  process.env.AWS_SECRET_ACCESS_KEY !== 'dummy_secret';

// Only initialize AWS SDK if credentials are valid
let s3Client;
let GetObjectCommand;
let DeleteObjectCommand;
let getSignedUrl;
let multerS3;

if (hasValidAwsCredentials) {
  try {
    const { S3Client: S3ClientImport, GetObjectCommand: GetObjectCommandImport } = require('@aws-sdk/client-s3');
    const { DeleteObjectCommand: DeleteObjectCommandImport } = require('@aws-sdk/client-s3');
    const { getSignedUrl: getSignedUrlImport } = require("@aws-sdk/s3-request-presigner");
    multerS3 = require('multer-s3');

    GetObjectCommand = GetObjectCommandImport;
    DeleteObjectCommand = DeleteObjectCommandImport;
    getSignedUrl = getSignedUrlImport;

    s3Client = new S3ClientImport({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('AWS S3 client initialized successfully');
  } catch (error) {
    console.log('AWS SDK not available or credentials not valid:', error.message);
    hasValidAwsCredentials = false;
  }
} else {
  console.log('AWS S3 disabled: No valid AWS credentials provided');

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
}
// Configure multer storage based on AWS availability
let upload;
if (hasValidAwsCredentials && multerS3 && s3Client) {
  upload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_BUCKET_NAME,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        if (file) {
          const filename = file.originalname.replace(/\s/g, '');
          console.log("Uploading to S3:", filename);
          cb(null, filename);
        } else {
          cb(null, null); // No file
        }
      }
    })
  });
  console.log('Configured multer with S3 storage');
} else {
  // Use local storage if AWS is not configured
  upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads/'));
      },
      filename: function (req, file, cb) {
        const filename = file.originalname.replace(/\s/g, '');
        console.log("Saving locally:", filename);
        cb(null, filename);
      }
    })
  });
  console.log('Configured multer with local storage');
}

// Function to get a presigned URL for S3 objects or return local URL
const getPresignedUrl = async (fileKey) => {
  // If it's a placeholder image or not a valid URL, return null
  if (!fileKey || fileKey.includes('placeholder') || fileKey === "400x200") {
    return null;
  }

  // If AWS is not configured, return a local URL if the file exists
  if (!hasValidAwsCredentials) {
    // Check if it's already a full URL
    if (fileKey.startsWith('http')) {
      return fileKey;
    }

    // For local files, construct a local URL
    const localPath = path.join(__dirname, '..', 'uploads', path.basename(fileKey));
    if (fs.existsSync(localPath)) {
      return `/api/uploads/${path.basename(fileKey)}`;
    }
    return null;
  }

  // If AWS is configured, generate a presigned URL
  try {
    console.log("Generating presigned URL for", fileKey);

    // Extract the key from the URL if it's a full URL
    let key = fileKey;
    if (fileKey.startsWith('http')) {
      try {
        key = new URL(fileKey).pathname.substring(1);
      } catch (urlError) {
        console.log('Invalid URL, using as key:', fileKey);
      }
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    // URL will be valid for 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (error) {
    console.log("Error generating presigned URL:", error.message);
    return null; // Return null instead of throwing to prevent errors
  }
};

// Export the DeleteObjectCommand for use in controllers
module.exports = {
  s3Client,
  upload,
  getPresignedUrl,
  DeleteObjectCommand,
  hasValidAwsCredentials
};
