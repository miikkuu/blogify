const express = require('express');
const { createPost, updatePost, getPosts, getPostsByUser, getPostById, updateLikeStatus, searchPosts, deletePost } = require('../controllers/postController');
const { getCommentsForPost, addCommentToPost, deleteComment } = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../external/s3Service'); // Import upload from the new s3Service
const validate = require('../middlewares/validationMiddleware');
const { postValidation } = require('../validations/postValidation');

const router = express.Router();

router.post('/', authMiddleware, upload.single('file'), validate(postValidation), createPost);
router.put('/:postId', authMiddleware, upload.single('file'), validate(postValidation), updatePost);
router.get('/search', searchPosts);
router.get('/', getPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id', getPostById);
router.get('/:postId/comments', getCommentsForPost);
router.post('/:postId/comments', authMiddleware, addCommentToPost);
router.post('/:postId/likestatus', updateLikeStatus);
router.delete('/:postId', authMiddleware, deletePost);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

module.exports = router;