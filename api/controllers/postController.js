const asyncHandler = require('express-async-handler');
const { postValidation } = require("../validations/postValidation");
const { ValidationError } = require('../utils/errors');
const postService = require('../services/postService');

const createPost = asyncHandler(async (req, res) => {
  const { error } = postValidation.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { title, summary, content } = req.body;
  const postDoc = await postService.createPost(title, summary, content, req.file, req.user.id);
  res.json(postDoc);
});

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { title, summary, content } = req.body;

  const { error } = postValidation.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const postDoc = await postService.updatePost(postId, title, summary, content, req.file, req.user.id);
  res.json(postDoc);
});

const getPostsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await postService.getPostsByUser(userId);
  res.json(result);
});

const getPosts = asyncHandler(async (req, res) => {
  const posts = await postService.getAllPosts();
  res.json(posts);
});

const getPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await postService.getPostById(id);
  res.json(post);
});

const updateLikeStatus = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const action = req.query.action;
  const postDoc = await postService.updateLikeStatus(postId, action);
  res.json(postDoc);
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const result = await postService.deletePost(postId, req.user.id);
  res.json(result);
});

const searchPosts = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const results = await postService.searchPosts(search);
  res.json(results);
});

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPosts,
  getPostsByUser,
  getPostById,
  updateLikeStatus,
  searchPosts,
};
