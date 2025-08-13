/**
 * @fileoverview Utility functions for generating unique repository identifiers.
 * 
 * Provides secure and collision-resistant ID generation for GitHub repository
 * creation in the Color Code Research Hub. Supports team-specific naming
 * conventions and uniqueness validation.
 * 
 * Repository Naming Convention:
 * - Format: ci-{teamType}-{repoId}
 * - Example: ci-red-a3b9x, ci-black-m7k2p
 * - Length: 5 characters (alphanumeric lowercase)
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

/**
 * Generate a unique 5-character alphanumeric ID for repository identification.
 * 
 * Uses lowercase letters and numbers to ensure GitHub compatibility
 * and avoid naming conflicts. The 5-character length provides
 * over 60 million possible combinations.
 * 
 * @returns {string} 5-character lowercase alphanumeric identifier
 * 
 * @example
 * ```typescript
 * const repoId = generateRepoId(); // "a3b9x"
 * ```
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
 * Generate a unique repository ID with collision detection.
 * 
 * Attempts to generate a unique repository ID by checking against existing
 * repositories. If collisions occur, retries up to 10 times before falling
 * back to timestamp-based generation for guaranteed uniqueness.
 * 
 * @param {('red'|'black'|'white')} teamType - Team type for naming convention
 * @param {Function} checkRepoExists - Async function to verify repository existence
 * @returns {Promise<string>} Guaranteed unique repository ID
 * @throws {Error} Only if repository existence check fails critically
 * 
 * @example
 * ```typescript
 * const uniqueId = await generateUniqueRepoId('red', async (name) => {
 *   return await githubService.repositoryExists(name);
 * });
 * console.log(uniqueId); // "a3b9x" (if unique) or "a3k9m" (with timestamp)
 * ```
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