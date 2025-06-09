const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs').promises;

const hasValidAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME && process.env.AWS_REGION;

const s3Client = hasValidAwsCredentials ? new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
}) : null;

/**
 * Multer middleware configured for S3 or local file storage.
 * If AWS credentials are valid, it uses multer-s3 for S3 uploads.
 * Otherwise, it falls back to local disk storage in the 'uploads' directory.
 * @type {multer.Multer}
 */
const upload = hasValidAwsCredentials ? multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read', // Adjust as needed for private/public access
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname);
    }
  })
}) : multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '..', 'uploads');
      fs.mkdir(uploadPath, { recursive: true }).then(() => {
        cb(null, uploadPath);
      }).catch(err => {
        console.error("Error creating upload directory:", err);
        cb(err);
      });
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

/**
 * Generates a presigned URL for an S3 object, allowing temporary access.
 * Returns null if AWS credentials are not configured or if the fileKey is invalid.
 * @param {string} fileKey - The key of the object in the S3 bucket.
 * @param {number} [expiresIn=3600] - The duration in seconds for which the presigned URL is valid (default: 1 hour).
 * @returns {Promise<string|null>} The presigned URL or null.
 * @throws {Error} If there's an error generating the presigned URL.
 */
const getPresignedUrl = async (fileKey, expiresIn = 3600) => {
  if (!hasValidAwsCredentials || !s3Client) {
    console.warn("AWS credentials not configured. Cannot generate presigned URL.");
    return null;
  }
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
};

/**
 * Deletes an object from an S3 bucket.
 * Does nothing if AWS credentials are not configured.
 * @param {string} fileKey - The key of the object to delete from the S3 bucket.
 * @returns {Promise<void>}
 * @throws {Error} If there's an error deleting the object from S3.
 */
const deleteS3Object = async (fileKey) => {
  if (!hasValidAwsCredentials || !s3Client) {
    console.warn("AWS credentials not configured. Cannot delete S3 object.");
    return;
  }
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    });
    await s3Client.send(command);
    console.log(`Successfully deleted ${fileKey} from S3.`);
  } catch (error) {
    console.error(`Error deleting ${fileKey} from S3:`, error);
    throw error;
  }
};

/**
 * Extracts the S3 object key from a given URL.
 * Attempts to parse the URL and get the pathname, removing the leading slash.
 * If parsing fails, it returns the original URL as a fallback.
 * @param {string} url - The URL from which to extract the S3 key.
 * @returns {string} The extracted S3 key or the original URL if extraction fails.
 */
const extractS3KeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.warn(`Could not parse URL to extract S3 key: ${url}. Using full URL as key.`);
    return url;
  }
};

module.exports = {
  upload,
  getPresignedUrl,
  deleteS3Object,
  extractS3KeyFromUrl,
  hasValidAwsCredentials,
};