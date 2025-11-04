import { create } from 'zustand';
import { fetchAllDogs, fetchDogsByUser, likeDog, dislikeDog, getUserVote } from '../lib/uploadDog';

/**
 * Dog Store - Manages all dog drawings state
 */
export const useDogStore = create((set, get) => ({
  dogs: [],
  loading: false,
  error: null,
  userVotes: {}, // Map of dogId -> 'like' | 'dislike' | null
  
  // Fetch all dogs (for Dog Park and Rankings)
  fetchAllDogs: async (userId = null) => {
    console.log('[useDogStore] fetchAllDogs called with userId:', userId);
    set({ loading: true, error: null });
    try {
      const dogs = await fetchAllDogs();
      console.log('[useDogStore] fetchAllDogs returned:', dogs.length, 'dogs');
      
      // Load user votes if userId provided
      if (userId) {
        const votes = {};
        for (const dog of dogs) {
          const vote = await getUserVote(userId, dog.id);
          if (vote) {
            votes[dog.id] = vote;
          }
        }
        console.log('[useDogStore] Setting dogs with votes:', dogs.length);
        set({ dogs, loading: false, userVotes: votes });
      } else {
        console.log('[useDogStore] Setting dogs without votes:', dogs.length);
        set({ dogs, loading: false });
      }
      
      return dogs;
    } catch (error) {
      console.error('[useDogStore] Error in fetchAllDogs:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Fetch user's dogs
  fetchUserDogs: async (userId) => {
    set({ loading: true, error: null });
    try {
      const dogs = await fetchDogsByUser(userId);
      set({ loading: false });
      return dogs;
    } catch (error) {
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Add a new dog to the store (optimistic update)
  addDog: (dog) => {
    console.log('[useDogStore] addDog called with:', dog);
    set((state) => {
      const newDogs = [dog, ...state.dogs];
      console.log('[useDogStore] Updated dogs array, new length:', newDogs.length);
      return { dogs: newDogs };
    });
  },
  
  // Like a dog
  likeDog: async (dogId, userId) => {
    try {
      const updatedDog = await likeDog(dogId, userId);
      
      // Update the dog in the store
      set((state) => ({
        dogs: state.dogs.map((dog) =>
          dog.id === dogId ? { ...dog, likes: updatedDog.likes, dislikes: updatedDog.dislikes } : dog
        ),
        userVotes: {
          ...state.userVotes,
          [dogId]: updatedDog.userVote
        }
      }));
      
      return updatedDog;
    } catch (error) {
      console.error('Error liking dog:', error);
      throw error;
    }
  },
  
  // Dislike a dog
  dislikeDog: async (dogId, userId) => {
    try {
      const updatedDog = await dislikeDog(dogId, userId);
      
      // Update the dog in the store
      set((state) => ({
        dogs: state.dogs.map((dog) =>
          dog.id === dogId ? { ...dog, likes: updatedDog.likes, dislikes: updatedDog.dislikes } : dog
        ),
        userVotes: {
          ...state.userVotes,
          [dogId]: updatedDog.userVote
        }
      }));
      
      return updatedDog;
    } catch (error) {
      console.error('Error disliking dog:', error);
      throw error;
    }
  },
  
  // Clear dogs
  clearDogs: () => {
    set({ dogs: [] });
  },
}));
