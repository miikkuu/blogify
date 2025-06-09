const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const { postValidation } = require("../validations/postValidation");
const fs = require('fs').promises; // For asynchronous file operations
const path = require('path'); // For path manipulation

  // Authentication is handled by authMiddleware, so req.user is available
  // No need for token or jwt.verify here
  
const {
  s3Client,
  getPresignedUrl,
  DeleteObjectCommand,
  hasValidAwsCredentials
} = require("../config/s3Config.js");

const DEFAULT_PLACEHOLDER_IMAGE = "https://placehold.co/400x200/lightgray/darkgray?text=No+Image";

const createPost = async (req, res, next) => {
  const { error } = postValidation(req.body);
  if (error) return res.status(400).json(error.details);
  
  try {
    const { title, summary, content } = req.body;
    // Determine the cover URL based on storage type
    let coverUrl = DEFAULT_PLACEHOLDER_IMAGE;

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
      author: req.user.id, // Use req.user.id from authMiddleware
    });
    res.json(postDoc);
  } catch (e) {
    next(e);
  }
};

const updatePost = async (req, res, next) => {
  const { postId } = req.params;
  
  try {
    const { title, summary, content } = req.body;
    const postDoc = await Post.findById(postId);

    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!postDoc.author.equals(req.user.id)) { // Use req.user.id from authMiddleware
      return res.status(403).json("You are not authorized to edit this post");
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
          postDoc.cover !== DEFAULT_PLACEHOLDER_IMAGE &&
          !postDoc.cover.includes('placeholder')
        ) {
          try {
            console.log("Deleting old image from S3");
            let oldKey = postDoc.cover;

            // Robustly extract key from S3 URL
            try {
              const url = new URL(oldKey);
              oldKey = url.pathname.substring(1); // Remove leading slash
            } catch (urlError) {
              console.log('Invalid S3 URL format, using full URL as key:', oldKey);
              // Fallback to using the full URL as key if it's not a valid URL
            }
            
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: oldKey,
            });
            await s3Client.send(deleteCommand);
          } catch (error) {
            console.log("Error deleting old image from S3:", error.message);
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

    const postsWithPresignedUrls = await Promise.all(posts.map(async (post) => {
      try {
        let cover = post.cover;
        if (hasValidAwsCredentials && cover && cover !== DEFAULT_PLACEHOLDER_IMAGE && !cover.includes('placeholder')) {
          cover = await getPresignedUrl(cover);
        }
        return {
          ...post.toObject(),
          cover: cover || DEFAULT_PLACEHOLDER_IMAGE,

        };
      } catch (error) {
        console.error("Error processing post:", post.id, error);
        return post.toObject ? post.toObject() : post;
      }
    }));


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
    
    const posts = await Post.find()
      .populate("author", ["username"]) // Populate author with username field.
      .sort({ createdAt: -1 }) // Sort posts by createdAt in descending order.
      .limit(20) // Limit the number of posts returned to 20.
      .exec(); //exec executes the query and returns the results

    const postsWithPresignedUrls = await Promise.all(posts.map(async (post) => {
      try {
        let cover = post.cover;
        if (hasValidAwsCredentials && cover && cover !== DEFAULT_PLACEHOLDER_IMAGE && !cover.includes('placeholder')) {
          cover = await getPresignedUrl(cover);
        }
        return {
          ...post.toObject(),
          cover: cover || DEFAULT_PLACEHOLDER_IMAGE,

        };
      } catch (error) {
        console.error("Error processing post:", post.id, error);
        return post.toObject();
      }
    }));


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
      { path: "_id", select: "userId" },//the path and select options are used to include the userId in the returned post object.the path option specifies the path to the document to populate, and the select option specifies the fields to include in the populated document.
    ]);

    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }

    let cover = postDoc.cover;
    if (hasValidAwsCredentials && cover && cover !== DEFAULT_PLACEHOLDER_IMAGE && !cover.includes('placeholder')) {
      cover = await getPresignedUrl(cover);
    }

    const postWithPresignedUrl = {
      ...postDoc.toObject(),
      cover: cover || DEFAULT_PLACEHOLDER_IMAGE,

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
  
  try {
    const postDoc = await Post.findById(postId);
    if (!postDoc) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (!postDoc.author.equals(req.user.id)) { // Use req.user.id from authMiddleware
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this post" });
    }

    // Delete the image if it exists and is not a placeholder
    if (
      postDoc.cover &&
      postDoc.cover !== DEFAULT_PLACEHOLDER_IMAGE &&
      !postDoc.cover.includes('placeholder')
    ) {
      // Handle S3 deletion if AWS is configured
      if (hasValidAwsCredentials && s3Client && DeleteObjectCommand) {
        try {
          let coverKey = postDoc.cover;

          // Robustly extract key from S3 URL
          try {
            const url = new URL(coverKey);
            coverKey = url.pathname.substring(1); // Remove leading slash
          } catch (urlError) {
            console.log('Invalid S3 URL format, using full URL as key:', coverKey);
            // Fallback to using the full URL as key if it's not a valid URL
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
        // For local storage, try to delete the file asynchronously
        try {
          const filename = postDoc.cover.split('/').pop();
          const filePath = path.join(__dirname, '..', 'uploads', filename);

          await fs.unlink(filePath); // Use fs.promises.unlink
          console.log("Deleted local image:", filePath);
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

    const postsWithPresignedUrls = await Promise.all(results.map(async (post) => {
      try {
        let cover = post.cover;
        if (hasValidAwsCredentials && cover && cover !== DEFAULT_PLACEHOLDER_IMAGE && !cover.includes('placeholder')) {
          cover = await getPresignedUrl(cover);
        }
        return {
          ...post.toObject(),
          cover: cover || DEFAULT_PLACEHOLDER_IMAGE,

        };
      } catch (error) {
        console.error("Error processing post:", post.id, error);
        return post.toObject ? post.toObject() : post;
      }
    }));


    console.log('Posts count:', postsWithPresignedUrls.length);
    res.json(postsWithPresignedUrls);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteComment = async (req, res, next) => {
  console.log("deleteComment");
  const { commentId } = req.params; // Correctly get commentId from params
  console.log("commentId", commentId);
  
  // Authentication is handled by authMiddleware, so req.user is available
  // No need for token or jwt.verify here

  try {
    //find the comment to be deleted
    const commentDoc = await Comment.findById(commentId); // Use findById for direct ID lookup
    console.log(commentDoc);
    if (!commentDoc) {
      return res.status(404).json({ message: "Comment not found" });
    }

    //check if the request is from the owner
    if (!commentDoc.author.equals(req.user.id)) { // Use req.user.id from authMiddleware
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this Comment" });
    }

    //Delete Comment
    await Comment.deleteOne({ _id: commentId }); // Use _id for deletion
    res.json({ message: "Comment deleted successfully" });
  } catch (e) {
    console.error("Error deleting comment:", e);
    next(e);
  }
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
