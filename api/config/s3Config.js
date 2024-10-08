const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require('multer');
const multerS3 = require('multer-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
let upload;
if(process.env.AWS_BUCKET_NAME){
 upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      if (file) {
        console.log("from uploads s3", file.originalname.replace(/\s/g, ''));
        cb(null, file.originalname.replace(/\s/g, ''));
      } else {
        cb(null, null); // No file
      }
    }
  })
});
}
else{
   upload = multer({
    storage: multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/')
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname)
      }
    })
  });
}
const getPresignedUrl = async (fileKey) => {
  if(!process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION || fileKey === "400x200" )
    return  null;

  console.log("Generating presigned URL for", fileKey);
  
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
  });

  try {
    // URL will be valid for 1 hour
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error; // Rethrow the error for further handling if necessary
  }
};

module.exports = { s3Client, upload, getPresignedUrl };
