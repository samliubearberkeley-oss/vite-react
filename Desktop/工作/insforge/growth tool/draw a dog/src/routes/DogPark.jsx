import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDogStore } from '../store/useDogStore';
import { useUserStore } from '../store/useUserStore';

/**
 * DogPark - Animated park where all dogs run around
 * Dogs move randomly around the screen
 */
export default function DogPark() {
  const { dogs, fetchAllDogs, loading } = useDogStore();
  const { userId } = useUserStore();
  const navigate = useNavigate();
  const [animatedDogs, setAnimatedDogs] = useState([]);
  const animationRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('[DogPark] useEffect triggered, userId:', userId);
    fetchAllDogs(userId).then((fetchedDogs) => {
      console.log('[DogPark] fetchAllDogs completed, got dogs:', fetchedDogs);
    });
  }, [fetchAllDogs, userId]);

  // Initialize dog positions and animations
  useEffect(() => {
    console.log('[DogPark] dogs changed, length:', dogs.length);
    if (dogs.length > 0) {
      console.log('[DogPark] First dog:', JSON.stringify(dogs[0], null, 2));
      console.log('[DogPark] First dog keys:', Object.keys(dogs[0]));
      console.log('[DogPark] First dog has id?', 'id' in dogs[0], 'id value:', dogs[0].id);
      console.log('[DogPark] First dog has image_url?', 'image_url' in dogs[0], 'image_url value:', dogs[0].image_url);
    }
    
    if (dogs.length === 0) {
      console.log('[DogPark] No dogs, clearing animatedDogs');
      setAnimatedDogs([]);
      return;
    }

    const container = containerRef.current;
    if (!container) {
      console.log('[DogPark] Container not ready yet');
      return;
    }

    console.log('[DogPark] Initializing animations for', dogs.length, 'dogs');
    // Initialize random positions and velocities - only if we have valid dogs
    const validDogs = dogs.filter(dog => dog && dog !== null && dog !== undefined && (dog.id || dog.image_url));
    console.log('[DogPark] Valid dogs:', validDogs.length, 'out of', dogs.length);
    
    if (validDogs.length === 0) {
      console.log('[DogPark] No valid dogs found, clearing animatedDogs');
      setAnimatedDogs([]);
      return;
    }

    const initialized = validDogs.map(() => ({
      x: Math.random() * (container.clientWidth - 120),
      y: Math.random() * (container.clientHeight - 120),
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
    }));

    console.log('[DogPark] Setting animatedDogs for', initialized.length, 'dogs');
    setAnimatedDogs(initialized);
  }, [dogs]);

  // Animation loop
  useEffect(() => {
    if (animatedDogs.length === 0) return;

    const animate = () => {
      setAnimatedDogs((prev) => {
        const container = containerRef.current;
        if (!container) return prev;

        return prev.map((dog, index) => {
          let { x, y, vx, vy, rotation } = dog;
          const dogSize = 120;

          // Update position
          x += vx;
          y += vy;

          // Bounce off walls
          if (x <= 0 || x >= container.clientWidth - dogSize) {
            vx = -vx;
            vx += (Math.random() - 0.5) * 0.5; // Add slight randomness
            x = Math.max(0, Math.min(container.clientWidth - dogSize, x));
          }
          if (y <= 0 || y >= container.clientHeight - dogSize) {
            vy = -vy;
            vy += (Math.random() - 0.5) * 0.5;
            y = Math.max(0, Math.min(container.clientHeight - dogSize, y));
          }

          // Update rotation based on movement direction
          rotation = Math.atan2(vy, vx) * (180 / Math.PI);

          // Occasionally change direction (wander behavior)
          if (Math.random() < 0.02) {
            vx = (Math.random() - 0.5) * 3;
            vy = (Math.random() - 0.5) * 3;
          }

          return { x, y, vx, vy, rotation };
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animatedDogs.length]);

  return (
    <div className="h-screen flex flex-col overflow-hidden p-4">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="text-center mb-4 flex-shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold crayon-text text-white mb-2 drop-shadow-lg">
            🌳 Dog Park 🌳
          </h1>
          <p className="text-base md:text-lg text-white drop-shadow">
            Watch all the dogs run around! {dogs.length} dog{dogs.length !== 1 ? 's' : ''} playing
          </p>
        </div>

        {/* Park Canvas */}
        <div className="relative bg-gradient-to-b from-sky-blue via-grass-green to-grass-green rounded-3xl shadow-2xl overflow-hidden border-8 border-gray-800 hand-drawn-border flex-1 min-h-0">
          <div
            ref={containerRef}
            className="relative w-full h-full chalkboard-bg"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(255,255,255,0.03) 2px,
                  rgba(255,255,255,0.03) 4px
                )
              `,
            }}
          >
            {/* Animated Dogs */}
            {dogs
              .filter(dog => {
                const isValid = dog && dog !== null && dog !== undefined && (dog.id || dog.image_url);
                if (!isValid && dog) {
                  console.log('[DogPark] Invalid dog object:', dog, 'keys:', Object.keys(dog));
                }
                return isValid;
              })
              .map((dog, index) => {
                const anim = animatedDogs[index];
                if (!anim) {
                  console.log(`[DogPark] No animation for dog ${index}:`, dog);
                  return null;
                }

                if (!dog.image_url) {
                  console.log(`[DogPark] Dog ${index} missing image_url:`, dog);
                  return null;
                }

                return (
                  <div
                    key={dog.id || `dog-${index}-${dog.image_url?.substring(0, 20)}`}
                    className="absolute transition-none"
                    style={{
                      left: `${anim.x}px`,
                      top: `${anim.y}px`,
                      transform: `rotate(${anim.rotation}deg)`,
                      width: '120px',
                      height: '120px',
                    }}
                  >
                    <div className="relative w-full h-full animate-float">
                      <img
                        src={dog.image_url}
                        alt="Running dog"
                        className="w-full h-full object-contain filter drop-shadow-lg"
                        style={{
                          transform: `scaleX(${anim.vx < 0 ? -1 : 1})`,
                        }}
                        onError={(e) => {
                          console.error(`[DogPark] Image load error:`, dog);
                        }}
                      />
                    </div>
                  </div>
                );
              })}

            {/* Empty State */}
            {!loading && dogs.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white crayon-text">
                  <p className="text-4xl mb-4">🐕</p>
                  <p className="text-2xl font-bold">No dogs in the park yet!</p>
                  <p className="text-lg mt-2">Draw the first dog to start the party! 🎉</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-3 bg-white text-green-600 rounded-xl font-bold crayon-text hover:bg-gray-100"
                  >
                    Draw a Dog 🎨
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Optimized for mobile */}
        <div className="mt-4 flex justify-center gap-2 md:gap-3 lg:gap-4 flex-shrink-0 flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all text-gray-800"
          >
            🎨 Draw a Dog
          </button>
          <button
            onClick={() => navigate('/rankings')}
            className="px-4 py-2 md:px-5 md:py-2.5 bg-white bg-opacity-90 rounded-xl hover:bg-opacity-100 crayon-text font-bold shadow-lg text-sm md:text-base transition-all text-gray-800"
          >
            🏆 Rankings
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
