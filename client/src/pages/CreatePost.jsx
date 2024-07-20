import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../components/Editor';

const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL;

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createNewPost = async (ev) => {
    ev.preventDefault();
    console.log('Content before submission:', content); // Log the content before submission

    const data = new FormData();
    data.append('title', title);
    data.append('summary', summary);
    data.append('content', content); // Ensure content is set
    data.append('file', file);
    console.log('Data before submission:', content ,title); // Log the data before submission

    try {
      const response = await fetch(`${API_BACKEND_URL}/posts`, {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/');
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post');
    }
  };

  return (
    <form onSubmit={createNewPost} className="max-w-2xl mx-auto mt-8">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-black"
      />
      <input
        type="text"
        placeholder="Summary"
        value={summary}
        onChange={(ev) => setSummary(ev.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-black"
      />
      <input
        type="file"
        onChange={(ev) => setFile(ev.target.files?.[0])}
        className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-black"
      />
      <Editor value={content} onChange={setContent} />
      {error && <p className="text-red-500">{error}</p>}
      <button className="w-full p-2 mt-4 bg-black text-white rounded hover:bg-gray-800">
        Create post
      </button>
    </form>
  );
};

export default CreatePost;
