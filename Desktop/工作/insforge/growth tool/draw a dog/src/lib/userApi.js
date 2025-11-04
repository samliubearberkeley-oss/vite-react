import { insforge } from './insforgeClient';

/**
 * Register a new user ID in the backend
 * This ensures the user ID is unique across the system
 * @param {string} userId - The generated user ID
 * @returns {Promise<{success: boolean, userId: string}>}
 */
export async function registerUser(userId) {
  try {
    // Check if user already exists
    const { data: existing, error: checkError } = await insforge.database
      .from('app_users')
      .select('id')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() for checking existence

    // If error occurs during check (but not "not found"), handle it
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // If user exists, return it
    if (existing) {
      return { success: true, userId, isNew: false };
    }

    // Register new user - Insforge SDK format
    const { data, error } = await insforge.database
      .from('app_users')
      .insert([{
        id: userId,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      // If it's a unique constraint violation, generate a new ID
      if (error.code === '23505' || error.message?.includes('duplicate') || error.code === 'PGRST301') {
        throw new Error('USER_ID_COLLISION');
      }
      throw error;
    }

    return { success: true, userId, isNew: true };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Update user's last seen timestamp
 * @param {string} userId - The user ID
 */
export async function updateLastSeen(userId) {
  try {
    // Insforge SDK format - update returns { data, error }
    const { error } = await insforge.database
      .from('app_users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last seen:', error);
    }
  } catch (error) {
    console.error('Error updating last seen:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Get user stats
 * @param {string} userId - The user ID
 * @returns {Promise<{dogCount: number, totalLikes: number}>}
 */
export async function getUserStats(userId) {
  try {
    // Insforge SDK format - returns { data, error }
    const { data, error } = await insforge.database
      .from('dogs')
      .select('id, likes')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user stats:', error);
      return { dogCount: 0, totalLikes: 0 };
    }

    const dogs = data || [];
    const dogCount = dogs.length;
    const totalLikes = dogs.reduce((sum, dog) => sum + (dog.likes || 0), 0);

    return { dogCount, totalLikes };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { dogCount: 0, totalLikes: 0 };
  }
}

