/**
 * Generate a unique 5-character ID for repo identification
 * Uses alphanumeric characters to avoid conflicts
 */
export function generateRepoId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique repo ID that doesn't already exist
 * Checks GitHub to ensure uniqueness
 */
export async function generateUniqueRepoId(
  teamType: 'red' | 'black' | 'white',
  checkRepoExists: (repoName: string) => Promise<boolean>
): Promise<string> {
  const maxAttempts = 10;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const repoId = generateRepoId();
    const repoName = getExpectedRepoName(teamType, repoId);
    
    try {
      const exists = await checkRepoExists(repoName);
      if (!exists) {
        return repoId;
      }
    } catch (error) {
      // If we can't check, assume it doesn't exist
      console.warn(`Failed to check repo existence: ${error}`);
      return repoId;
    }
  }
  
  // If we've tried 10 times, add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).slice(-3);
  return generateRepoId().slice(0, 2) + timestamp;
}

/**
 * Generate expected repo name based on team type and ID
 * Format: ci-{teamType}-{repoId}
 */
export function getExpectedRepoName(
  teamType: 'red' | 'black' | 'white',
  repoId: string
): string {
  return `ci-${teamType}-${repoId}`;
}

/**
 * Parse repo name to extract components
 */
export function parseRepoName(repoName: string): {
  teamType?: string;
  repoId?: string;
} | null {
  const match = repoName.match(/^ci-(\w+)-(\w{5})$/);
  if (!match) return null;
  
  return {
    teamType: match[1],
    repoId: match[2]
  };
}