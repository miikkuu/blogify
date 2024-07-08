import { useEffect, useState } from "react";
import Post from "../components/Post";

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts`)
      .then(response => response.json())
      .then(posts => {
        setPosts(posts); // Set the posts state
      })
      .catch(error => console.error('Error fetching posts:', error));
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-semibold italic mb-8 text-center hover:scale-95 ease-in-out duration-500">Latest Posts ...</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {posts.map(post => (
          <div key={post._id} className="transform transition duration-300 hover:scale-105">
            <Post {...post} />
          </div>
        ))}
      </div>
    </div>
  );
}