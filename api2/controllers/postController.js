const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment"); // Keep if used for comment deletion within post logic, or for PostService
const { postValidation } = require("../validations/postValidation");
// FileService is used by PostService, so direct import here might not be needed if all file logic is in PostService.
// However, PostService's formatPostForOutput itself uses FileService.getFileUrl.
// For now, PostService handles FileService interactions.
const PostService = require('../services/postService');


const createPost = async (req, res, next) => {
  const { error } = postValidation(req.body);
  if (error) {
      // Manually create an error object that errorMiddleware can understand
      const validationError = new Error(error.details.map(d => d.message).join(', '));
      validationError.statusCode = 400;
      return next(validationError);
  }
  
  try {
    // req.body contains title, summary, content
    const postDoc = await PostService.createPost(req.body, req.user.id, req.file);
    const responsePost = await PostService.formatPostForOutput(postDoc);
    res.status(201).json(responsePost); // 201 for successful creation
  } catch (e) {
    next(e);
  }
};

const updatePost = async (req, res, next) => {
  const { postId } = req.params;
  // We could add validation for req.body here if needed
  
  try {
    const postDoc = await PostService.updatePost(postId, req.body, req.user.id, req.file);
    const responsePost = await PostService.formatPostForOutput(postDoc);
    res.json(responsePost);
  } catch (e) {
    // Errors from PostService (e.g., not found, not authorized) will be caught here
    next(e);
  }
};

const getPostsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId); // Fetch user to get username
    const username = user ? user.username : null;

    // Data fetching remains in controller for now
    const posts = await Post.find({ author: userId })
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    const responsePosts = await PostService.formatPostsForOutput(posts);

    const result = {
      posts: responsePosts, // Renamed for clarity
      username,
    };

    console.log(`Found ${responsePosts.length} posts for user ${username || userId}`);
    res.json(result);
  } catch (e) {
    console.error("Error fetching posts by user:", e);
    next(e);
  }
};

const getPosts = async (req, res, next) => {
  try {
    // Data fetching remains in controller
    const posts = await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    const responsePosts = await PostService.formatPostsForOutput(posts);
    res.json(responsePosts);
  } catch (e) {
    console.error("Error fetching posts:", e);
    next(e);
  }
};

const getPostById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Data fetching remains in controller
    const postDoc = await Post.findById(id).populate("author", [
      "username",
      { path: "_id", select: "userId" },
    ]);

    if (!postDoc) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      return next(error);
    }

    const responsePost = await PostService.formatPostForOutput(postDoc);
    res.json(responsePost);
  } catch (e) {
    console.error("Error fetching post by ID:", e);
    next(e);
  }
};

const updateLikeStatus = async (req, res, next) => {
  const { postId } = req.params;
  const action = req.query.action;

  try {
    const postDoc = await Post.findById(postId);
    if (!postDoc) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      return next(error);
    }

    if (action === "like") {
      postDoc.like = (postDoc.like || 0) + 1;
    } else if (action === "unlike") {
      postDoc.like = Math.max(0, (postDoc.like || 0) - 1); // Ensure likes don't go below 0
    } else {
      const error = new Error('Invalid action');
      error.statusCode = 400;
      return next(error);
    }
    await postDoc.save();

    const responsePost = await PostService.formatPostForOutput(postDoc);
    res.json(responsePost);
  } catch (e) {
    next(e);
  }
};

const deletePost = async (req, res, next) => {
  const { postId } = req.params;
  
  try {
    await PostService.deletePost(postId, req.user.id);
    res.json({ message: "Post deleted successfully" });
  } catch (e) {
    // Errors from PostService (e.g., not found, not authorized) will be caught here
    next(e);
  }
};

const searchPosts = async (req, res, next) => {
  const { search } = req.query;

  try {
    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const results = await Post.find(query)
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    const responsePosts = await PostService.formatPostsForOutput(results);

    console.log('Posts count:', responsePosts.length);
    res.json(responsePosts);
  } catch (error) {
    console.error('Error searching posts:', error);
    next(error);
  }
};

// deleteComment is not part of postController, it's in commentController.
// If it was meant to be here, it would need to be defined.
// Assuming it's correctly in commentController and handled by postRoutes.js imports.

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPosts,
  getPostsByUser,
  getPostById,
  updateLikeStatus,
  searchPosts,
  // deleteComment, // This was in postController before, but it's specific to comments.
                  // It's correctly handled in commentController and postRoutes.js now.
};
