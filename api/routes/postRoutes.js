const express = require('express');
const { createPost, updatePost, getPosts, getPostsByUser, getPostById, updateLikeStatus ,searchPosts} = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/s3Config');
const router = express.Router();

router.post('/', authMiddleware, upload.single('file'), createPost);
router.put('/:postId', authMiddleware,upload.single('file'), updatePost);
router.get('/search', searchPosts);
router.get('/', getPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id', getPostById);
router.get('/:postId/comments', require('../controllers/commentController').getCommentsForPost);
router.post('/:postId/comments', authMiddleware, require('../controllers/commentController').addCommentToPost);
router.post('/:postId/likestatus', updateLikeStatus);
router.delete('/:postId', authMiddleware, require('../controllers/postController').deletePost);
router.delete('/comments/:commentId',authMiddleware, require('../controllers/commentController').deleteComment);


module.exports = router;