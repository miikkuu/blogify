const express = require('express');
const {
    createPost,
    updatePost,
    getPosts,
    getPostsByUser,
    getPostById,
    updateLikeStatus,
    searchPosts,
    deletePost // Ensure deletePost is imported here
} = require('../controllers/postController');
const {
    getCommentsForPost,
    addCommentToPost,
    deleteComment
} = require('../controllers/commentController'); // Import commentController methods
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/s3Config');
const router = express.Router();

router.post('/', authMiddleware, upload.single('file'), createPost);
router.put('/:postId', authMiddleware,upload.single('file'), updatePost);
router.get('/search', searchPosts);
router.get('/', getPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id', getPostById);
router.get('/:postId/comments', getCommentsForPost); // Use imported method
router.post('/:postId/comments', authMiddleware, addCommentToPost); // Use imported method
router.post('/:postId/likestatus', updateLikeStatus);
router.delete('/:postId', authMiddleware, deletePost); // Use imported method
router.delete('/comments/:commentId',authMiddleware, deleteComment); // Use imported method


module.exports = router;