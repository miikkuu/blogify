import React from 'react';

const LikeButton = ({ postId, isLiked, onLike, likeCount }) => {
  const handleLike = () => {
    onLike(postId);
  };

  return (
    <button onClick={handleLike}>
      {isLiked ? 'Unlike' : 'Like'} {likeCount}
    </button>
  );
};

export default LikeButton;