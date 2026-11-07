/**
 * Utility functions for calculating durations from timestamps
 * Handles the inconsistent timestamp formats from DynamoDB
 */

interface DurationResult {
  valid: boolean;
  durationMs: number;
  formatted: string;
}

/**
 * Calculates total duration between two timestamps
 * @param createdAt - ISO 8601 timestamp when processing started
 * @param processingCompletedAt - ISO 8601 timestamp when processing finished  
 * @param processingTimeMs - Processing time in milliseconds (fallback)
 * @returns Duration result with validation and formatting
 */
export function calculateDuration(
  createdAt?: string,
  processingCompletedAt?: string,
  processingTimeMs?: number
): DurationResult {
  // First try to calculate wall-clock duration from timestamps
  if (createdAt && processingCompletedAt) {
    try {
      // Normalize timestamps to handle inconsistent formats from DynamoDB
      const normalizedStart = normalizeTimestamp(createdAt);
      const normalizedEnd = normalizeTimestamp(processingCompletedAt);
      
      const startTime = new Date(normalizedStart).getTime();
      const endTime = new Date(normalizedEnd).getTime();
      const durationMs = endTime - startTime;
      
      // Validate that duration is reasonable (> 1 second and < 24 hours)
      if (durationMs > 1000 && durationMs < 86400000) {
        return {
          valid: true,
          durationMs,
          formatted: formatDuration(durationMs)
        };
      }
    } catch (error) {
      console.warn('Failed to parse timestamps:', { createdAt, processingCompletedAt, error });
    }
  }
  
  // Fallback to processingTimeMs if available
  if (processingTimeMs && processingTimeMs > 0) {
    return {
      valid: true,
      durationMs: processingTimeMs,
      formatted: formatDuration(processingTimeMs)
    };
  }
  
  // No valid duration available
  return {
    valid: false,
    durationMs: 0,
    formatted: '-'
  };
}

/**
 * Normalizes timestamp formats to ISO 8601 with Z suffix
 * Handles microseconds by truncating to milliseconds
 * @param timestamp - Raw timestamp string
 * @returns Normalized ISO 8601 timestamp
 */
function normalizeTimestamp(timestamp: string): string {
  let normalized = timestamp.trim();
  
  // Handle microseconds (6 decimal places) by truncating to milliseconds (3)
  if (normalized.includes('.') && !normalized.endsWith('Z')) {
    const parts = normalized.split('.');
    if (parts[1] && parts[1].length > 3) {
      const milliseconds = parts[1].substring(0, 3);
      normalized = `${parts[0]}.${milliseconds}Z`;
    } else {
      normalized = `${normalized}Z`;
    }
  } else if (!normalized.endsWith('Z') && !normalized.includes('+')) {
    // Add Z suffix for UTC if not present
    normalized = `${normalized}Z`;
  }
  
  return normalized;
}

/**
 * Formats duration in milliseconds to human-readable string
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string (e.g., "5m 23s")
 */
function formatDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${hours}h`;
}

/**
 * Example usage and validation for the prompt example:
 * 
 * createdAt = "2025-08-18T13:14:10.000662"
 * processingCompletedAt = "2025-08-18T13:19:23.612Z"
 * processingTimeMs = 113024
 * 
 * Wall-clock duration: 313.611338 seconds ≈ 5m 14s
 * Processing time: 113.024 seconds ≈ 1m 53s
 */