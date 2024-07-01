const Comment = require('../models/Comment');
const Post = require('../models/Post');

exports.getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).populate('author');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

exports.addCommentToPost = async (req, res) => {
  try {
    console.log('req.user:', req.user);
    const { postId } = req.params;
    const { content } = req.body;
    const { id } = req.user; // Assuming req.user is populated by the auth middleware

    // Check if the post exists
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = new Comment({
      content,
      postId,
      author: id,
    });

    await comment.save();

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { id } = req.user; // Assuming req.user is populated by the auth middleware

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if the user is the author of the comment
    if (comment.author.toString() !== id) {
      return res.status(403).json({ message: 'User not authorized to delete this comment' });
    }

    await comment.remove();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};