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
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '140px' }}>
        <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
          {/* Header - Adjusted spacing to avoid overlap with UserInfo */}
          <div className="text-center mb-2 md:mb-4 lg:mb-5 pt-2 md:pt-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold crayon-text text-white mb-1 md:mb-2 drop-shadow-lg whitespace-nowrap">
              🐶 Draw a Dog! 🐶
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-white drop-shadow whitespace-nowrap">
              Draw, score, and make it run! 🏃
            </p>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-3 md:gap-6 lg:gap-8">
            {/* Canvas - Larger on desktop */}
            <div className="w-full lg:flex-[5] flex items-center justify-center">
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
        </div>
      </div>

      {/* Fixed Bottom Section - Always visible at bottom of screen */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#98D8C8] via-[#98D8C8] to-transparent pt-3 pb-2 space-y-2 z-30" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {/* Action Button - Fixed, always visible */}
        <div className="text-center px-4">
          <button
            onClick={handleMakeItRun}
            disabled={score < 0.63 || isUploading}
            className={`
              w-full max-w-md mx-auto px-4 py-2.5 text-base font-bold rounded-xl crayon-text shadow-xl
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

        {/* Navigation Links - Fixed at bottom */}
        <div className="flex justify-center gap-2 px-4">
          <button
            onClick={() => navigate('/park')}
            className="px-3 py-2 text-sm bg-white bg-opacity-95 rounded-lg hover:bg-opacity-100 crayon-text font-bold transition-all shadow-md text-gray-800 flex-1"
          >
            🏞️ Dog Park
          </button>
          <button
            onClick={() => navigate('/rankings')}
            className="px-3 py-2 text-sm bg-white bg-opacity-95 rounded-lg hover:bg-opacity-100 crayon-text font-bold transition-all shadow-md text-gray-800 flex-1"
          >
            🏆 Rankings
          </button>
          <button
            onClick={() => navigate('/mydogs')}
            className="px-3 py-2 text-sm bg-white bg-opacity-95 rounded-lg hover:bg-opacity-100 crayon-text font-bold transition-all shadow-md text-gray-800 flex-1"
          >
            📁 My Dogs
          </button>
        </div>
      </div>
    </div>
  );
}
