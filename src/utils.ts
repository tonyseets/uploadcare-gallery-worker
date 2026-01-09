/**
 * Utility functions for Uploadcare Gallery Worker
 * 
 * Shared helper functions used across multiple modules.
 */

// HTML escaping - escapes &, <, >, ", ' for safe embedding in HTML
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
