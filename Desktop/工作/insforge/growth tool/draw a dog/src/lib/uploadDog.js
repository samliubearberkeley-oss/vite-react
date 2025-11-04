import { insforge } from './insforgeClient';

/**
 * Upload a dog drawing to Insforge
 * @param {File|Blob} imageBlob - The image file/blob to upload
 * @param {number} score - The dog-likeness score (0-1)
 * @param {string} userId - The user ID who drew it
 * @returns {Promise<{id: string, imageUrl: string}>}
 */
export async function uploadDog(imageBlob, score, userId) {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `dog_${userId}_${timestamp}.png`;
    
    // Upload image to Insforge Storage - SDK returns { data, error }
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

    // Save metadata to database - Insforge SDK format
    console.log('[uploadDog] Inserting dog to database:', { user_id: userId, image_url: imageUrl, score });
    const { data: dbData, error: dbError } = await insforge.database
      .from('dogs')
      .insert([{
        user_id: userId,
        image_url: imageUrl,
        score: score,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    console.log('[uploadDog] Database insert result:', { dbData, dbError });

    if (dbError) {
      throw new Error(`Database save failed: ${dbError.message || dbError}`);
    }

    console.log('[uploadDog] Successfully saved dog with id:', dbData.id);
    return {
      id: dbData.id,
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
    // Insforge SDK format - returns { data, error }
    const result = await insforge.database
      .from('dogs')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('[fetchAllDogs] Raw result:', result, 'type:', typeof result);

    // Handle both { data, error } format and direct array return
    const { data, error } = result && typeof result === 'object' && ('data' in result || 'error' in result)
      ? result
      : { data: result, error: null };

    console.log('[fetchAllDogs] Parsed data:', data, 'error:', error);

    if (error) {
      console.error('[fetchAllDogs] Error fetching dogs:', error);
      return [];
    }

    // Ensure we return an array
    const dogs = Array.isArray(data) ? data : (data ? [data] : []);
    console.log('[fetchAllDogs] Returning', dogs.length, 'dogs:', dogs);
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
    // Insforge SDK format - returns { data, error }
    const { data, error } = await insforge.database
      .from('dogs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user dogs:', error);
      return [];
    }

    return data || [];
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
    // Check current vote
    const currentVote = await getUserVote(userId, dogId);

    // First fetch current dog to get current counts - Insforge SDK format
    const { data: currentDog, error: fetchError } = await insforge.database
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!currentDog) {
      throw new Error('Dog not found');
    }

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

    // Update the dog - Insforge SDK format
    const { error } = await insforge.database
      .from('dogs')
      .update({ likes: newLikes, dislikes: newDislikes })
      .eq('id', dogId);

    if (error) throw error;

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
    // Check current vote
    const currentVote = await getUserVote(userId, dogId);

    // First fetch current dog to get current counts - Insforge SDK format
    const { data: currentDog, error: fetchError } = await insforge.database
      .from('dogs')
      .select('*')
      .eq('id', dogId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!currentDog) {
      throw new Error('Dog not found');
    }

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

    // Update the dog - Insforge SDK format
    const { error } = await insforge.database
      .from('dogs')
      .update({ likes: newLikes, dislikes: newDislikes })
      .eq('id', dogId);

    if (error) throw error;

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