/**
 * Environment configuration and helper functions
 * 
 * Provides constants, defaults, and helper functions for accessing
 * and transforming environment variables.
 */

import type { Env } from './types';
import { escapeHtml } from './utils';

// Version constant (used for ETag-based caching)
export const VERSION = '1.8.0';

// Security limits
export const DEFAULT_MAX_GROUP_FILE_COUNT = 50;
export const HEAD_REQUEST_CONCURRENCY = 20;

// Default CDN URLs and SRI
export const DEFAULT_JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
export const DEFAULT_JSZIP_INTEGRITY = 'sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==';

// Default cache durations (in seconds)
export const DEFAULT_GALLERY_CACHE_SECONDS = 3600;      // 1 hour
export const DEFAULT_SCRIPT_BROWSER_CACHE_SECONDS = 60;      // 60 seconds (frequent revalidation with ETag)
export const DEFAULT_SCRIPT_CDN_CACHE_SECONDS = 604800;      // 7 days

// Default colors for optional env vars
const DEFAULT_SUCCESS_COLOR = '#16a34a';

// Helper to get success color with fallback
export function getSuccessColor(env: Env): string {
  return env.SUCCESS_COLOR || DEFAULT_SUCCESS_COLOR;
}

// Helper to get link hover color with fallback
export function getLinkHoverColor(env: Env): string {
  return env.LINK_HOVER_COLOR || 'inherit';
}

// Helper to get JSZip URLs and SRI integrity
// SRI logic: default URL uses default integrity, custom URL needs custom integrity (or set empty to disable)
export function getJsZipConfig(env: Env): { primary: string; fallback: string; integrity: string | undefined } {
  const isCustomUrl = !!env.JSZIP_URL;
  const primary = env.JSZIP_URL || DEFAULT_JSZIP_URL;
  const fallback = env.JSZIP_FALLBACK_URL || DEFAULT_JSZIP_URL;
  
  // Integrity: use default for default URL, custom if provided, undefined to skip SRI
  let integrity: string | undefined;
  if (!isCustomUrl) {
    // Using default URL - use default integrity
    integrity = DEFAULT_JSZIP_INTEGRITY;
  } else if (env.JSZIP_INTEGRITY) {
    // Custom URL with custom integrity provided
    integrity = env.JSZIP_INTEGRITY;
  }
  // If custom URL without integrity, integrity stays undefined (no SRI)
  
  return { primary, fallback, integrity };
}

// Legacy alias for compatibility
export function getJsZipUrls(env: Env): { primary: string; fallback: string } {
  const config = getJsZipConfig(env);
  return { primary: config.primary, fallback: config.fallback };
}

// Cache duration helpers
export function getGalleryCacheSeconds(env: Env): number {
  return parseInt(env.CACHE_GALLERY_SECONDS || String(DEFAULT_GALLERY_CACHE_SECONDS), 10);
}

export function getScriptBrowserCacheSeconds(env: Env): number {
  return parseInt(env.CACHE_SCRIPT_BROWSER_SECONDS || String(DEFAULT_SCRIPT_BROWSER_CACHE_SECONDS), 10);
}

export function getScriptCdnCacheSeconds(env: Env): number {
  return parseInt(env.CACHE_SCRIPT_CDN_SECONDS || String(DEFAULT_SCRIPT_CDN_CACHE_SECONDS), 10);
}

// Feature toggle helper
// defaultEnabled=true: returns true unless explicitly set to "false" (most features)
// defaultEnabled=false: returns false unless explicitly set to "true" (opt-in features like demo)
export function isFeatureEnabled(value: string | undefined, defaultEnabled: boolean = true): boolean {
  if (defaultEnabled) {
    return value !== 'false';
  } else {
    return value === 'true';
  }
}

// Theme color helpers with light theme defaults
export function getBgColor(env: Env): string { return env.BG_COLOR || '#ffffff'; }
export function getPanelColor(env: Env): string { return env.PANEL_COLOR || '#f9fafb'; }
export function getSurfaceColor(env: Env): string { return env.SURFACE_COLOR || '#f3f4f6'; }
export function getBorderColor(env: Env): string { return env.BORDER_COLOR || '#e5e7eb'; }
export function getTextColor(env: Env): string { return env.TEXT_COLOR || '#111827'; }
export function getTextSecondaryColor(env: Env): string { return env.TEXT_SECONDARY_COLOR || '#6b7280'; }
export function getTextMutedColor(env: Env): string { return env.TEXT_MUTED_COLOR || '#9ca3af'; }
export function getHeaderBg(env: Env): string { return env.HEADER_BG || '#ffffffcc'; }

// Extract hostname from URL for CSP
export function getHostFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return null;
  }
}

// Build Content-Security-Policy header value based on environment
// Allows inline scripts/styles (required for this app) while restricting external resources
export function getContentSecurityPolicy(env: Env): string {
  const jsZipConfig = getJsZipConfig(env);
  
  // Script sources: self, unsafe-inline for inline scripts, JSZip CDN host
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const jsZipHost = getHostFromUrl(jsZipConfig.primary);
  if (jsZipHost) scriptSources.push(jsZipHost);
  // Add fallback host if different
  const fallbackHost = getHostFromUrl(jsZipConfig.fallback);
  if (fallbackHost && fallbackHost !== jsZipHost) scriptSources.push(fallbackHost);
  
  // Style sources: self, unsafe-inline for inline styles, font CSS host
  const styleSources = ["'self'", "'unsafe-inline'"];
  if (env.FONT_CSS_URL) {
    const fontCssHost = getHostFromUrl(env.FONT_CSS_URL);
    if (fontCssHost) styleSources.push(fontCssHost);
  } else {
    // Default Google Fonts
    styleSources.push('fonts.googleapis.com');
  }
  
  // Font sources: Google Fonts or custom
  const fontSources = ["'self'"];
  if (env.FONT_CSS_URL) {
    // Custom fonts might come from same host as CSS or different
    const fontCssHost = getHostFromUrl(env.FONT_CSS_URL);
    if (fontCssHost) fontSources.push(fontCssHost);
  } else {
    fontSources.push('fonts.gstatic.com');
  }
  
  // Build CSP directives
  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    `font-src ${fontSources.join(' ')}`,
    `img-src 'self' data: blob: https:`,
    `media-src https:`,
    `frame-src https:`,
    `connect-src 'self' https:`,
    `base-uri 'self'`,
    `form-action 'self'`
  ];
  
  return directives.join('; ');
}

// Grid layout helpers
export function getDefaultGridColumns(env: Env): number {
  const cols = parseInt(env.DEFAULT_GRID_COLUMNS || '2', 10);
  return [1, 2, 3, 4].includes(cols) ? cols : 2;
}

export function getImageFit(env: Env): string {
  return env.IMAGE_FIT === 'cover' ? 'cover' : 'contain';
}

export function isLightboxEnabled(env: Env): boolean {
  return env.ENABLE_LIGHTBOX !== 'false';
}

export function isDemoEnabled(env: Env): boolean {
  return isFeatureEnabled(env.ENABLE_DEMO, false); // Opt-in, default false
}

export function getMaxGroupFileCount(env: Env): number {
  return parseInt(env.MAX_GROUP_FILE_COUNT || String(DEFAULT_MAX_GROUP_FILE_COUNT), 10);
}

export function isPdfPreviewEnabled(env: Env): boolean {
  return isFeatureEnabled(env.ENABLE_PDF_PREVIEW);
}

export function isAudioPreviewEnabled(env: Env): boolean {
  return isFeatureEnabled(env.ENABLE_AUDIO_PREVIEW);
}

export function isVideoAutoplayEnabled(env: Env): boolean {
  return env.VIDEO_AUTOPLAY === 'true'; // Default false, must explicitly enable
}

// Get effective main action, with fallback logic
// Returns "lightbox" (default when enabled), "download", or "open"
export function getMainAction(env: Env): 'lightbox' | 'download' | 'open' {
  const action = env.MAIN_ACTION || 'lightbox';
  const lightboxEnabled = isLightboxEnabled(env);
  
  // If lightbox requested but disabled, fallback to download
  if (action === 'lightbox' && !lightboxEnabled) {
    return 'download';
  }
  
  // Validate action value
  if (['lightbox', 'download', 'open'].includes(action)) {
    return action as 'lightbox' | 'download' | 'open';
  }
  
  // Invalid value: use sensible default
  return lightboxEnabled ? 'lightbox' : 'download';
}

// Note: isLightboxPreviewable moved to files.ts since it depends on isImageExtension
