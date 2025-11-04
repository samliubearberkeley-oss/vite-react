/**
 * ScoreBar - Visual indicator showing dog-likeness score
 */
export default function ScoreBar({ score }) {
  const percentage = Math.round(score * 100);
  const isQualified = score >= 0.63;
  const canMakeRun = isQualified;

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl paper-texture w-full">
      <div className="text-center mb-4">
        <h3 className="text-xl md:text-2xl font-bold crayon-text text-gray-800 mb-2">
          🐾 Dog-likeness Score
        </h3>
        <div className="text-5xl md:text-6xl font-bold" style={{
          color: isQualified ? '#10b981' : '#f59e0b'
        }}>
          {percentage}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-8 md:h-10 overflow-hidden shadow-inner">
        <div
          className="h-full transition-all duration-500 ease-out flex items-center justify-center"
          style={{
            width: `${percentage}%`,
            background: isQualified
              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
              : 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
          }}
        >
          {percentage >= 15 && (
            <span className="text-white font-bold text-sm md:text-base">
              {percentage}%
            </span>
          )}
        </div>
      </div>

      {/* Status message */}
      <div className="mt-4 text-center">
        {canMakeRun ? (
          <p className="text-base md:text-lg font-bold text-green-600 crayon-text animate-bounce">
            ✨ Amazing! Click "Make it Run!" below! ✨
          </p>
        ) : (
          <p className="text-sm md:text-base text-gray-600">
            Keep drawing! You need at least 63% to make it run 🎨
          </p>
        )}
      </div>
    </div>
  );
}
