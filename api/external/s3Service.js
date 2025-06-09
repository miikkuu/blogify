const { S3Client } = require("@aws-sdk/client-s3");
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
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const filename = file.originalname.replace(/\s/g, '-'); // Replace spaces with hyphens
      cb(null, Date.now().toString() + '-' + filename);
    },
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

module.exports = {
  s3Client,
  hasValidAwsCredentials,
  upload,
};