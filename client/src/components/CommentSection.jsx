import { useCallback, useEffect, useState, useContext } from "react";
import { format } from "date-fns";
import { UserContext } from "../contexts/UserContext";
import { Link } from "react-router-dom";

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { userInfo } = useContext(UserContext);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BACKEND_URL}/posts/${postId}/comments`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        throw new Error("Failed to fetch comments");
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDeleteComment = useCallback(async (comment) => {
    const { _id } = comment;

    try {
      const response = await fetch(`${API_BACKEND_URL}/posts/comments/${_id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete post");
      }
      setComments((prevComments) =>
        prevComments.filter((c) => c._id !== _id)
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }, []);

  const handleSubmitComment = useCallback(async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${API_BACKEND_URL}/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newComment }),
          credentials: "include",
        }
      );
      if (response.ok) {
        setNewComment("");
        fetchComments();
      } else {
        throw new Error("Failed to submit comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  }, [fetchComments, newComment, postId]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Comments
      </h2>
      {comments.map((comment) => {
        const username =
          comment.author?.username?.split(" ").slice(0, 2).join(" ") ||
          comment.author?.username;
        const userId = comment.author?._id;

        return (
          <div
            key={comment._id}
            className="mb-4 p-4 bg-gray-200 dark:bg-gray-800 rounded"
          >
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {username}
            </p>
            <p className="text-gray-800 dark:text-gray-300">
              {comment.content}
            </p>
            {userInfo?.id === userId && (
              <button
                onClick={() => handleDeleteComment(comment)}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-700 float-right"
              >
                Delete Comment
              </button>
            )}
            <time className="text-sm text-gray-500 dark:text-gray-400">
              {format(new Date(comment.createdAt), "d MMMM yyyy HH:mm")}
            </time>
          </div>
        );
      })}
      {userInfo ? (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."

            className="w-full p-2 border border-gray-300 rounded text-black bg-gray-200"

          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Submit
          </button>
        </form>
      ) : (
        <p className="mt-4 mx-4 text-gray-500 dark:text-gray-400">
          Please 
          <Link to="/login" className="text-blue-500 hover:underline"> log in </Link> 
          to add a comment.
        </p>
      )}    
    
    
    </div>
  );
}
