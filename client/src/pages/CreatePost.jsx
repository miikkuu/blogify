import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../components/Editor';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState(null);
  const navigate = useNavigate();

  async function createNewPost(ev) {
    ev.preventDefault();
    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    if (files?.[0]) data.set('file', files[0]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts`, {
        method: 'POST',
        body: data,
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/');
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      // Handle error (e.g., show error message to user)
    }
  }

  return (
    <form onSubmit={createNewPost} className="max-w-2xl mx-auto mt-8">
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(ev) => setTitle(ev.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <input
        type="text"
        placeholder="Summary"
        value={summary}
        onChange={(ev) => setSummary(ev.target.value)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <input
        type="file"
        onChange={(ev) => setFiles(ev.target.files)}
        className="w-full p-2 mb-4 border border-gray-300 rounded"
      />
      <Editor value={content} onChange={setContent} />
      <button className="w-full p-2 mt-4 text-white bg-black rounded hover:bg-gray-800">
        Create post
      </button>
    </form>
  );
}