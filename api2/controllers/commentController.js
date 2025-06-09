const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.getCommentsForPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).populate('author');
    res.json(comments);
  } catch (error) {
    // Pass error to the centralized error handler
    error.message = error.message || 'Error fetching comments'; // Ensure there's a message
    next(error);
  }
};

exports.addCommentToPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const { id } = req.user; // Assuming req.user is populated by the auth middleware

    // Check if the post exists
    const postExists = await Post.findById(postId);
    if (!postExists) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      return next(err);
    }

    if (!content || content.trim() === '') {
      const err = new Error('Comment content cannot be empty');
      err.statusCode = 400;
      return next(err);
    }

    const comment = new Comment({
      content,
      postId,
      author: id,
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    // Pass error to the centralized error handler
    error.message = error.message || 'Error adding comment'; // Ensure there's a message
    next(error);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { id } = req.user; // Assuming req.user is populated
    const comment = await Comment.findById(commentId);

    if (!comment) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      return next(err);
    }

    // Check if the user is the author of the comment
    if (comment.author.toString() !== id) {
      const err = new Error('User not authorized to delete this comment');
      err.statusCode = 403;
      return next(err);
    }

    // await comment.remove(); // .remove() is deprecated on Mongoose documents
    await Comment.findByIdAndDelete(commentId);


    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    // Pass error to the centralized error handler
    error.message = error.message || 'Error deleting comment'; // Ensure there's a message
    next(error);
  }
};