const Post = require("../models/Post");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");
const { postValidation } = require("../validations/postValidation");
const {
  s3Client,
  getPresignedUrl,
  DeleteObjectCommand,
  hasValidAwsCredentials
} = require("../config/s3Config.js");
const secret = process.env.JWT_SECRET;

const createPost = async (req, res, next) => {
  const { error } = postValidation(req.body);
  if (error) return res.status(400).json(error.details);
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return next(err);
    try {
      const { title, summary, content } = req.body;
      // Determine the cover URL based on storage type
      let coverUrl = "https://placehold.co/400x200/lightgray/darkgray?text=No+Image";

      if (req.file) {
        if (hasValidAwsCredentials && req.file.location) {
          // For S3 storage
          coverUrl = req.file.location;
          console.log("Using S3 image URL:", coverUrl);
        } else if (req.file.path) {
          // For local storage
          const relativePath = req.file.path.split('uploads/')[1] || req.file.filename;
          coverUrl = `/api/uploads/${relativePath}`;
          console.log("Using local image URL:", coverUrl);
        }
      }

      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: coverUrl,
        author: info.id,
      });
      res.json(postDoc);
    } catch (e) {
      next(e);
    }
  });
};

const updatePost = async (req, res, next) => {
  const { token } = req.cookies;
  const { postId } = req.params;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return next(err);

    try {
      const { title, summary, content } = req.body;
      const postDoc = await Post.findById(postId);
      if (!postDoc.author.equals(info.id)) {
        return res.status(400).json("You are not the author");
      }
      postDoc.title = title;
      postDoc.summary = summary;
      postDoc.content = content;
      if (req.file) {
        // Handle file upload based on whether AWS is configured
        if (hasValidAwsCredentials && s3Client && DeleteObjectCommand) {
          // Delete old file from S3 if it's not a placeholder
          if (
            postDoc.cover &&
            postDoc.cover !== "https://via.placeholder.com/400x200?text=Image+Not+Available" &&
            !postDoc.cover.includes('placeholder')
          ) {
            try {
              console.log("Deleting old image from S3");
              let oldKey = postDoc.cover;

              // Extract key from URL if needed
              if (oldKey.startsWith('http')) {
                try {
                  oldKey = new URL(oldKey).pathname.substring(1);
                } catch (urlError) {
                  console.log('Invalid URL, using as key:', oldKey);
                }
              }

              const deleteCommand = new DeleteObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: oldKey,
              });
              await s3Client.send(deleteCommand);
            } catch (error) {
              console.log("Error deleting old image:", error.message);
              // Continue with the update even if delete fails
            }
          }

          // Update with new S3 location
          if (req.file.location && postDoc.cover !== req.file.location) {
            console.log("Updating with new S3 image");
            postDoc.cover = req.file.location;
          }
        } else {
          // For local storage
          if (req.file.path) {
            console.log("Updating with new local image");
            // Create a URL path that can be served by the Express static middleware
            const relativePath = req.file.path.split('uploads/')[1] || req.file.filename;
            postDoc.cover = `/api/uploads/${relativePath}`;
          }
        }
      }
      await postDoc.save();
      res.json(postDoc);
    } catch (e) {
      next(e);
    }
  });
};

const getPostsByUser = async (req, res, next) => {
  let posts;
  try {
    const { userId } = req.params;
    const user = (await User.findById(userId)) || null;
    const username = user ? user.username : null;

    try {
      posts = await Post.find({ author: userId }) // Removed const to use the outer scope variable
        .populate("author", ["username"])
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    } catch (e) {
      console.log("error while finding post with userId", e);
      posts = [];
    }

    // Simplified version that doesn't rely on S3 presigned URLs
    const postsWithPresignedUrls = posts.map(post => {
      try {
        return {
          ...post.toObject(),
          cover: post.cover || "https://placehold.co/400x200/lightgray/darkgray?text=No+Image"
        };
      } catch (error) {
        console.error("Error processing post:", post.id, error);
        return post.toObject ? post.toObject() : post;
      }
    });

    const result = {
      postsWithPresignedUrls,
      username,
    };

    console.log(`Found ${postsWithPresignedUrls.length} posts for user ${username || userId}`);
    res.json(result);
  } catch (e) {
    console.error("Error fetching posts using userId:", e);
    next(e); // Ensure error handling middleware can catch this
  }
};

const getPosts = async (req, res, next) => {
  try {
    // Use exec() for clear promise-based queries
    const posts = await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
      .exec();

    // Simplified version that doesn't rely on S3 presigned URLs for local development
    const postsWithPresignedUrls = posts.map(post => {
      try {
        return {
          ...post.toObject(),
          cover: post.cover || "https://placehold.co/400x200/lightgray/darkgray?text=No+Image"
        };
      } catch (error) {
        console.error("Error processing post:", post.id, error);
        return post.toObject();
      }
    });

    res.json(postsWithPresignedUrls);
  } catch (e) {
    console.error("Error fetching posts:", e);
    next(e); // Ensure error handling middleware can catch this
  }
};

const getPostById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const postDoc = await Post.findById(id).populate("author", [
      "username",
      { path: "_id", select: "userId" },
    ]);

    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Simplified version that doesn't rely on S3 presigned URLs
    const postWithPresignedUrl = {
      ...postDoc.toObject(),
      cover: postDoc.cover || "https://placehold.co/400x200/lightgray/darkgray?text=No+Image"
    };

    res.json(postWithPresignedUrl);
  } catch (e) {
    console.error("Error fetching post by ID:", e);
    next(e);
  }
};
const updateLikeStatus = async (req, res, next) => {
  const { postId } = req.params;
  const action = req.query.action; // 'like' or 'unlike'

  try {
    const postDoc = await Post.findById(postId);
    if (action === "like") {
      postDoc.like += 1;
    } else if (action === "unlike") {
      postDoc.like -= 1;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
    await postDoc.save();
    res.json(postDoc);
  } catch (e) {
    next(e);
  }
};

const deletePost = async (req, res, next) => {
  const { postId } = req.params;
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return next(err);

    try {
      const postDoc = await Post.findById(postId);
      if (!postDoc) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (!postDoc.author.equals(info.id)) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete this post" });
      }

      // Delete the image if it exists and is not a placeholder
      if (
        postDoc.cover &&
        postDoc.cover !== "https://placehold.co/400x200/lightgray/darkgray?text=No+Image" &&
        !postDoc.cover.includes('placeholder')
      ) {
        // Handle S3 deletion if AWS is configured
        if (hasValidAwsCredentials && s3Client && DeleteObjectCommand) {
          try {
            let coverKey = postDoc.cover;

            // Extract key from URL if needed
            if (coverKey.startsWith('http')) {
              try {
                coverKey = new URL(coverKey).pathname.substring(1);
              } catch (urlError) {
                console.log('Invalid URL, using as key:', coverKey);
              }
            }

            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: coverKey,
            });
            await s3Client.send(deleteCommand);
            console.log("Deleted image from S3:", coverKey);
          } catch (error) {
            console.log("Error deleting image from S3:", error.message);
            // Continue with post deletion even if image deletion fails
          }
        } else if (postDoc.cover.startsWith('/api/uploads/')) {
          // For local storage, try to delete the file
          try {
            const fs = require('fs');
            const path = require('path');
            const filename = postDoc.cover.split('/').pop();
            const filePath = path.join(__dirname, '..', 'uploads', filename);

            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log("Deleted local image:", filePath);
            }
          } catch (error) {
            console.log("Error deleting local image:", error.message);
            // Continue with post deletion even if image deletion fails
          }
        }
      }

      //Delete Comments
      await Comment.deleteMany({ postId: postId });

      // Delete the post from the database
      await postDoc.remove();
      res.json({ message: "Post deleted successfully" });
    } catch (e) {
      console.error("Error deleting post:", e);
      next(e);
    }
  });
};

const searchPosts = async (req, res) => {
  const { search } = req.query;

  try {
    let results;

    if (!search) {
      // If no search query is provided, return all posts
      results = await Post.find()
        .populate("author", ["username"])
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    } else {
      // Simple text search without Atlas Search
      results = await Post.find({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ]
      })
        .populate("author", ["username"])
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    }

    // Simplified version that doesn't rely on S3 presigned URLs for local development
    const postsWithPresignedUrls = results.map(post => {
      try {
        return {
          ...post.toObject(),
          cover: post.cover || "https://placehold.co/400x200/lightgray/darkgray?text=No+Image"
        };
      } catch (error) {
        console.error("Error processing post:", post.id, error);
        return post.toObject ? post.toObject() : post;
      }
    });

    console.log('Posts count:', postsWithPresignedUrls.length);
    res.json(postsWithPresignedUrls);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteComment = async (req, res, next) => {
  console.log("deleteComment");
  const {id} = req.query;
  console.log("id", id);
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return next(err);

    try {
      //find the comment to be deleted
      const commentDoc = await Comment.findOne({id});
      console.log("commentDoc");
      if (!commentDoc) {
        return res.status(404).json({ message: "Comment not found" });
      }

      //check if the request is from the owner
      if (!commentDoc.author.equals(info.id)) {
        return res
          .status(403)
          .json({ message: "You are not authorized to delete this Comment" });
      }

      //Delete Comment
      await Comment.deleteOne({ id });
      res.json({ message: "Comment deleted successfully" });
    } catch (e) {
      console.error("Error deleting comment:", e);
      next(e);
    }
  });
}

module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPosts,
  getPostsByUser,
  getPostById,
  updateLikeStatus,
  searchPosts,
  deleteComment,
};
