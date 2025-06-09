const fs = require('fs');
const path = require('path');
const { DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client: configuredS3Client, hasValidAwsCredentials } = require('../external/s3Service'); // Changed import path

// Load environment variables
require('dotenv').config();

class FileService {
    constructor() {
        this.useS3 = hasValidAwsCredentials;
        this.s3Client = configuredS3Client;
        this.bucketName = process.env.AWS_BUCKET_NAME;
        this.defaultPlaceholderImage = process.env.DEFAULT_PLACEHOLDER_IMAGE || '/api/uploads/placeholder.webp';
        this.localUploadsPath = path.join(__dirname, '..', 'uploads');

        if (this.useS3 && (!this.s3Client || !this.bucketName)) {
            console.warn('[FileService] S3 is configured but S3 client or bucket name is missing. File operations may fail.');
        }

        if (this.useS3) {
            console.log('[FileService] Initialized to use AWS S3 for file storage.');
        } else {
            console.log('[FileService] Initialized to use local disk for file storage.');
        }
    }

    /**
     * Returns the file identifier from the multer file object.
     * @param {object} fileObject - The file object from multer (req.file).
     * @returns {string|null} The unique file identifier (S3 key or local filename) or null if no file.
     */
    getFileIdentifier(fileObject) {
        if (!fileObject) {
            return null;
        }
        // multer-s3 provides `key` (S3 object key)
        // multer disk storage provides `filename`
        return fileObject.key || fileObject.filename;
    }

    /**
     * Deletes a file from the configured storage.
     * @param {string} fileIdentifier - The S3 key or local filename.
     * @returns {Promise<void>}
     */
    async deleteFile(fileIdentifier) {
        if (!fileIdentifier || fileIdentifier === this.defaultPlaceholderImage || fileIdentifier.includes('placeholder')) {
            console.log(`[FileService] Skipping deletion for placeholder or invalid identifier: ${fileIdentifier}`);
            return;
        }

        if (this.useS3) {
            if (!this.s3Client) {
                console.error('[FileService] S3 client not initialized. Cannot delete file.');
                return;
            }
            try {
                // If fileIdentifier is a full URL, extract the key
                let s3Key = fileIdentifier;
                if (fileIdentifier.startsWith('http')) {
                    try {
                        const url = new URL(fileIdentifier);
                        s3Key = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode
                    } catch (e) {
                        console.warn(`[FileService] Could not parse URL to extract S3 key for deletion: ${fileIdentifier}. Attempting deletion with the given identifier.`);
                    }
                }

                const command = new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: s3Key,
                });
                await this.s3Client.send(command);
                console.log(`[FileService] Successfully deleted S3 file: ${s3Key}`);
            } catch (error) {
                console.error(`[FileService] Error deleting S3 file ${fileIdentifier}:`, error.message);
                throw error;
            }
        } else {
            try {
                const localFilePath = path.join(this.localUploadsPath, path.basename(fileIdentifier));
                if (fs.existsSync(localFilePath)) {
                    await fs.promises.unlink(localFilePath);
                    console.log(`[FileService] Successfully deleted local file: ${localFilePath}`);
                } else {
                    console.warn(`[FileService] Local file not found for deletion: ${localFilePath}`);
                }
            } catch (error) {
                console.error(`[FileService] Error deleting local file ${fileIdentifier}:`, error.message);
                throw error;
            }
        }
    }

    /**
     * Generates a publicly accessible URL for a file.
     * @param {string} fileIdentifier - The S3 key or local filename.
     * @returns {Promise<string|null>} The public URL or null if identifier is invalid.
     */
    async getFileUrl(fileIdentifier) {
        if (!fileIdentifier) {
            return this.defaultPlaceholderImage;
        }

        // If it's already a full URL (e.g., an external URL or already processed)
        if (fileIdentifier.startsWith('http://') || fileIdentifier.startsWith('https://')) {
            return fileIdentifier;
        }

        // Handle known placeholders explicitly
        if (fileIdentifier === 'placeholder.webp' || fileIdentifier.includes('placeholder')) {
             return this.defaultPlaceholderImage;
        }


        if (this.useS3) {
            if (!this.s3Client) {
                console.error('[FileService] S3 client not initialized. Cannot get file URL.');
                return this.defaultPlaceholderImage;
            }
            try {
                // fileIdentifier is expected to be an S3 key here
                const command = new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileIdentifier,
                });
                // URL valid for 1 hour, consistent with original s3Config.js
                const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
                return url;
            } catch (error) {
                console.error(`[FileService] Error generating presigned URL for S3 key ${fileIdentifier}:`, error.message);
                return this.defaultPlaceholderImage;
            }
        } else {
            // For local storage, construct the path relative to the server's static serving
            const localFilePath = path.join(this.localUploadsPath, path.basename(fileIdentifier));
            if (fs.existsSync(localFilePath)) {
                // Ensure the URL is web-accessible, e.g., /api/uploads/filename.ext
                // Assuming /api/uploads is the static route for this.localUploadsPath
                return `/api/uploads/${path.basename(fileIdentifier)}`;
            } else {
                console.warn(`[FileService] Local file not found: ${localFilePath}. Returning placeholder.`);
                return this.defaultPlaceholderImage;
            }
        }
    }
}

module.exports = new FileService();