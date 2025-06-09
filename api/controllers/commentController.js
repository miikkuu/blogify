const asyncHandler = require('express-async-handler');
const commentService = require('../services/commentService');

const getCommentsForPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const comments = await commentService.getCommentsForPost(postId);
  res.json(comments);
});

const addCommentToPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  const { id } = req.user;
  const comment = await commentService.addCommentToPost(postId, content, id);
  res.status(201).json(comment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { id } = req.user;
  const result = await commentService.deleteComment(commentId, id);
  res.json(result);
});

module.exports = {
  getCommentsForPost,
  addCommentToPost,
  deleteComment,
};