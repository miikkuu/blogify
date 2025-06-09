const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { NotFoundError, AuthError, ValidationError } = require('../utils/errors');
const FileService = require('../services/fileService');
const fs = require('fs').promises;
const path = require('path');

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
  const coverIdentifier = FileService.getFileIdentifier(file);
  const coverUrl = await FileService.getFileUrl(coverIdentifier);

  try {
    const postDoc = await Post.create({
      title,
      summary,
      content: content || '',
      cover: coverUrl,
      author: authorId,
    });
    return postDoc;
  } catch (error) {
    throw new ValidationError("Failed to create post: " + error.message);
  }
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
    // Delete old cover if it's not the default placeholder
    if (postDoc.cover) {
      await FileService.deleteFile(postDoc.cover);
    }
    const newCoverIdentifier = FileService.getFileIdentifier(file);
    postDoc.cover = await FileService.getFileUrl(newCoverIdentifier);
  }
  await postDoc.save();
  return postDoc;
};

/**
 * Retrieves posts by a specific user.
 * @param {string} userId - The ID of the user whose posts are to be retrieved.
 * @returns {Promise<{postsWithResolvedUrls: object[], username: string}>} An object containing the posts and the username.
 */
const getPostsByUser = async (userId) => {
  const user = await User.findById(userId);
  const username = user ? user.username : null;

  const posts = await Post.find({ author: userId })
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20)
    .exec();

  const postsWithResolvedUrls = await Promise.all(posts.map(async (post) => {
    const coverUrl = await FileService.getFileUrl(post.cover);
    return {
      ...post.toObject(),
      cover: coverUrl,
    };
  }));

  return { postsWithResolvedUrls, username };
};

/**
 * Retrieves all blog posts.
 * @returns {Promise<object[]>} An array of post documents with resolved cover URLs.
 */
const getAllPosts = async () => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 })
    .limit(20)
    .exec();

  const postsWithResolvedUrls = await Promise.all(posts.map(async (post) => {
    const coverUrl = await FileService.getFileUrl(post.cover);
    return {
      ...post.toObject(),
      cover: coverUrl,
    };
  }));

  return postsWithResolvedUrls;
};

/**
 * Retrieves a single post by its ID.
 * @param {string} id - The ID of the post.
 * @returns {Promise<object>} The post document with a resolved cover URL.
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

  const coverUrl = await FileService.getFileUrl(postDoc.cover);

  const postWithResolvedUrl = {
    ...postDoc.toObject(),
    cover: coverUrl,
  };

  return postWithResolvedUrl;
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

  if (postDoc.cover) {
    await FileService.deleteFile(postDoc.cover);
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

  const postsWithResolvedUrls = await Promise.all(results.map(async (post) => {
    const coverUrl = await FileService.getFileUrl(post.cover);
    return {
      ...post.toObject(),
      cover: coverUrl,
    };
  }));

  return postsWithResolvedUrls;
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