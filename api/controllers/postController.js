const Post = require("../models/Post");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Comment = require("../models/Comment");
const { postValidation } = require("../validations/postValidation");
const { s3Client } = require("../config/s3Config");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getPresignedUrl } = require("../config/s3Config.js");
const secret = process.env.JWT_SECRET;

const createPost = async (req, res, next) => {
  const { error } = postValidation(req.body);
  if (error) return res.status(400).json(error.details);
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) return next(err);
    try {
      const { title, summary, content } = req.body;
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: req.file
          ? req.file.location // S3 file URL
          : "https://via.placeholder.com/400x200?text=Image+Not+Available",
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
        // Delete old file from S3
        if (
          postDoc.cover !=
          "https://via.placeholder.com/400x200?text=Image+Not+Available"
        ) {
          console.log("Deleting old image from S3");
          const oldKey = postDoc.cover;
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: oldKey,
          });
          await s3Client.send(deleteCommand);
        }

        if (postDoc.cover != req.file.location) {
          console.log("Updating new image");
          postDoc.cover = req.file.location; // update if new image recieved
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
    }

    const postsWithPresignedUrls = await Promise.all(
      posts.map(async (post) => {
        try {
          let presignedUrl = null;
       
            const coverKey = new URL(post.cover).pathname.substring(1); // Remove the leading slash
            presignedUrl = await getPresignedUrl(coverKey);
          
          return {
            ...post.toObject(),
            cover: presignedUrl ? presignedUrl : "https://via.placeholder.com/400x200?text=Image+Not+Available", // Fallback to original cover if presigned URL fails
          };
        } catch (error) {
          console.error(
            "Error generating presigned URL for post:",
            post.id,
            error
          );
          return post.toObject(); // Fallback to the original post object on error
        }
      })
    );
    const result = {
      postsWithPresignedUrls,
      username,
    };
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

    const postsWithPresignedUrls = await Promise.all(
      posts.map(async (post) => {
        try {
          let presignedUrl = null;

          const coverKey = new URL(post.cover).pathname.substring(1); // Remove the leading slash
          presignedUrl = await getPresignedUrl(coverKey);

          return {
            ...post.toObject(),
            cover: presignedUrl ? presignedUrl : "https://via.placeholder.com/400x200?text=Image+Not+Available", // Fallback to original cover if presigned URL fails
          };
        } catch (error) {
          console.error(
            "Error generating presigned URL for post:",
            post.id,
            error
          );
          return post.toObject(); // Fallback to the original post object on error
        }
      })
    );

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

    // Generate pre-signed URL for the post's cover image
    // Extract the key from the full URL
    let presignedUrl = null;
      const coverKey = new URL(postDoc.cover).pathname.substring(1);
      presignedUrl = await getPresignedUrl(coverKey);
    
    const postWithPresignedUrl = {
      ...postDoc.toObject(),
      cover: presignedUrl ? presignedUrl : "https://via.placeholder.com/400x200?text=Image+Not+Available", // Fallback to original cover if presigned URL fails
    };

    res.json(postWithPresignedUrl);
  } catch (e) {
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

      // Delete the image from S3 if it exists
      if (
        postDoc.cover !==
          "https://via.placeholder.com/400x200?text=Image+Not+Available"
          && process.env.AWS_BUCKET_NAME
      ) {
        const coverKey = postDoc.cover; // Extract the key from the URL
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: coverKey,
        });
        await s3Client.send(deleteCommand);
        console.log("Deleted old image from S3");
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
      // Perform search using MongoDB Atlas Search
      results = await Post.aggregate([
        {
          $search: {
            index: 'default', // Replace with your search index name if different
            compound: {
              should: [
                {
                  text: {
                    query: search,
                    path: ['title', 'summary', 'content'],
                    fuzzy: {
                      maxEdits: 2,
                    }
                  }
                },
                {
                  autocomplete: {
                    query: search,
                    path: 'title',
                    fuzzy: {
                      maxEdits: 2,
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $lookup: {
            from: 'users', // The collection to join
            localField: 'author', // Field from the Post collection
            foreignField: '_id', // Field from the User collection
            as: 'author' // Alias for the joined collection
          }
        },
        {
          $unwind: '$author' // Unwind the joined collection
        },
        {
          $project: {
            'author.password': 0, // Exclude the password field if it exists
            'author.email': 0, // Exclude the email field if it exists
            'author._id': 0, // Exclude the _id field if it exists
            'author.__v': 0, // Exclude the __v field if it exists
            'author.createdAt': 0, // Exclude the createdAt field if it exists
            'author.updatedAt': 0, // Exclude the updatedAt field if it exists
            // Include other fields as needed
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $limit: 10 // Limit the number of results
        }
      ]);
      
    }
  
   // Convert results to plain JavaScript objects if needed
   const plainResults = results.map(post => JSON.parse(JSON.stringify(post)));

   // Example of generating presigned URLs (if needed)
   const postsWithPresignedUrls = await Promise.all(
    plainResults.map(async (post) => {
      try {
        let presignedUrl = null;

        const coverKey = new URL(post.cover).pathname.substring(1); // Remove the leading slash
        presignedUrl = await getPresignedUrl(coverKey);

        return {
          ...post,
          cover: presignedUrl ? presignedUrl : "https://via.placeholder.com/400x200?text=Image+Not+Available", // Fallback to original cover if presigned URL fails
        };
      } catch (error) {
        console.error(
          "Error generating presigned URL for post:",
          post.id,
          error
        );
        return post; // Fallback to the original post object on error
      }
    })
  );
  console.log('Posts with presigned URLs:', postsWithPresignedUrls.length);
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
