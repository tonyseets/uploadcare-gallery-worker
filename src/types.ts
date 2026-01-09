/**
 * Type definitions for Uploadcare Gallery Worker
 * 
 * Core interfaces and types used throughout the application.
 */

// Environment variables interface
export interface Env {
  // Required
  ALLOWED_CDN_HOSTS: string      // Comma-separated CDN hostnames
  COMPANY_NAME: string           // Display name in UI
  COMPANY_URL: string            // Link destination for logo
  WORKER_URL: string             // Full URL of this worker (for uploader script)
  
  // Branding
  BRAND_COLOR: string            // Primary brand color (hex)
  LOGO_SVG?: string              // Inline SVG logo (preferred)
  LOGO_URL?: string              // Alternative: URL to logo image
  FAVICON_URL: string            // Favicon URL
  
  // Typography
  FONT_BODY: string              // Body text font family name
  FONT_DISPLAY: string           // Headings font family name
  FONT_CSS_URL?: string          // Custom font CSS URL (if set, skips Google Fonts)
  
  // Behavior
  MAIN_ACTION?: string           // "lightbox" (default), "download", or "open" - card click behavior
  
  // Optional accent colors (defaults provided if not set)
  SUCCESS_COLOR?: string         // Success/confirmation color (default: #16a34a green)
  LINK_HOVER_COLOR?: string      // Link hover color (default: inherit = no change)
  
  // Theme colors (all optional - sensible light theme defaults)
  BG_COLOR?: string              // Page background (default: #ffffff)
  PANEL_COLOR?: string           // Panel/card backgrounds (default: #f9fafb)
  SURFACE_COLOR?: string         // Interactive surfaces (default: #f3f4f6)
  BORDER_COLOR?: string          // Borders (default: #e5e7eb)
  TEXT_COLOR?: string            // Primary text (default: #111827)
  TEXT_SECONDARY_COLOR?: string  // Secondary text (default: #6b7280)
  TEXT_MUTED_COLOR?: string      // Muted text (default: #9ca3af)
  HEADER_BG?: string             // Header background (default: #ffffffcc)
  
  // CDN URLs (optional - sensible defaults provided)
  JSZIP_URL?: string             // JSZip library URL (primary, default: cdnjs)
  JSZIP_FALLBACK_URL?: string    // JSZip library fallback URL (if primary fails, default: cdnjs)
  JSZIP_INTEGRITY?: string       // SRI hash for custom JSZIP_URL (default provided for cdnjs, set empty to disable)
  
  // Cache control (seconds as strings - env vars are always strings)
  CACHE_GALLERY_SECONDS?: string        // Gallery page cache (default: 3600 = 1 hour)
  CACHE_SCRIPT_BROWSER_SECONDS?: string // Script browser cache (default: 60s for ETag revalidation)
  CACHE_SCRIPT_CDN_SECONDS?: string     // Script CDN cache (default: 604800 = 7 days)
  
  // Feature toggles ("true"/"false" as strings, default: "true" = enabled)
  ENABLE_ZIP_DOWNLOAD?: string   // Show "Download ZIP" button (default: true)
  ENABLE_OPEN_ALL?: string       // Show "Open All in Tabs" button (default: true)
  ENABLE_SHARE_BUTTON?: string   // Show "Share" button in header (default: true)
  ENABLE_LIGHTBOX?: string       // Enable lightbox for images/videos (default: true)
  ENABLE_DEMO?: string           // Enable /demo route for testing branding (default: false)
  
  // Gallery layout options
  DEFAULT_GRID_COLUMNS?: string  // Default columns: "1", "2", "3", "4" (default: "2")
  IMAGE_FIT?: string             // Thumbnail fit: "contain" or "cover" (default: "contain")
  
  // Lightbox preview options
  ENABLE_PDF_PREVIEW?: string    // Embed PDFs in lightbox iframe (default: true)
  ENABLE_AUDIO_PREVIEW?: string  // Show audio player in lightbox (default: true)
  VIDEO_AUTOPLAY?: string        // Auto-play videos in lightbox (default: false)
  
  // Security limits
  MAX_GROUP_FILE_COUNT?: string  // Max files in a group URL (default: 50)
}

// File information structure
export interface FileInfo {
  index: number;
  url: string;
  filename: string;
  extension: string;  // Lowercase file extension (e.g., 'pdf', 'jpg', 'docx')
}

// URL validation result
export type ValidationResult =
  | { valid: true; host: string; groupId: string; count: number }
  | { valid: false; error: string };
