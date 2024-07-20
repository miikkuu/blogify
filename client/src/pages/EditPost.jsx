import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Editor from "../components/Editor";

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

const EditPost = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BACKEND_URL}/posts/${id}`)
      .then(response => response.json())
      .then(postInfo => {
        setTitle(postInfo.title);
        setContent(postInfo.content);
        setSummary(postInfo.summary);
      })
      .catch(err => setError('Failed to load post'));
  }, [id]);

  const updatePost = async (ev) => {
    ev.preventDefault();
    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    data.set('id', id);
    if (file) {
      data.set('file', file);
    }

    try {
      const response = await fetch(`${API_BACKEND_URL}/posts/${id}`, {
        method: 'PUT',
        body: data,
        credentials: 'include',
      });
      if (response.ok) {
        setRedirect(true);
      } else {
        const result = await response.json();
        setError(result.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      setError('An error occurred. Please try again.');
    }
  };

  if (redirect) {
    return <Navigate to={'/post/' + id} />
  }

  return (
    <form onSubmit={updatePost} className="max-w-2xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Post</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <input
        type="title"
        placeholder="Title"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <input
        type="summary"
        placeholder="Summary"
        value={summary}
        onChange={(ev) => setSummary(ev.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <input
        type="file"
        onChange={(ev) => setFile(ev.target.files?.[0])}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <Editor onChange={setContent} value={content} />
      <button className="w-full p-2 mt-4 bg-black text-white rounded hover:bg-gray-800">
        Update post
      </button>
    </form>
  );
};

export default EditPost;
