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
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl my-5 h-auto md:h-[350px]">
      <div className="flex flex-col justify-between h-full">
        <div className="flex-shrink-0">
          <Link to={`/post/${_id}`}>
            <img 
              className="w-full object-cover h-48 md:h-[200px]" 
              src={cover} 
              alt={title}
              onError={handleImageError}
            />
          </Link>
        </div>
        <div className="p-6">
          <Link to={`/post/${_id}`} className="block text-lg leading-tight font-medium text-black hover:underline">{title}</Link>
          <Link to={`/post/${_id}`} className="mt-2 text-gray-500">{summary}</Link>
        </div>
        <div className="px-6  -my-2 pb-14">
          <div className="text-sm font-semibold text-indigo-600">{author.username}</div>
          <div className="text-sm text-gray-500">{formattedDate}</div>
        </div>
      </div>
    </div>
  );
}