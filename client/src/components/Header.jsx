import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import DarkModeToggle from "./DarkModeToggle";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { googleLogout } from "@react-oauth/google";

export default function Header() {
  const { userInfo, setUserInfo } = useContext(UserContext);
  const { username, id } = userInfo || {};

  function logout() {
    fetch(`${import.meta.env.VITE_API_BACKEND_URL}/auth/logout`, {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
    googleLogout();
  }



  return (
    <header className="bg-white  dark:bg-gray-900 shadow-md dark:shadow-2xl">
      <div className="max-w-6xl mx-auto sm:px-5  py-5 flex justify-between items-center">
        <div className="flex ml-2 mb-2 sm:-mb-1 sm:text-nowrap justify-between gap-2 ">
          <Link
            to="/"
            className="text-gray-900 mx-1  text-[25px] sm:text-[30px] sm:text-nowrap border-[1px] dark:text-white text-3xl hover:text-gray-900 dark:hover:text-gray-200 rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 shadow-md"
          >
            Blogify
          </Link>
          {username && (
            <Link
              to={`/posts/user/${id}`}
              className="lg:mr-[500px] px-2  md:text-nowrap   p-1  mt-3 sm:mt-2 border-[1px] text-sm sm:text-base sm:p-2  text-center text-base text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 shadow-md"
            >
              {`${username.split(" ")[0]}'s`} Posts
            </Link>
          )}
        </div>
        <nav className="flex sm:text-nowrap    mx-2 sm:mx-2 gap-2 justify-center items-center">
          <div className="-mr-2 sm:-mr-3 mt-1 sm:mt-0">
            <DarkModeToggle />
          </div>
          {userInfo ? (
            <>
              <Link
                to="/create"
                className=" p-1 px-2 mt-1 sm:mt-0 border-[1px] text-sm sm:text-base sm:p-2  text-center text-base text-gray-900 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 shadow-md"
              >
                Create Post
              </Link>
              <button
                onClick={logout}
                className="text-gray-900 px-2 mt-1  sm:mt-0 text-sm sm:text-base border-[1px]  sm:p-2 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl  p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 shadow-md"
              >
                Logout ({username?.split(" ")[0] || ""})
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className=" text-gray-800 border-[1px] mt-1 sm:mt-0 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 shadow-md"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-gray-900 border-[1px] mt-1 sm:mt-0 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white rounded-xl px-2 p-1 font-medium transition-transform duration-500 ease-in-out transform hover:scale-110 shadow-md"
              >
                Register
              </Link>
              <div className="mt-1 sm:mt-0">
                <GoogleLoginButton type="icon" shape="pill" width="40px" text="signin" />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
