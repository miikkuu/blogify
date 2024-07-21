import React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export default function Post({ _id, title, summary, cover, createdAt, author }) {
  // Format the date to "21 July 2023 15:30" style
  const formattedDate = format(new Date(createdAt), 'd MMMM yyyy HH:mm');
  // Function to handle image loading errors
  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Available'; // Placeholder image
  };

  return (
<div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden md:max-w-2xl my-5 h-[360px] md:h-[355px]">
<div className="flex flex-col justify-between h-full">
        <div className="flex-shrink-0 ">
          <Link to={`/post/${_id}`}>
            <img 
              className="w-full object-cover h-48 md:h-[200px]" 
              src={cover } 
              alt={title}
              onError={handleImageError}
            />
          </Link>
        </div>
        <div className="p-6  fixed mt-[185px] sm:mt-[195px] mb-10">
        <Link to={`/post/${_id}`} className="block text-lg leading-tight font-medium text-black dark:text-white hover:underline">{title}</Link>
        <Link to={`/post/${_id}`} className="mt-2 text-gray-500 dark:text-gray-400">{summary}</Link>
        </div>
        <div className="px-6 mt-[310px] sm:mt-[295px] fixed  -my-2 sm:pb-14 pb-10 ">
       <div className=" ">
       <div className="text-sm font-semibold  text-indigo-600 dark:text-indigo-400">
        {author.username.split(" ").length === 3 ? author.username.split(" ").slice(0, 2).join(" ") : author.username}
        </div>
       <div className="text-sm mr-10  text-gray-500 dark:text-gray-400">{formattedDate}</div>
       </div>
        </div>
      </div>
    </div>
  );
}