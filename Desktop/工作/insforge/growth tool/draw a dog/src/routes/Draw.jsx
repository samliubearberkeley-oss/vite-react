import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CanvasBoard from '../components/CanvasBoard';
import ScoreBar from '../components/ScoreBar';
import { useUserStore } from '../store/useUserStore';
import { uploadDog } from '../lib/uploadDog';
import { useDogStore } from '../store/useDogStore';

/**
 * Draw Page - Main drawing interface
 */
export default function Draw() {
  const [score, setScore] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const canvasBoardRef = useRef(null);
  const navigate = useNavigate();
  const { getUserId } = useUserStore();
  const { addDog } = useDogStore();

  // Initialize user ID on mount
  useEffect(() => {
    getUserId();
  }, [getUserId]);

  const handleScoreChange = (newScore) => {
    setScore(newScore);
  };

  const handleMakeItRun = async () => {
    if (score < 0.63) {
      alert('Your dog needs at least 63% dog-likeness to run! Keep drawing! 🎨');
      return;
    }

    setIsUploading(true);

    try {
      // Get canvas blob using ref
      if (!canvasBoardRef.current) {
        throw new Error('Canvas not ready');
      }

      const blob = await canvasBoardRef.current.exportCanvas();

      if (!blob) {
        throw new Error('Failed to export canvas');
      }

      // Get user ID
      const userId = getUserId();

      // Upload to Insforge
      const result = await uploadDog(blob, score, userId);

      // Add to store (optimistic update)
      addDog({
        id: result.id,
        image_url: result.imageUrl,
        score: score,
        user_id: userId,
        likes: 0,
        dislikes: 0,
        created_at: new Date().toISOString(),
      });

      // Navigate to Dog Park - data will be refreshed there
      navigate('/park');
    } catch (error) {
      console.error('Error uploading dog:', error);
      alert(`Oops! Something went wrong: ${error.message}\n\nPlease try again! 🎨`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden p-6 md:p-8">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-5 flex-shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold crayon-text text-white mb-2 drop-shadow-lg whitespace-nowrap">
            🐶 Draw a Dog! 🐶
          </h1>
          <p className="text-base md:text-lg text-white drop-shadow whitespace-nowrap">
            Draw, score, and make it run! 🏃
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 flex-1 min-h-0">
          {/* Canvas - Larger on desktop */}
          <div className="w-full lg:flex-[5] flex items-center justify-center min-h-0">
            <div className="w-full max-w-xl lg:max-w-2xl">
              <CanvasBoard ref={canvasBoardRef} onScoreChange={handleScoreChange} />
            </div>
          </div>

          {/* Score Bar - On top for mobile, sidebar for desktop */}
          <div className="w-full lg:flex-[3] flex items-center justify-center lg:items-start">
            <div className="w-full max-w-md">
              <ScoreBar score={score} />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center flex-shrink-0 mt-3 md:mt-4 mb-2">
          <button
            onClick={handleMakeItRun}
            disabled={score < 0.63 || isUploading}
            className={`
              px-2.5 py-1 md:px-3 md:py-1.5 text-sm md:text-base font-bold rounded-lg crayon-text shadow-xl
              transition-all transform duration-300
              ${score >= 0.63 && !isUploading
                ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105 active:scale-95 shadow-green-300 animate-pulse'
                : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
              }
            `}
          >
            {isUploading ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin">⏳</span>
                Uploading...
              </span>
            ) : score >= 0.63 ? (
              <>🏃 Make it Run! 🏃</>
            ) : (
              <>✏️ Keep Drawing! (Need 63%)</>
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="mt-2 mb-1 flex justify-center gap-2 md:gap-2.5 text-white flex-shrink-0">
          <button
            onClick={() => navigate('/park')}
            className="px-1.5 py-0.5 md:px-2 md:py-1 text-xs md:text-xs bg-white bg-opacity-25 rounded-lg hover:bg-opacity-35 crayon-text font-bold transition-all shadow-md hover:shadow-lg min-w-[49px]"
          >
            🏞️ Dog Park
          </button>
          <button
            onClick={() => navigate('/rankings')}
            className="px-1.5 py-0.5 md:px-2 md:py-1 text-xs md:text-xs bg-white bg-opacity-25 rounded-lg hover:bg-opacity-35 crayon-text font-bold transition-all shadow-md hover:shadow-lg min-w-[49px]"
          >
            🏆 Rankings
          </button>
          <button
            onClick={() => navigate('/mydogs')}
            className="px-1.5 py-0.5 md:px-2 md:py-1 text-xs md:text-xs bg-white bg-opacity-25 rounded-lg hover:bg-opacity-35 crayon-text font-bold transition-all shadow-md hover:shadow-lg min-w-[49px]"
          >
            📁 My Dogs
          </button>
        </div>
      </div>
    </div>
  );
}
