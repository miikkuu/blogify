const Post = require('../models/Post');
const Comment = require('../models/Comment');
const FileService = require('./fileService');
const User = require('../models/User'); // May be needed for some operations or checks

class PostService {
    /**
     * Creates a new post.
     * @param {object} postData - Data for the new post (title, summary, content).
     * @param {string} authorId - The ID of the author.
     * @param {object} [fileObject] - Optional file object from multer (req.file).
     * @returns {Promise<Post>} The created post document.
     */
    async createPost(postData, authorId, fileObject) {
        // TODO:
        // 1. Get fileIdentifier using FileService.getFileIdentifier(fileObject) if fileObject exists.
        // 2. Create Post document with title, summary, content, authorId, and cover (fileIdentifier).
        // 3. Return the created post document.
        // Note: URL generation for the response will be handled by the controller using formatPostForOutput or getFileUrl directly.
        const { title, summary, content } = postData;
        let fileIdentifier = null;
        if (fileObject) {
            fileIdentifier = FileService.getFileIdentifier(fileObject);
        }

        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: fileIdentifier,
            author: authorId,
        });
        return postDoc;
    }

    /**
     * Updates an existing post.
     * @param {string} postId - The ID of the post to update.
     * @param {object} postData - Data to update the post (title, summary, content).
     * @param {string} userId - The ID of the user attempting the update (for authorization).
     * @param {object} [fileObject] - Optional new file object from multer (req.file).
     * @returns {Promise<Post|null>} The updated post document, or null if not found/authorized.
     * @throws {Error} If authorization fails or post not found.
     */
    async updatePost(postId, postData, userId, fileObject) {
        // TODO:
        // 1. Find post by postId. If not found, throw/return error.
        // 2. Check if userId is authorized to update (post.author.equals(userId)). If not, throw/return error.
        // 3. Update postDoc fields (title, summary, content).
        // 4. If fileObject exists:
        //    a. Get oldFileIdentifier from postDoc.cover.
        //    b. If oldFileIdentifier, await FileService.deleteFile(oldFileIdentifier).
        //    c. postDoc.cover = FileService.getFileIdentifier(fileObject).
        // 5. Save postDoc.
        // 6. Return updated postDoc.
        const postDoc = await Post.findById(postId);
        if (!postDoc) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        if (!postDoc.author.equals(userId)) {
            const error = new Error('User not authorized to edit this post');
            error.statusCode = 403;
            throw error;
        }

        const { title, summary, content } = postData;
        postDoc.title = title;
        postDoc.summary = summary;
        postDoc.content = content;

        if (fileObject) {
            const oldFileIdentifier = postDoc.cover;
            if (oldFileIdentifier) {
                await FileService.deleteFile(oldFileIdentifier);
            }
            postDoc.cover = FileService.getFileIdentifier(fileObject);
        }

        await postDoc.save();
        return postDoc;
    }

    /**
     * Deletes a post.
     * @param {string} postId - The ID of the post to delete.
     * @param {string} userId - The ID of the user attempting the deletion (for authorization).
     * @returns {Promise<void>}
     * @throws {Error} If authorization fails or post not found.
     */
    async deletePost(postId, userId) {
        // TODO:
        // 1. Find post by postId. If not found, throw/return error.
        // 2. Check if userId is authorized (post.author.equals(userId)). If not, throw/return error.
        // 3. Get fileIdentifier from postDoc.cover. If it exists, await FileService.deleteFile(fileIdentifier).
        // 4. Delete comments associated with the post (Comment.deleteMany({ postId })).
        // 5. Delete the post (Post.deleteOne({ _id: postId })).
        const postDoc = await Post.findById(postId);
        if (!postDoc) {
            const error = new Error('Post not found');
            error.statusCode = 404;
            throw error;
        }

        if (!postDoc.author.equals(userId)) {
            const error = new Error('User not authorized to delete this post');
            error.statusCode = 403;
            throw error;
        }

        const fileIdentifier = postDoc.cover;
        if (fileIdentifier) {
            await FileService.deleteFile(fileIdentifier);
        }

        await Comment.deleteMany({ postId: postId });
        await Post.deleteOne({ _id: postId });
    }

    /**
     * Formats a single post document (or object) for API output, resolving the cover URL.
     * @param {object} post - The post document or a plain object.
     * @returns {Promise<object>} The post object with cover URL resolved.
     */
    async formatPostForOutput(post) {
        if (!post) return null;
        const postObject = (typeof post.toObject === 'function') ? post.toObject() : { ...post };
        postObject.cover = await FileService.getFileUrl(postObject.cover);
        return postObject;
    }

    /**
     * Formats an array of post documents for API output.
     * @param {Array<Post>} postsArray - Array of Post documents.
     * @returns {Promise<Array<object>>} Array of post objects with cover URLs resolved.
     */
    async formatPostsForOutput(postsArray) {
        if (!postsArray) return [];
        return Promise.all(postsArray.map(post => this.formatPostForOutput(post)));
    }

    // Other potential methods: getPostById, getPostsByUser, getPosts (which would primarily call Post model methods
    // but could also consistently use formatPostsForOutput before returning)
}

module.exports = new PostService();
