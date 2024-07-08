import { useEffect , useContext, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Step 1: Import useNavigate
import { UserContext } from "../contexts/UserContext";
import CommentSection from "../components/CommentSection";

export default function PostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [error, setError] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();

  async function fetchPostInfo() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch post");
      }
      const data = await response.json();
      setPostInfo(data);
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Failed to load the post. Please try again later.");
    }
  }
  useEffect(() => {
    fetchPostInfo();
  }, [id]);
  
  async function handleLike() {
    const status = isLiked ? `unlike` : `like`;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BACKEND_URL}/posts/${id}/likeStatus?action=${status}`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to ${isLiked ? "unlike" : "like"} post`);
      }
      setIsLiked(!isLiked); // Toggle the like status
      fetchPostInfo(); // Directly call fetchPostInfo to refresh post data
    } catch (error) {
      console.error(`Error ${isLiked ? "unliking" : "liking"} post:`, error);
      setError(
        `Failed to ${isLiked ? "unlike" : "like"} the post. Please try again.`
      );
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to delete post");
      }
      navigate("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      setError("Failed to delete the post. Please try again.");
    }
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  if (!postInfo) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <h1 className="text-4xl font-bold mb-4">{postInfo.title}</h1>
      <div className="flex items-center justify-between mb-4">
        <div>
          <time
            className="text-gray-500 block mb-2"
            style={{ fontSize: "0.875rem" }}
          >
            {new Date(postInfo.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            at{" "}
            {new Date(postInfo.createdAt).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </time>
          <p className="text-gray-700">by @{postInfo.author.username}</p>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleLike}
            className="flex items-center mr-4 text-gray-600 hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-1"
              fill={isLiked ? "red" : "none"} // Step 3: Conditionally set SVG fill
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {parseInt(postInfo.like)}
          </button>
          {userInfo && userInfo.id === postInfo.author._id && (
            <Link
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              to={`/edit/${postInfo._id}`}
            >
              Edit this post
            </Link>
          )}

          {userInfo && userInfo.id === postInfo.author._id && (
            <button
              onClick={handleDelete}
              className="mx-5 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete{" "}
            </button>
          )}
        </div>
      </div>
      <div className="mb-8">
        <img
          src={postInfo.cover}
          alt={postInfo.title}
          className="w-full h-64 object-cover rounded"
        />
      </div>
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: postInfo.content }}
      />
      <CommentSection postId={id} />
    </div>
  );
}
