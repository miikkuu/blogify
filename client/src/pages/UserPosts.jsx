import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Post from "../components/Post";
import { UserContext } from "../contexts/UserContext";

export default function UserPosts() {
    const { userInfo } = useContext(UserContext);
    const { id } = useParams();
    const [posts, setPosts] = useState([]);
    const [username, setUsername] = useState(null);
    const [postsExist, setPostsExist] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Add isLoading state

    useEffect(() => {
        setIsLoading(true); // Set isLoading to true before fetching data

        fetch(`${import.meta.env.VITE_API_BACKEND_URL}/posts/user/${id}`)
            .then((response) => response.json())
            .then((postsAndUser) => {
                setPosts(postsAndUser?.postsWithPresignedUrls || []);
                setUsername(postsAndUser?.username || null);
                setPostsExist(postsAndUser?.postsWithPresignedUrls?.length > 0);
                setIsLoading(false); // Set isLoading to false after data is fetched
            })
            .catch((error) => {
                console.error("Error fetching posts:", error);
                setIsLoading(false); // Set isLoading to false if there's an error
            });
    }, [id]);

    const name = username ? username.split(" ")[0] : "";

    return (
        <div className="max-w-4xl mx-auto py-8 items-center">
            <h1 className="text-4xl font-semibold italic mb-8 text-center hover:scale-95 ease-in-out duration-500">
                {isLoading ? "Loading..." : (postsExist ? `${name}'s Posts` : "There is nothing here yet!")}
            </h1>
            {!isLoading && !postsExist && (
                <p className="hover:text-pink-500 text-blue-500  text-2xl mt-20 font-semibold italic mb-8 text-center hover:scale-110 ease-in-out duration-200">
                    <Link to="/create">✍️Create your first post now! </Link>
                </p>
            )}
            {!isLoading && (
                <div className="grid gap-8 md:grid-cols-2">
                    {posts.map((post) => (
                        <div key={post._id} className="transform transition duration-300 hover:scale-105">
                            <Post {...post} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
