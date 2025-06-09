const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { NotFoundError, AuthError, ValidationError } = require('../utils/errors');
const { upload, deleteS3Object, extractS3KeyFromUrl, hasValidAwsCredentials } = require('../external/s3Service');
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_PLACEHOLDER_IMAGE = "https://placehold.co/400x200/lightgray/darkgray?text=No+Image";

/**
 * Creates a new blog post.
 * @param {string} title - The title of the post.
 * @param {string} summary - A brief summary of the post.
 * @param {string} content - The main content of the post.
 * @param {object} file - The uploaded file object (from multer).
 * @param {string} authorId - The ID of the author.
 * @returns {Promise<object>} The created post document.
 */
const createPost = async (title, summary, content, file, authorId) => {
  let coverUrl = DEFAULT_PLACEHOLDER_IMAGE;

  if (file) {
    if (hasValidAwsCredentials && file.location) {
      coverUrl = file.location;
    } else if (file.path) {
      const relativePath = file.path.split('uploads/')[1] || file.filename;
      coverUrl = `/api/uploads/${relativePath}`;
    }
  }

  const postDoc = await Post.create({
    title,
    summary,
    content,
    cover: coverUrl,
    author: authorId,
  });
  return postDoc;
};

/**
 * Updates an existing blog post.
 * @param {string} postId - The ID of the post to update.
 * @param {string} title - The new title.
 * @param {string} summary - The new summary.
 * @param {string} content - The new content.
 * @param {object} file - The new uploaded file object (optional).
 * @param {string} userId - The ID of the user attempting to update.
 * @returns {Promise<object>} The updated post document.
 * @throws {NotFoundError} If the post is not found.
 * @throws {AuthError} If the user is not authorized to edit the post.
 */
const updatePost = async (postId, title, summary, content, file, userId) => {
  const postDoc = await Post.findById(postId);

  if (!postDoc) {
    throw new NotFoundError("Post not found");
  }

  if (!postDoc.author.equals(userId)) {
    throw new AuthError("You are not authorized to edit this post");
  }

  postDoc.title = title;
  postDoc.summary = summary;
  postDoc.content = content;

  if (file) {
    if (hasValidAwsCredentials) {
      if (
        postDoc.cover &&
        postDoc.cover !== DEFAULT_PLACEHOLDER_IMAGE &&
        !postDoc.cover.includes('placeholder')
      ) {
        try {
          const oldKey = extractS3KeyFromUrl(postDoc.cover);
          await deleteS3Object(oldKey);
        } catch (error) {
          console.log("Error deleting old image from S3:", error.message);
        }
      }
      if (file.location && postDoc.cover !== file.location) {
        postDoc.cover = file.location;
      }
    } else {
      if (file.path) {
        const relativePath = file.path.split('uploads/')[1] || file.filename;
        postDoc.cover = `/api/uploads/${relativePath}`;
      }
    }
  }
  await postDoc.save();
  return postDoc;
};

/**
 * Retrieves posts by a specific user.
 * @param {string} userId - The ID of the user whose posts are to be retrieved.
 * @returns {Promise<{postsWithPresignedUrls: object[], username: string}>} An object containing the posts and the username.
 */
const getPostsByUser = async (userId) => {
  const user = await User.findById(userId);
  const username = user ? user.username : null;

  const posts = await Post.find({ author: userId })
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20)
    .exec();

  const postsWithPresignedUrls = posts.map(post => ({
    ...post.toObject(),
    cover: post.cover || DEFAULT_PLACEHOLDER_IMAGE
  }));

  return { postsWithPresignedUrls, username };
};

/**
 * Retrieves all blog posts.
 * @returns {Promise<object[]>} An array of post documents.
 */
const getAllPosts = async () => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20)
    .exec();

  const postsWithPresignedUrls = posts.map(post => ({
    ...post.toObject(),
    cover: post.cover || DEFAULT_PLACEHOLDER_IMAGE
  }));

  return postsWithPresignedUrls;
};

/**
 * Retrieves a single post by its ID.
 * @param {string} id - The ID of the post.
 * @returns {Promise<object>} The post document.
 * @throws {NotFoundError} If the post is not found.
 */
const getPostById = async (id) => {
  const postDoc = await Post.findById(id).populate("author", [
    "username",
    { path: "_id", select: "userId" },
  ]);

  if (!postDoc) {
    throw new NotFoundError("Post not found");
  }

  const postWithPresignedUrl = {
    ...postDoc.toObject(),
    cover: postDoc.cover || DEFAULT_PLACEHOLDER_IMAGE
  };

  return postWithPresignedUrl;
};

/**
 * Updates the like status of a post.
 * @param {string} postId - The ID of the post.
 * @param {'like' | 'unlike'} action - The action to perform ('like' or 'unlike').
 * @returns {Promise<object>} The updated post document.
 * @throws {NotFoundError} If the post is not found.
 * @throws {ValidationError} If the action is invalid.
 */
const updateLikeStatus = async (postId, action) => {
  const postDoc = await Post.findById(postId);
  if (!postDoc) {
    throw new NotFoundError("Post not found");
  }

  if (action === "like") {
    postDoc.like += 1;
  } else if (action === "unlike") {
    postDoc.like -= 1;
  } else {
    throw new ValidationError("Invalid action");
  }
  await postDoc.save();
  return postDoc;
};

/**
 * Deletes a blog post and its associated comments and image.
 * @param {string} postId - The ID of the post to delete.
 * @param {string} userId - The ID of the user attempting to delete.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {NotFoundError} If the post is not found.
 * @throws {AuthError} If the user is not authorized to delete the post.
 */
const deletePost = async (postId, userId) => {
  const postDoc = await Post.findById(postId);
  if (!postDoc) {
    throw new NotFoundError("Post not found");
  }
  if (!postDoc.author.equals(userId)) {
    throw new AuthError("You are not authorized to delete this post");
  }

  if (
    postDoc.cover &&
    postDoc.cover !== DEFAULT_PLACEHOLDER_IMAGE &&
    !postDoc.cover.includes('placeholder')
  ) {
    if (hasValidAwsCredentials) {
      try {
        const coverKey = extractS3KeyFromUrl(postDoc.cover);
        await deleteS3Object(coverKey);
      } catch (error) {
        console.log("Error deleting image from S3:", error.message);
      }
    } else if (postDoc.cover.startsWith('/api/uploads/')) {
      try {
        const filename = postDoc.cover.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        await fs.unlink(filePath);
      } catch (error) {
        console.log("Error deleting local image:", error.message);
      }
    }
  }

  await Comment.deleteMany({ postId: postId });
  await postDoc.deleteOne();
  return { message: "Post deleted successfully" };
};

/**
 * Searches for blog posts based on a query.
 * @param {string} searchQuery - The search query string.
 * @returns {Promise<object[]>} An array of matching post documents.
 */
const searchPosts = async (searchQuery) => {
  let results;
  if (!searchQuery) {
    results = await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  } else {
    results = await Post.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { summary: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } }
      ]
    })
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();
  }

  const postsWithPresignedUrls = results.map(post => ({
    ...post.toObject(),
    cover: post.cover || DEFAULT_PLACEHOLDER_IMAGE
  }));

  return postsWithPresignedUrls;
};

module.exports = {
  createPost,
  updatePost,
  getPostsByUser,
  getAllPosts,
  getPostById,
  updateLikeStatus,
  deletePost,
  searchPosts,
};