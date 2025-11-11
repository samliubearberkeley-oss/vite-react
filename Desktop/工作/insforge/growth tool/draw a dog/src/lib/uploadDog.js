import { insforge } from './insforgeClient';
import { INSFORGE_CONFIG } from './config';

/**
 * Upload a dog drawing to Insforge
 * @param {File|Blob} imageBlob - The image file/blob to upload
 * @param {number} score - The dog-likeness score (0-1)
 * @param {string} userId - The user ID who drew it
 * @returns {Promise<{id: string, imageUrl: string}>}
 */
export async function uploadDog(imageBlob, score, userId) {
  try {
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `dog_${userId}_${timestamp}.png`;
    
    // Upload image to Insforge Storage - SDK might work for storage
    const { data: uploadData, error: uploadError } = await insforge.storage
      .from('dog-images')
      .upload(filename, imageBlob);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message || uploadError}`);
    }

    // Insforge SDK returns { url, key } in data
    const imageUrl = uploadData?.url || uploadData || '';

    if (!imageUrl) {
      throw new Error('No image URL returned from upload');
    }

    // Save metadata to database with direct fetch
    console.log('[uploadDog] Inserting dog to database:', { user_id: userId, image_url: imageUrl, score });
    
    const insertResponse = await fetch(`${baseUrl}/api/database/records/dogs`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: userId,
        image_url: imageUrl,
        score: score,
        created_at: new Date().toISOString(),
        likes: 0,
        dislikes: 0
      })
    });

    console.log('[uploadDog] Database insert status:', insertResponse.status);

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      throw new Error(`Database save failed: ${errorText}`);
    }

    const dbData = await insertResponse.json();
    const savedDog = Array.isArray(dbData) ? dbData[0] : dbData;
    
    console.log('[uploadDog] Successfully saved dog with id:', savedDog.id);
    return {
      id: savedDog.id,
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error('Error uploading dog:', error);
    throw error;
  }
}

/**
 * Fetch all dogs from the database
 * @returns {Promise<Array>}
 */
export async function fetchAllDogs() {
  try {
    console.log('[fetchAllDogs] Starting fetch...');
    
    // Direct fetch with apikey header to bypass SDK JWT issue
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    const response = await fetch(`${baseUrl}/api/database/records/dogs?select=*&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      }
    });

    console.log('[fetchAllDogs] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[fetchAllDogs] Error response:', errorText);
      return [];
    }

    const data = await response.json();
    console.log('[fetchAllDogs] Raw data:', data, 'type:', typeof data);

    // Ensure we return an array
    const dogs = Array.isArray(data) ? data : (data ? [data] : []);
    console.log('[fetchAllDogs] Returning', dogs.length, 'dogs');
    return dogs;
  } catch (error) {
    console.error('[fetchAllDogs] Exception:', error);
    return [];
  }
}

/**
 * Fetch dogs by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<Array>}
 */
export async function fetchDogsByUser(userId) {
  try {
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    const response = await fetch(`${baseUrl}/api/database/records/dogs?select=*&user_id=eq.${userId}&order=created_at.desc`, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return [];
    }

    return await response.json() || [];
  } catch (error) {
    console.error('Error fetching user dogs:', error);
    return [];
  }
}

/**
 * Get user's vote for a dog
 * @param {string} userId - The user ID
 * @param {string} dogId - The dog ID
 * @returns {Promise<string|null>} 'like', 'dislike', or null
 */
export async function getUserVote(userId, dogId) {
  try {
    const voteKey = `vote_${userId}_${dogId}`;
    return localStorage.getItem(voteKey);
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}

/**
 * Set user's vote for a dog
 * @param {string} userId - The user ID
 * @param {string} dogId - The dog ID
 * @param {string|null} voteType - 'like', 'dislike', or null to remove
 */
function setUserVote(userId, dogId, voteType) {
  const voteKey = `vote_${userId}_${dogId}`;
  if (voteType === null) {
    localStorage.removeItem(voteKey);
  } else {
    localStorage.setItem(voteKey, voteType);
  }
}

/**
 * Toggle like on a dog drawing
 * @param {string} dogId - The dog ID to like
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Updated dog object with vote status
 */
export async function likeDog(dogId, userId) {
  try {
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    // Check current vote
    const currentVote = await getUserVote(userId, dogId);

    // First fetch current dog to get current counts
    const fetchResponse = await fetch(`${baseUrl}/api/database/records/dogs?select=*&id=eq.${dogId}`, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!fetchResponse.ok) {
      throw new Error('Dog not found');
    }

    const dogs = await fetchResponse.json();
    if (!dogs || dogs.length === 0) {
      throw new Error('Dog not found');
    }

    const currentDog = dogs[0];
    let newLikes = currentDog.likes || 0;
    let newDislikes = currentDog.dislikes || 0;
    let newVoteStatus = null;

    if (currentVote === 'like') {
      // Cancel like
      newLikes = Math.max(0, newLikes - 1);
      newVoteStatus = null;
    } else if (currentVote === 'dislike') {
      // Switch from dislike to like
      newDislikes = Math.max(0, newDislikes - 1);
      newLikes = newLikes + 1;
      newVoteStatus = 'like';
    } else {
      // New like
      newLikes = newLikes + 1;
      newVoteStatus = 'like';
    }

    // Update the dog
    await fetch(`${baseUrl}/api/database/records/dogs?id=eq.${dogId}`, {
      method: 'PATCH',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ likes: newLikes, dislikes: newDislikes })
    });

    // Save user vote
    setUserVote(userId, dogId, newVoteStatus);

    return { 
      ...currentDog, 
      likes: newLikes, 
      dislikes: newDislikes,
      userVote: newVoteStatus 
    };
  } catch (error) {
    console.error('Error liking dog:', error);
    throw error;
  }
}

/**
 * Toggle dislike on a dog drawing
 * @param {string} dogId - The dog ID to dislike
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Updated dog object with vote status
 */
export async function dislikeDog(dogId, userId) {
  try {
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    // Check current vote
    const currentVote = await getUserVote(userId, dogId);

    // First fetch current dog to get current counts
    const fetchResponse = await fetch(`${baseUrl}/api/database/records/dogs?select=*&id=eq.${dogId}`, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!fetchResponse.ok) {
      throw new Error('Dog not found');
    }

    const dogs = await fetchResponse.json();
    if (!dogs || dogs.length === 0) {
      throw new Error('Dog not found');
    }

    const currentDog = dogs[0];
    let newLikes = currentDog.likes || 0;
    let newDislikes = currentDog.dislikes || 0;
    let newVoteStatus = null;

    if (currentVote === 'dislike') {
      // Cancel dislike
      newDislikes = Math.max(0, newDislikes - 1);
      newVoteStatus = null;
    } else if (currentVote === 'like') {
      // Switch from like to dislike
      newLikes = Math.max(0, newLikes - 1);
      newDislikes = newDislikes + 1;
      newVoteStatus = 'dislike';
    } else {
      // New dislike
      newDislikes = newDislikes + 1;
      newVoteStatus = 'dislike';
    }

    // Update the dog
    await fetch(`${baseUrl}/api/database/records/dogs?id=eq.${dogId}`, {
      method: 'PATCH',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ likes: newLikes, dislikes: newDislikes })
    });

    // Save user vote
    setUserVote(userId, dogId, newVoteStatus);

    return { 
      ...currentDog, 
      likes: newLikes, 
      dislikes: newDislikes,
      userVote: newVoteStatus 
    };
  } catch (error) {
    console.error('Error disliking dog:', error);
    throw error;
  }
}