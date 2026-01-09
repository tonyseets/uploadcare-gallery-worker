/**
 * URL validation utilities
 * 
 * Validates Uploadcare group URLs and extracts components.
 */

import type { Env, ValidationResult } from './types';
import { getMaxGroupFileCount } from './env';

// URL pattern matches both group URLs (uuid~N where N>1) and single-file URLs (uuid~1)
// Single-file URLs (uuid~1) are supported for compatibility - some integrations always append ~1
// even for single files. The gallery works fine with count=1.
export const GROUP_URL_PATTERN = /^https:\/\/([^\/]+)\/([a-f0-9-]{36})~(\d+)\/?$/;

// Extract hostname from URL for validation
export function getHostFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return null;
  }
}

// Validate Uploadcare group URL
export function validateUrl(url: string, env: Env): ValidationResult {
  if (!url) return { valid: false, error: 'No URL provided' };

  const match = url.match(GROUP_URL_PATTERN);
  if (!match) return { valid: false, error: 'Invalid URL format' };

  const [, host, groupId, countStr] = match;

  // Only allow configured Uploadcare CDN hosts
  const allowedHosts = env.ALLOWED_CDN_HOSTS.split(',').map(h => h.trim());
  if (!allowedHosts.includes(host)) {
    return { valid: false, error: 'Unauthorized CDN host' };
  }

  // Basic validation - at least 1 file
  const count = parseInt(countStr, 10);
  if (count < 1) {
    return { valid: false, error: 'Invalid file count' };
  }

  // Check max file count limit
  const maxCount = getMaxGroupFileCount(env);
  if (count > maxCount) {
    return { valid: false, error: `File count exceeds maximum (${maxCount})` };
  }

  return { valid: true, host, groupId, count };
}
