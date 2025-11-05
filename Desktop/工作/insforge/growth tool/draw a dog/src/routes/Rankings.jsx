import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogStore } from '../store/useDogStore';
import { useUserStore } from '../store/useUserStore';
import DogCard from '../components/DogCard';

/**
 * Rankings - Shows top cute dogs and most unhinged dogs
 */
export default function Rankings() {
  const { dogs, fetchAllDogs, loading } = useDogStore();
  const { userId } = useUserStore();
  const navigate = useNavigate();
  const [topCute, setTopCute] = useState([]);
  const [unhinged, setUnhinged] = useState([]);

  useEffect(() => {
    fetchAllDogs(userId);
  }, [fetchAllDogs, userId]);

  // Sort dogs into categories
  useEffect(() => {
    // Calculate net score (likes - dislikes) for each dog
    const dogsWithNetScore = dogs.map(dog => ({
      ...dog,
      netScore: (dog.likes || 0) - (dog.dislikes || 0)
    }));

    // Top Cute: Highest net scores (most liked) - Show all dogs
    const cute = [...dogsWithNetScore]
      .filter(d => d.score >= 0.63)
      .sort((a, b) => {
        // Sort by net score first, then by score as tiebreaker
        if (b.netScore !== a.netScore) {
          return b.netScore - a.netScore;
        }
        return b.score - a.score;
      });

    // Unhinged: Most controversial (highest engagement regardless of net score)
    const unh = [...dogsWithNetScore]
      .filter(d => d.score >= 0.63)
      .sort((a, b) => {
        // Sort by total engagement (likes + dislikes), then by controversy
        const aTotal = (a.likes || 0) + (a.dislikes || 0);
        const bTotal = (b.likes || 0) + (b.dislikes || 0);
        if (bTotal !== aTotal) {
          return bTotal - aTotal;
        }
        // If same total, prefer more controversial (closer to 50/50 split)
        const aControversy = Math.abs(a.netScore);
        const bControversy = Math.abs(b.netScore);
        return aControversy - bControversy;
      })
      .slice(0, 10);

    setTopCute(cute);
    setUnhinged(unh);
  }, [dogs]);

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold crayon-text text-white mb-2 drop-shadow-lg">
            🏆 Rankings 🏆
          </h1>
          <p className="text-base md:text-lg text-white drop-shadow">
            See the best (and most creative) dogs! 🐕
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-4">
          {/* Top Cute Section */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold crayon-text text-white mb-4 text-center drop-shadow">
              🌟 Top Cute Dogs 🌟
            </h2>
            {loading ? (
              <div className="text-center text-white text-lg">Loading...</div>
            ) : topCute.length === 0 ? (
              <div className="text-center text-white text-lg">
                No dogs yet! Be the first! 🎨
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
                {topCute.map((dog, index) => (
                  <div key={dog.id || `cute-${index}`} className="relative w-full max-w-[200px]">
                    <DogCard dog={dog} index={index} showRank={true} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unhinged Section */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold crayon-text text-white mb-4 text-center drop-shadow">
              🤪 Most Creative / Unhinged Dogs 🤪
            </h2>
            {loading ? (
              <div className="text-center text-white text-lg">Loading...</div>
            ) : unhinged.length === 0 ? (
              <div className="text-center text-white text-lg">
                No creative dogs yet! Draw something wild! 🎨
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center">
                {unhinged.slice(0, 5).map((dog, index) => (
                  <div key={dog.id || `unhinged-${index}`} className="relative w-full max-w-[200px]">
                    <DogCard dog={dog} index={index} showRank={true} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Fixed at bottom for mobile, normal for desktop */}
        <div className="flex-shrink-0 flex justify-center gap-2 md:gap-3 lg:gap-4 mt-2 md:mt-4 pt-3 md:pt-6 pb-2 md:pb-4 border-t border-white border-opacity-20 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all text-gray-800"
          >
            🎨 Draw a Dog
          </button>
          <button
            onClick={() => navigate('/park')}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all text-gray-800"
          >
            🏞️ Dog Park
          </button>
          <button
            onClick={() => navigate('/mydogs')}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all text-gray-800"
          >
            📁 My Dogs
          </button>
        </div>
      </div>
    </div>
  );
}
