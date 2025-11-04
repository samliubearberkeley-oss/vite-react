import { useState } from 'react';
import { useUserStore } from '../store/useUserStore';

/**
 * UserInfo - Shows user's ID (simplified) in top-right corner
 */
export default function UserInfo() {
  const { userId } = useUserStore();
  const [copied, setCopied] = useState(false);

  if (!userId) return null;

  // Show first 8 chars of UUID for readability
  const shortId = userId.slice(0, 8);

  const handleCopy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="bg-white bg-opacity-95 px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm cursor-pointer hover:bg-opacity-100 transition-all group"
        onClick={handleCopy}
        title="Click to copy full ID"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">👤</span>
          <div className="text-sm">
            <div className="font-bold text-gray-800 crayon-text">You</div>
            <div className="text-xs text-gray-600 font-mono">
              ID: {shortId}...
            </div>
          </div>
          <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
            {copied ? '✓' : '📋'}
          </span>
        </div>
        {copied && (
          <div className="absolute -bottom-8 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in">
            Copied! ✓
          </div>
        )}
      </div>
    </div>
  );
}

