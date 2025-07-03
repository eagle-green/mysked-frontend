import { fetcher, endpoints } from 'src/lib/axios';

/**
 * Clean up placeholder files for a specific user
 * @param userId - The user ID
 * @returns Promise with cleanup result
 */
export const cleanupUserPlaceholder = async (userId: string) => {
  try {
  
    
    const response = await fetcher([
      `${endpoints.cloudinaryCleanupPlaceholder}/${userId}`,
      { method: 'DELETE' },
    ]);
    
    
    return response;
  } catch (error) {
    console.error('Error cleaning up placeholder:', error);
    throw error;
  }
};

/**
 * Clean up placeholder files for multiple users
 * @param userIds - Array of user IDs
 * @returns Promise with cleanup results
 */
export const cleanupMultipleUserPlaceholders = async (userIds: string[]) => {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const result = await cleanupUserPlaceholder(userId);
      results.push({ userId, success: true, result });
    } catch (error) {
      results.push({ userId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  
  return results;
};

// Make it available globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).cloudinaryCleanup = {
    cleanupUserPlaceholder,
    cleanupMultipleUserPlaceholders,
  };
} 