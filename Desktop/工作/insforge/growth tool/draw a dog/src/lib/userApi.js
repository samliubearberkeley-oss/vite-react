import { insforge } from './insforgeClient';
import { INSFORGE_CONFIG } from './config';

/**
 * Register a new user ID in the backend
 * This ensures the user ID is unique across the system
 * @param {string} userId - The generated user ID
 * @returns {Promise<{success: boolean, userId: string}>}
 */
export async function registerUser(userId) {
  try {
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    // Check if user already exists
    const checkResponse = await fetch(`${baseUrl}/api/database/records/app_users?select=id&id=eq.${userId}`, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing && existing.length > 0) {
        return { success: true, userId, isNew: false };
      }
    }

    // Register new user
    const insertResponse = await fetch(`${baseUrl}/api/database/records/app_users`, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      })
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      if (errorText.includes('duplicate') || errorText.includes('23505')) {
        throw new Error('USER_ID_COLLISION');
      }
      throw new Error(errorText);
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
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    await fetch(`${baseUrl}/api/database/records/app_users?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ last_seen: new Date().toISOString() })
    });
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
    const { baseUrl, apiKey } = INSFORGE_CONFIG;
    
    const response = await fetch(`${baseUrl}/api/database/records/dogs?select=id,likes&user_id=eq.${userId}`, {
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      return { dogCount: 0, totalLikes: 0 };
    }

    const dogs = await response.json() || [];
    const dogCount = dogs.length;
    const totalLikes = dogs.reduce((sum, dog) => sum + (dog.likes || 0), 0);

    return { dogCount, totalLikes };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return { dogCount: 0, totalLikes: 0 };
  }
}

