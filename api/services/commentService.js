const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { NotFoundError, AuthError } = require('../utils/errors');

/**
 * Retrieves all comments for a specific post.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<object[]>} An array of comment documents.
 */
const getCommentsForPost = async (postId) => {
  const comments = await Comment.find({ postId }).populate('author');
  return comments;
};

/**
 * Adds a new comment to a post.
 * @param {string} postId - The ID of the post to comment on.
 * @param {string} content - The content of the comment.
 * @param {string} authorId - The ID of the comment's author.
 * @returns {Promise<object>} The created comment document.
 * @throws {NotFoundError} If the post is not found.
 */
const addCommentToPost = async (postId, content, authorId) => {
  const postExists = await Post.findById(postId);
  if (!postExists) {
    throw new NotFoundError('Post not found');
  }

  const comment = new Comment({
    content,
    postId,
    author: authorId,
  });

  await comment.save();
  return comment;
};

/**
 * Deletes a comment.
 * @param {string} commentId - The ID of the comment to delete.
 * @param {string} userId - The ID of the user attempting to delete the comment.
 * @returns {Promise<{message: string}>} A success message.
 * @throws {NotFoundError} If the comment is not found.
 * @throws {AuthError} If the user is not authorized to delete the comment.
 */
const deleteComment = async (commentId, userId) => {
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new NotFoundError('Comment not found');
  }

  if (comment.author.toString() !== userId) {
    throw new AuthError('User not authorized to delete this comment');
  }

  await comment.deleteOne();
  return { message: 'Comment deleted successfully' };
};

module.exports = {
  getCommentsForPost,
  addCommentToPost,
  deleteComment,
};