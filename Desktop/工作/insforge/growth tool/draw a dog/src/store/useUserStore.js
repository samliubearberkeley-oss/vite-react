import { create } from 'zustand';
import { registerUser, updateLastSeen } from '../lib/userApi';

/**
 * User Store - Manages user ID (auto-generated UUID stored in localStorage)
 * Ensures uniqueness by registering with backend
 */
export const useUserStore = create((set, get) => ({
  userId: null,
  userStats: null,
  isRegistering: false,
  
  // Generate a unique user ID with backend verification
  generateUniqueUserId: async () => {
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts) {
      try {
        // Generate new UUID
        const newId = crypto.randomUUID();
        
        // Register with backend to ensure uniqueness
        const result = await registerUser(newId);
        
        if (result.success) {
          return newId;
        }
      } catch (error) {
        if (error.message === 'USER_ID_COLLISION') {
          // Collision detected, try again
          attempts++;
          console.warn(`UUID collision detected (attempt ${attempts}/${maxAttempts}), regenerating...`);
          continue;
        }
        // For other errors, fall back to local-only mode
        console.error('Backend registration failed, using local-only mode:', error);
        return crypto.randomUUID();
      }
    }
    
    // If all attempts failed, just use local UUID (extremely unlikely)
    console.error('Failed to generate unique user ID after maximum attempts');
    return crypto.randomUUID();
  },
  
  // Initialize or get existing user ID
  initUserId: async () => {
    const state = get();
    if (state.userId) {
      return state.userId;
    }
    
    if (state.isRegistering) {
      // Wait for current registration to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return get().userId || state.initUserId();
    }
    
    set({ isRegistering: true });
    
    try {
      // Check localStorage first
      const stored = localStorage.getItem('dog_user_id');
      if (stored) {
        // Verify with backend (register if not exists)
        try {
          await registerUser(stored);
          // Update last seen
          updateLastSeen(stored);
        } catch (error) {
          console.error('Error verifying stored user ID:', error);
        }
        
        set({ userId: stored, isRegistering: false });
        return stored;
      }
      
      // Generate new unique ID
      const newId = await state.generateUniqueUserId();
      localStorage.setItem('dog_user_id', newId);
      set({ userId: newId, isRegistering: false });
      return newId;
    } catch (error) {
      console.error('Error initializing user ID:', error);
      // Fallback to local-only UUID
      const fallbackId = crypto.randomUUID();
      localStorage.setItem('dog_user_id', fallbackId);
      set({ userId: fallbackId, isRegistering: false });
      return fallbackId;
    }
  },
  
  // Get current user ID (initialize if needed)
  getUserId: () => {
    const state = get();
    if (state.userId) {
      return state.userId;
    }
    // Return a promise for async initialization
    return state.initUserId();
  },
  
  // Set user stats
  setUserStats: (stats) => {
    set({ userStats: stats });
  },
}));
