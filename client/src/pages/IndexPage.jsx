import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import Post from "../components/Post";
import debounce from 'lodash.debounce';

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    handleSearch();
  }, [searchTerm]);

  const handleSearch = debounce(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts/search?search=${searchTerm}`);
      if (!response.ok) {
        throw new Error("Error searching posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error searching posts:", error);
    }
  }, 300); // Debounce the search function with a delay of 300ms

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`max-w-4xl mx-auto py-8 `}>
      <h1 className="text-4xl font-semibold italic mb-8 text-center hover:scale-95 ease-in-out duration-500">Latest Posts ...</h1>
      <div className="flex justify-center mb-4">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col md:flex-row">
          <div className="flex">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleInputChange}
              className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black mb-2 md:mb-0 md:mr-2"
            />
            <button
              type="submit"
              className={`text-blue-500 dark:text-blue-500 px-1 py-2`}
            >
              <Search size={24} className="md:mx-auto md:my-auto" />
            </button>
          </div>
        </form>
      </div>
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