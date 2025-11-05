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
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6 lg:p-8" style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}>
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header - Adjusted spacing to avoid overlap with UserInfo */}
        <div className="text-center mb-3 md:mb-4 lg:mb-5 flex-shrink-0 pt-2 md:pt-0">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold crayon-text text-white mb-1 md:mb-2 drop-shadow-lg whitespace-nowrap">
            🐶 Draw a Dog! 🐶
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-white drop-shadow whitespace-nowrap">
            Draw, score, and make it run! 🏃
          </p>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 flex-1 min-h-0 overflow-y-auto">
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

        {/* Fixed Bottom Section - Always visible on mobile */}
        <div className="flex-shrink-0 mt-3 md:mt-3 lg:mt-4 space-y-2 md:space-y-2">
          {/* Action Button - Optimized for mobile */}
          <div className="text-center px-2">
            <button
              onClick={handleMakeItRun}
              disabled={score < 0.63 || isUploading}
              className={`
                w-full max-w-xs md:max-w-none px-4 py-3 md:px-3 md:py-1.5 text-base md:text-base font-bold rounded-xl md:rounded-lg crayon-text shadow-xl
                transition-all transform duration-300
                ${score >= 0.63 && !isUploading
                  ? 'bg-green-500 hover:bg-green-600 text-white hover:scale-105 active:scale-95 shadow-green-300 animate-pulse'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                }
              `}
            >
              {isUploading ? (
                <span className="flex items-center justify-center gap-2">
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

          {/* Navigation Links - Optimized for mobile */}
          <div className="flex justify-center gap-2 md:gap-3 text-white flex-wrap px-2 pb-2 md:pb-1" style={{ paddingBottom: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-bottom) * 0.5))' }}>
            <button
              onClick={() => navigate('/park')}
              className="px-3 py-1.5 md:px-2 md:py-1 text-sm md:text-xs bg-white bg-opacity-90 md:bg-opacity-25 rounded-lg hover:bg-opacity-100 md:hover:bg-opacity-35 crayon-text font-bold transition-all shadow-md hover:shadow-lg text-gray-800 md:text-white"
            >
              🏞️ Dog Park
            </button>
            <button
              onClick={() => navigate('/rankings')}
              className="px-3 py-1.5 md:px-2 md:py-1 text-sm md:text-xs bg-white bg-opacity-90 md:bg-opacity-25 rounded-lg hover:bg-opacity-100 md:hover:bg-opacity-35 crayon-text font-bold transition-all shadow-md hover:shadow-lg text-gray-800 md:text-white"
            >
              🏆 Rankings
            </button>
            <button
              onClick={() => navigate('/mydogs')}
              className="px-3 py-1.5 md:px-2 md:py-1 text-sm md:text-xs bg-white bg-opacity-90 md:bg-opacity-25 rounded-lg hover:bg-opacity-100 md:hover:bg-opacity-35 crayon-text font-bold transition-all shadow-md hover:shadow-lg text-gray-800 md:text-white"
            >
              📁 My Dogs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
