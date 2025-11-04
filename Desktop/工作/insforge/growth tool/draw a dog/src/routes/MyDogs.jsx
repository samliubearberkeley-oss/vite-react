import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useDogStore } from '../store/useDogStore';
import DogCard from '../components/DogCard';

/**
 * MyDogs - Shows all dogs drawn by the current user
 */
export default function MyDogs() {
  const { getUserId } = useUserStore();
  const { fetchUserDogs, loading } = useDogStore();
  const navigate = useNavigate();
  const [myDogs, setMyDogs] = useState([]);

  useEffect(() => {
    const loadMyDogs = async () => {
      const userId = getUserId();
      const dogs = await fetchUserDogs(userId);
      setMyDogs(dogs);
    };
    loadMyDogs();
  }, [getUserId, fetchUserDogs]);

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4 md:p-6">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold crayon-text text-white mb-2 drop-shadow-lg">
            📁 My Dogs 📁
          </h1>
          <p className="text-base md:text-lg text-white drop-shadow">
            Your collection: {myDogs.length} dog{myDogs.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="text-center text-white text-lg">Loading your dogs...</div>
          ) : myDogs.length === 0 ? (
            <div className="text-center text-white h-full flex flex-col items-center justify-center min-h-[400px]">
              <p className="text-4xl mb-4">🐕</p>
              <p className="text-2xl font-bold crayon-text mb-4">
                You haven't drawn any dogs yet!
              </p>
              <p className="text-lg mb-6">Let's start your collection! 🎨</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-white text-green-600 rounded-xl font-bold crayon-text text-lg hover:bg-gray-100 shadow-xl transition-all"
              >
                Draw Your First Dog 🐶
              </button>
            </div>
          ) : (
            <>
              {/* Dogs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 justify-items-center mb-8">
                {myDogs.map((dog, index) => (
                  <div key={dog.id || `mydog-${index}`} className="relative w-full max-w-[200px]">
                    <DogCard dog={dog} />
                  </div>
                ))}
              </div>

              {/* Navigation - Inside scrollable area */}
              <div className="flex justify-center gap-3 md:gap-4 mt-8 pt-6 pb-4 border-t border-white border-opacity-20">
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all"
                >
                  🎨 Draw a Dog
                </button>
                <button
                  onClick={() => navigate('/park')}
                  className="px-5 py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all"
                >
                  🏞️ Dog Park
                </button>
                <button
                  onClick={() => navigate('/rankings')}
                  className="px-5 py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all"
                >
                  🏆 Rankings
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
