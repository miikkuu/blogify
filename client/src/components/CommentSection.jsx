import { useCallback, useEffect, useState, useContext } from 'react';
import { format } from 'date-fns';
import { UserContext } from '../contexts/UserContext';

export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { userInfo } = useContext(UserContext);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts/${postId}/comments`);
      if (response.ok) {
        await response.json().then((data) => setComments(data));
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmitComment(e) {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
        credentials: 'include',
      });
      if (response.ok) {
        setNewComment('');
        fetchComments();
      } else {
        throw new Error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      {comments.map((comment) => (
        <div key={comment._id} className="mb-4 p-4 bg-gray-100 rounded">
          <p className="font-semibold">{comment.author.username}</p>
          <p>{comment.content}</p>
          <time className="text-sm text-gray-500">
            {format(new Date(comment.createdAt), 'd MMMM yyyy HH:mm')}
          </time>
        </div>
      ))}
      {userInfo && (
        <form onSubmit={handleSubmitComment} className="mt-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 border border-gray-300 rounded"
            rows="3"
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Submit Comment
          </button>
        </form>
      )}
    </div>
  );
}