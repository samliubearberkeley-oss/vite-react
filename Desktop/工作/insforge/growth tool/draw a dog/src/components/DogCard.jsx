import { useState } from 'react';
import { useDogStore } from '../store/useDogStore';
import { useUserStore } from '../store/useUserStore';

/**
 * DogCard - Display a single dog drawing card
 * Used in Rankings and MyDogs pages
 */
export default function DogCard({ dog, index, showRank = false, onShare }) {
  const { likeDog, dislikeDog, userVotes } = useDogStore();
  const { userId } = useUserStore();
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  const userVote = userVotes[dog.id]; // 'like', 'dislike', or undefined
  const hasLiked = userVote === 'like';
  const hasDisliked = userVote === 'dislike';

  const handleLike = async (e) => {
    e.stopPropagation();
    if (isLiking || isDisliking) return;
    
    setIsLiking(true);
    try {
      await likeDog(dog.id, userId);
    } catch (error) {
      console.error('Failed to like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async (e) => {
    e.stopPropagation();
    if (isLiking || isDisliking) return;
    
    setIsDisliking(true);
    try {
      await dislikeDog(dog.id, userId);
    } catch (error) {
      console.error('Failed to dislike:', error);
    } finally {
      setIsDisliking(false);
    }
  };

  const netScore = (dog.likes || 0) - (dog.dislikes || 0);

  return (
    <div className="bg-white rounded-xl p-3 md:p-4 shadow-lg hover:shadow-xl transition-all paper-texture transform hover:-translate-y-1">
      {showRank && (
        <div className="absolute -top-3 -left-3 bg-yellow-400 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-base md:text-lg crayon-text shadow-lg border-3 border-white z-20">
          #{index + 1}
        </div>
      )}
      
      <div className="relative">
        <img
          src={dog.image_url}
          alt={`Dog drawing by user ${dog.user_id?.substring(0, 8)}`}
          className="w-full h-auto rounded-lg border-3 border-gray-300 bg-gray-50"
          loading="lazy"
        />
        
        {/* Score badge */}
        <div className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 shadow-lg">
          <span className="font-bold text-sm md:text-base crayon-text">
            {Math.round(dog.score * 100)}%
          </span>
        </div>
      </div>

      {/* Like/Dislike buttons */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          onClick={handleLike}
          disabled={isLiking || isDisliking}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold crayon-text transition-all text-sm ${
            isLiking 
              ? 'bg-gray-300 cursor-wait' 
              : hasLiked
              ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-300 scale-105'
              : 'bg-green-500 hover:bg-green-600 active:scale-95 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {hasLiked ? '👍✓' : '👍'} <span className="text-xs md:text-sm">{dog.likes || 0}</span>
        </button>

        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
          <span className={`font-bold text-base crayon-text ${netScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netScore >= 0 ? '+' : ''}{netScore}
          </span>
        </div>

        <button
          onClick={handleDislike}
          disabled={isLiking || isDisliking}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold crayon-text transition-all text-sm ${
            isDisliking 
              ? 'bg-gray-300 cursor-wait' 
              : hasDisliked
              ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-300 scale-105'
              : 'bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-md hover:shadow-lg'
          }`}
        >
          {hasDisliked ? '👎✓' : '👎'} <span className="text-xs md:text-sm">{dog.dislikes || 0}</span>
        </button>
      </div>

      {/* Info */}
      <div className="mt-2 text-center">
        <div className="text-xs md:text-sm text-gray-600">
          {new Date(dog.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        {onShare && (
          <button
            onClick={() => onShare(dog)}
            className="mt-1 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 crayon-text"
          >
            📤 Share
          </button>
        )}
      </div>
    </div>
  );
}
