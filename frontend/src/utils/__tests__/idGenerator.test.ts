import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  generateRepoId, 
  generateUniqueRepoId, 
  getExpectedRepoName, 
  parseRepoName 
} from '../idGenerator';

describe('idGenerator', () => {
  describe('generateRepoId', () => {
    it('should generate a 5-character ID', () => {
      const id = generateRepoId();
      expect(id).toHaveLength(5);
    });

    it('should only contain lowercase letters and numbers', () => {
      const id = generateRepoId();
      expect(id).toMatch(/^[a-z0-9]{5}$/);
    });

    it('should generate different IDs on subsequent calls', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRepoId());
      }
      // With 36^5 possible combinations, 100 random IDs should be unique
      expect(ids.size).toBe(100);
    });
  });

  describe('generateUniqueRepoId', () => {
    it('should return first generated ID if repo does not exist', async () => {
      const checkRepoExists = vi.fn().mockResolvedValue(false);
      
      const repoId = await generateUniqueRepoId('red', checkRepoExists);
      
      expect(repoId).toHaveLength(5);
      expect(checkRepoExists).toHaveBeenCalledTimes(1);
      expect(checkRepoExists).toHaveBeenCalledWith(expect.stringMatching(/^ci-red-[a-z0-9]{5}$/));
    });

    it('should try multiple times if repos exist', async () => {
      const checkRepoExists = vi.fn()
        .mockResolvedValueOnce(true)  // First attempt exists
        .mockResolvedValueOnce(true)  // Second attempt exists
        .mockResolvedValueOnce(false); // Third attempt doesn't exist
      
      const repoId = await generateUniqueRepoId('black', checkRepoExists);
      
      expect(repoId).toHaveLength(5);
      expect(checkRepoExists).toHaveBeenCalledTimes(3);
    });

    it('should handle different team types', async () => {
      const checkRepoExists = vi.fn().mockResolvedValue(false);
      
      const redId = await generateUniqueRepoId('red', checkRepoExists);
      const blackId = await generateUniqueRepoId('black', checkRepoExists);
      const whiteId = await generateUniqueRepoId('white', checkRepoExists);
      
      expect(checkRepoExists).toHaveBeenCalledWith(expect.stringMatching(/^ci-red-/));
      expect(checkRepoExists).toHaveBeenCalledWith(expect.stringMatching(/^ci-black-/));
      expect(checkRepoExists).toHaveBeenCalledWith(expect.stringMatching(/^ci-white-/));
    });

    it('should return ID even if check fails', async () => {
      const checkRepoExists = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const repoId = await generateUniqueRepoId('white', checkRepoExists);
      
      expect(repoId).toHaveLength(5);
      expect(checkRepoExists).toHaveBeenCalledTimes(1);
    });

    it('should add timestamp after max attempts', async () => {
      const checkRepoExists = vi.fn().mockResolvedValue(true); // Always exists
      
      const repoId = await generateUniqueRepoId('red', checkRepoExists);
      
      expect(checkRepoExists).toHaveBeenCalledTimes(10); // Max attempts
      expect(repoId).toHaveLength(5); // Still 5 characters
      expect(repoId).toMatch(/^[a-z0-9]{5}$/);
    });

    it('should handle check function errors gracefully', async () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const checkRepoExists = vi.fn()
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce(false);
      
      const repoId = await generateUniqueRepoId('black', checkRepoExists);
      
      expect(repoId).toHaveLength(5);
      expect(consoleWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to check repo existence'));
      expect(checkRepoExists).toHaveBeenCalledTimes(1);
      
      consoleWarn.mockRestore();
    });
  });

  describe('getExpectedRepoName', () => {
    it('should format repo name correctly', () => {
      expect(getExpectedRepoName('red', 'abc12')).toBe('ci-red-abc12');
      expect(getExpectedRepoName('black', 'xyz99')).toBe('ci-black-xyz99');
      expect(getExpectedRepoName('white', '12345')).toBe('ci-white-12345');
    });

    it('should handle all team types', () => {
      const teamTypes: Array<'red' | 'black' | 'white'> = ['red', 'black', 'white'];
      const repoId = 'test1';
      
      teamTypes.forEach(teamType => {
        const repoName = getExpectedRepoName(teamType, repoId);
        expect(repoName).toBe(`ci-${teamType}-${repoId}`);
      });
    });
  });

  describe('parseRepoName', () => {
    it('should parse valid repo names', () => {
      expect(parseRepoName('ci-red-abc12')).toEqual({
        teamType: 'red',
        repoId: 'abc12'
      });
      
      expect(parseRepoName('ci-black-xyz99')).toEqual({
        teamType: 'black',
        repoId: 'xyz99'
      });
      
      expect(parseRepoName('ci-white-12345')).toEqual({
        teamType: 'white',
        repoId: '12345'
      });
    });

    it('should return null for invalid formats', () => {
      expect(parseRepoName('invalid-name')).toBeNull();
      expect(parseRepoName('ci-red')).toBeNull();
      expect(parseRepoName('ci-red-toolong123')).toBeNull();
      expect(parseRepoName('ci-red-shor')).toBeNull();
      expect(parseRepoName('not-ci-red-12345')).toBeNull();
      expect(parseRepoName('')).toBeNull();
    });

    it('should only match exact format', () => {
      // Team type must be word characters
      expect(parseRepoName('ci-red-team-12345')).toBeNull();
      
      // Repo ID must be exactly 5 characters
      expect(parseRepoName('ci-red-1234')).toBeNull();
      expect(parseRepoName('ci-red-123456')).toBeNull();
      
      // Must start with 'ci-'
      expect(parseRepoName('pr-red-12345')).toBeNull();
    });

    it('should handle edge cases', () => {
      // Special characters in team type
      expect(parseRepoName('ci-red!-12345')).toBeNull();
      
      // Special characters in repo ID
      expect(parseRepoName('ci-red-12!45')).toBeNull();
      
      // Valid but unusual team types
      expect(parseRepoName('ci-blue-12345')).toEqual({
        teamType: 'blue',
        repoId: '12345'
      });
    });
  });
});