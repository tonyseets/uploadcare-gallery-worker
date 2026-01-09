/**
 * Font loading utilities
 * 
 * Generates HTML for loading fonts (Google Fonts or custom CSS).
 */

import type { Env } from './types';

// Helper to generate font loading HTML
// Uses custom CSS URL if provided, otherwise loads from Google Fonts
export function getFontLoadingHtml(env: Env): string {
  if (env.FONT_CSS_URL) {
    // Custom font CSS - just load the provided URL
    return `<link href="${env.FONT_CSS_URL}" rel="stylesheet">`;
  }
  // Default: Google Fonts with preconnect hints
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(env.FONT_BODY)}:wght@300;400;500;600&family=${encodeURIComponent(env.FONT_DISPLAY)}:wght@400;500;700&display=swap" rel="stylesheet">`;
}
