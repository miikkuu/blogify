import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  const { userInfo, setUserInfo } = useContext(UserContext);

  function logout() {
    fetch(`${import.meta.env.VITE_API_BACKEND_URL}/auth/logout`, {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-2xl    ">
      <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
        <Link
          to="/"
          className="text-gray-900 dark:text-white  text-3xl hover:text-gray-900 dark:hover:text-gray-200 rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 hover:shadow-md"
        >
          Blogify
        </Link>
        <nav className="flex items-center">
          <DarkModeToggle />
          {userInfo ? (
            <>
              <Link
                to="/create"
                className="mr-2 pb-2 text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 hover:shadow-md"
              >
                Create new post
              </Link>
              <button
                onClick={logout}
                className=" text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 hover:shadow-md"
              >
                Logout ({userInfo.username || "User"})
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="mr-4  text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 hover:shadow-md"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 hover:shadow-md"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
