/**
 * Uploadcare Gallery Worker
 * 
 * Transforms Uploadcare group URLs into a clean, branded gallery
 * with thumbnails, download buttons, and session-based tracking.
 * 
 * Fully white-labelable via wrangler.toml [vars].
 * 
 * @see README.md for setup instructions
 * @see wrangler.toml.example for configuration options
 */

// Environment variables interface
interface Env {
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
  JSZIP_URL?: string             // JSZip library URL (default: cdnjs)
  
  // Cache control (seconds as strings - env vars are always strings)
  CACHE_GALLERY_SECONDS?: string        // Gallery page cache (default: 3600 = 1 hour)
  CACHE_SCRIPT_BROWSER_SECONDS?: string // Script browser cache (default: 86400 = 1 day)
  CACHE_SCRIPT_CDN_SECONDS?: string     // Script CDN cache (default: 604800 = 7 days)
  
  // Feature toggles ("true"/"false" as strings, default: "true" = enabled)
  ENABLE_ZIP_DOWNLOAD?: string   // Show "Download ZIP" button (default: true)
  ENABLE_OPEN_ALL?: string       // Show "Open All in Tabs" button (default: true)
  ENABLE_SHARE_BUTTON?: string   // Show "Share" button in header (default: true)
  ENABLE_LIGHTBOX?: string       // Enable lightbox for images/videos (default: true)
  
  // Gallery layout options
  DEFAULT_GRID_COLUMNS?: string  // Default columns: "1", "2", "3", "4" (default: "2")
  IMAGE_FIT?: string             // Thumbnail fit: "contain" or "cover" (default: "contain")
}

// Constants
const VERSION = '1.4.4';
// No server-side file limit - configure limits in your Uploadcare project settings

// Default CDN URLs
const DEFAULT_JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

// Default cache durations (in seconds)
const DEFAULT_GALLERY_CACHE_SECONDS = 3600;      // 1 hour
const DEFAULT_SCRIPT_BROWSER_CACHE_SECONDS = 86400;   // 1 day
const DEFAULT_SCRIPT_CDN_CACHE_SECONDS = 604800;      // 7 days

// Default colors for optional env vars
const DEFAULT_SUCCESS_COLOR = '#16a34a';

// Helper to get success color with fallback
function getSuccessColor(env: Env): string {
  return env.SUCCESS_COLOR || DEFAULT_SUCCESS_COLOR;
}

// Helper to get link hover color with fallback
function getLinkHoverColor(env: Env): string {
  return env.LINK_HOVER_COLOR || 'inherit';
}

// Helper to get JSZip URL with fallback
function getJsZipUrl(env: Env): string {
  return env.JSZIP_URL || DEFAULT_JSZIP_URL;
}

// Cache duration helpers
function getGalleryCacheSeconds(env: Env): number {
  return parseInt(env.CACHE_GALLERY_SECONDS || String(DEFAULT_GALLERY_CACHE_SECONDS), 10);
}

function getScriptBrowserCacheSeconds(env: Env): number {
  return parseInt(env.CACHE_SCRIPT_BROWSER_SECONDS || String(DEFAULT_SCRIPT_BROWSER_CACHE_SECONDS), 10);
}

function getScriptCdnCacheSeconds(env: Env): number {
  return parseInt(env.CACHE_SCRIPT_CDN_SECONDS || String(DEFAULT_SCRIPT_CDN_CACHE_SECONDS), 10);
}

// Feature toggle helper - returns true unless explicitly set to "false"
function isFeatureEnabled(value: string | undefined): boolean {
  return value !== 'false';
}

// Theme color helpers with light theme defaults
function getBgColor(env: Env): string { return env.BG_COLOR || '#ffffff'; }
function getPanelColor(env: Env): string { return env.PANEL_COLOR || '#f9fafb'; }
function getSurfaceColor(env: Env): string { return env.SURFACE_COLOR || '#f3f4f6'; }
function getBorderColor(env: Env): string { return env.BORDER_COLOR || '#e5e7eb'; }
function getTextColor(env: Env): string { return env.TEXT_COLOR || '#111827'; }
function getTextSecondaryColor(env: Env): string { return env.TEXT_SECONDARY_COLOR || '#6b7280'; }
function getTextMutedColor(env: Env): string { return env.TEXT_MUTED_COLOR || '#9ca3af'; }
function getHeaderBg(env: Env): string { return env.HEADER_BG || '#ffffffcc'; }

// Grid layout helpers
function getDefaultGridColumns(env: Env): number {
  const cols = parseInt(env.DEFAULT_GRID_COLUMNS || '2', 10);
  return [1, 2, 3, 4].includes(cols) ? cols : 2;
}

function getImageFit(env: Env): string {
  return env.IMAGE_FIT === 'cover' ? 'cover' : 'contain';
}

function isLightboxEnabled(env: Env): boolean {
  return env.ENABLE_LIGHTBOX !== 'false';
}

// Get effective main action, with fallback logic
// Returns "lightbox" (default when enabled), "download", or "open"
function getMainAction(env: Env): 'lightbox' | 'download' | 'open' {
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

// Check if file can be previewed in lightbox (images + browser-native video formats)
function isLightboxPreviewable(ext: string): boolean {
  return isImageExtension(ext) || ['mp4', 'webm', 'mov'].includes(ext);
}

// Helper to generate font loading HTML
// Uses custom CSS URL if provided, otherwise loads from Google Fonts
function getFontLoadingHtml(env: Env): string {
  if (env.FONT_CSS_URL) {
    // Custom font CSS - just load the provided URL
    return `<link href="${env.FONT_CSS_URL}" rel="stylesheet">`;
  }
  // Default: Google Fonts with preconnect hints
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(env.FONT_BODY)}:wght@300;400;500;600&family=${encodeURIComponent(env.FONT_DISPLAY)}:wght@400;500;700&display=swap" rel="stylesheet">`;
}

// URL pattern matches both group URLs (uuid~N where N>1) and single-file URLs (uuid~1)
// Single-file URLs (uuid~1) are supported for compatibility - some integrations always append ~1
// even for single files. The gallery works fine with count=1.
const GROUP_URL_PATTERN = /^https:\/\/([^\/]+)\/([a-f0-9-]{36})~(\d+)\/?$/;

type ValidationResult =
  | { valid: true; host: string; groupId: string; count: number }
  | { valid: false; error: string };

function validateUrl(url: string, env: Env): ValidationResult {
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

  return { valid: true, host, groupId, count };
}

function getFileExtension(url: string): string {
  // Try to extract extension from URL path
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : '';
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm} UTC`;
}

function formatTimestampShort(ts: number): string {
  const date = new Date(ts * 1000);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear().toString().slice(-2);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

function isImageExtension(ext: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
}

function isVideoExtension(ext: string): boolean {
  return ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v', '3gp'].includes(ext);
}

function isPdfExtension(ext: string): boolean {
  return ext === 'pdf';
}

/**
 * Returns an inline SVG icon for the given file extension.
 * Uses stroke icons with currentColor for easy styling.
 */
function getFileTypeIconSvg(ext: string): string {
  // Video files - film/clapperboard icon
  if (isVideoExtension(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
      <line x1="7" y1="2" x2="7" y2="22"></line>
      <line x1="17" y1="2" x2="17" y2="22"></line>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <line x1="2" y1="7" x2="7" y2="7"></line>
      <line x1="2" y1="17" x2="7" y2="17"></line>
      <line x1="17" y1="17" x2="22" y2="17"></line>
      <line x1="17" y1="7" x2="22" y2="7"></line>
    </svg>`;
  }

  // PDF documents - document with lines icon
  if (isPdfExtension(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>`;
  }

  // Word documents
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>`;
  }

  // Spreadsheets - table/grid icon
  if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <rect x="6" y="11" width="12" height="9" rx="1"></rect>
      <line x1="10" y1="11" x2="10" y2="20"></line>
      <line x1="14" y1="11" x2="14" y2="20"></line>
      <line x1="6" y1="15" x2="18" y2="15"></line>
    </svg>`;
  }

  // Presentations - slides icon
  if (['ppt', 'pptx', 'key', 'odp'].includes(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <rect x="7" y="11" width="10" height="7" rx="1"></rect>
      <line x1="12" y1="18" x2="12" y2="20"></line>
      <line x1="9" y1="20" x2="15" y2="20"></line>
    </svg>`;
  }

  // Archives - package icon
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'tgz'].includes(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16.5 9.4 7.55 4.24"></path>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.29 7 12 12 20.71 7"></polyline>
      <line x1="12" y1="22" x2="12" y2="12"></line>
    </svg>`;
  }

  // Audio files - waveform/audio icon
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'].includes(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 18V5l12-2v13"></path>
      <circle cx="6" cy="18" r="3"></circle>
      <circle cx="18" cy="16" r="3"></circle>
    </svg>`;
  }

  // Text/code files
  if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'sh', 'yaml', 'yml', 'toml', 'ini', 'log'].includes(ext)) {
    return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>`;
  }

  // Generic file fallback
  return `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>`;
}

interface FileInfo {
  index: number;
  url: string;
  filename: string;
  extension: string;  // Lowercase file extension (e.g., 'pdf', 'jpg', 'docx')
}

function getExtensionFromFilename(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

async function fetchFileInfos(host: string, groupId: string, count: number): Promise<FileInfo[]> {
  const baseUrl = `https://${host}/${groupId}~${count}`;

  // Fetch headers for each file to get filenames
  const promises = Array.from({ length: count }, async (_, i) => {
    const fileUrl = `${baseUrl}/nth/${i}/`;
    try {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      const contentDisposition = response.headers.get('Content-Disposition') || '';
      // Parse filename from: inline; filename="somefile.png"
      const match = contentDisposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `File ${i + 1}`;
      const extension = getExtensionFromFilename(filename);
      return { index: i, url: fileUrl, filename, extension };
    } catch {
      return { index: i, url: fileUrl, filename: `File ${i + 1}`, extension: '' };
    }
  });

  const results = await Promise.all(promises);
  return results.sort((a, b) => a.index - b.index);
}

function generateHtml(env: Env, host: string, groupId: string, count: number, originalUrl: string, pageSlug: string, timestamp: number | null, fileInfos: FileInfo[]): string {
  const baseUrl = `https://${host}/${groupId}~${count}`;
  
  // Feature toggles
  const enableZipDownload = isFeatureEnabled(env.ENABLE_ZIP_DOWNLOAD);
  const enableOpenAll = isFeatureEnabled(env.ENABLE_OPEN_ALL);
  const enableShareButton = isFeatureEnabled(env.ENABLE_SHARE_BUTTON);
  
  // Extract domain from company URL for display
  const companyDomain = env.COMPANY_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Logo HTML - prefer SVG, fall back to URL
  const logoHtml = env.LOGO_SVG 
    ? env.LOGO_SVG 
    : env.LOGO_URL 
      ? `<img src="${env.LOGO_URL}" alt="${env.COMPANY_NAME}" class="logo-img" style="height: 18px; width: auto;" />`
      : `<span class="logo-text" style="font-weight: 600; font-size: 1rem;">${env.COMPANY_NAME}</span>`;
  
  // Generate file cards with actual filenames and smart thumbnails
  const fileCards = fileInfos.map((file, i) => {
    const fileUrl = file.url;
    const displayName = file.filename;
    const ext = file.extension;
    // Escape HTML entities in filename for title attribute
    const escapedName = displayName.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const downloadUrl = `${fileUrl}/-/inline/no/`;
    
    // Smart thumbnail logic based on file type
    let thumbnailHtml: string;
    if (isImageExtension(ext)) {
      // Images: use Uploadcare's preview transformation
      const thumbnailUrl = `${baseUrl}/nth/${i}/-/preview/1200x750/-/quality/smart/-/format/auto/`;
      thumbnailHtml = `<img 
              src="${thumbnailUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\\'fallback-icon\\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
    } else if (isVideoExtension(ext)) {
      // Videos: Uploadcare extracts first frame automatically with preview
      const thumbnailUrl = `${baseUrl}/nth/${i}/-/preview/1200x750/-/format/jpeg/`;
      thumbnailHtml = `<img 
              src="${thumbnailUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\\'fallback-icon\\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
    } else if (isPdfExtension(ext)) {
      // PDFs: Uploadcare converts first page to image
      const thumbnailUrl = `${baseUrl}/nth/${i}/-/preview/1200x750/-/format/jpeg/`;
      thumbnailHtml = `<img 
              src="${thumbnailUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\\'fallback-icon\\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
    } else {
      // Non-previewable files: show SVG icon immediately (no wasted network request)
      thumbnailHtml = `<div class="fallback-icon">${getFileTypeIconSvg(ext)}</div>`;
    }
    
    // Lightbox data for previewable files
    const lightboxEnabled = isLightboxEnabled(env);
    const canPreview = lightboxEnabled && isLightboxPreviewable(ext);
    
    // Determine main action for this card
    const mainAction = getMainAction(env);
    // For non-previewable files with lightbox action, fall back to download
    const effectiveAction = (mainAction === 'lightbox' && !canPreview) ? 'download' : mainAction;
    const cardMainHref = effectiveAction === 'open' ? fileUrl : downloadUrl;
    const cardMainTarget = effectiveAction === 'open' ? ' target="_blank" rel="noopener noreferrer"' : '';
    const isVideo = isVideoExtension(ext) && ['mp4', 'webm', 'mov'].includes(ext);
    const lightboxAttrs = canPreview 
      ? ` data-lightbox="true" data-lightbox-src="${fileUrl}" data-lightbox-download="${downloadUrl}" data-lightbox-video="${isVideo}" data-lightbox-name="${escapedName}"`
      : '';
    
    // Lightbox trigger button (only for previewable files)
    const lightboxTriggerHtml = canPreview 
      ? `<button type="button" class="lightbox-trigger" aria-label="View ${escapedName} in lightbox" data-lightbox-index="${i}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M9 21H3v-6"></path><path d="M21 3l-7 7"></path><path d="M3 21l7-7"></path></svg>
        </button>`
      : '';
    
    return `
      <li class="file-card" data-index="${i}"${lightboxAttrs}>
        ${lightboxTriggerHtml}
        <a href="${cardMainHref}"${cardMainTarget} class="card-main" title="${escapedName}">
          <div class="thumbnail-container">
            ${thumbnailHtml}
          </div>
          <div class="file-info">
            <span class="file-name" title="${escapedName}">${displayName}</span>
          </div>
        </a>
        <div class="card-actions">
          <a href="${downloadUrl}" class="card-action download-action" aria-label="Download ${escapedName}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline class="download-arrow" points="7 10 12 15 17 10"></polyline><line class="download-arrow" x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span aria-hidden="true">Download</span>
            <svg class="action-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </a>
          <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="card-action open-action" aria-label="Open ${escapedName} in new tab">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline class="arrow-part" points="15 3 21 3 21 9"></polyline><line class="arrow-part" x1="10" y1="14" x2="21" y2="3"></line></svg>
            <span aria-hidden="true">Open</span>
            <svg class="action-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </a>
        </div>
      </li>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <meta name="description" content="File attachments for ${env.COMPANY_NAME} form submissions.">
  <title>Attachments (${count} file${count > 1 ? 's' : ''}) - ${env.COMPANY_NAME}</title>
  <link rel="icon" href="${env.FAVICON_URL}">
  ${getFontLoadingHtml(env)}
  <script>
  (function(){
    var c=localStorage.getItem('gallery-grid-columns');
    if(c&&['1','2','3','4'].includes(c))
      document.documentElement.style.setProperty('--grid-columns',c);
  })();
  </script>
  <style>
    :root {
      --brand-color: ${env.BRAND_COLOR};
      --success-color: ${getSuccessColor(env)};
      --link-hover-color: ${getLinkHoverColor(env)};
      --brand-bg: ${getBgColor(env)};
      --brand-panel: ${getPanelColor(env)};
      --brand-surface: ${getSurfaceColor(env)};
      --brand-border: ${getBorderColor(env)};
      --text-primary: ${getTextColor(env)};
      --text-secondary: ${getTextSecondaryColor(env)};
      --text-muted: ${getTextMutedColor(env)};
      --grid-columns: ${getDefaultGridColumns(env)};
      --image-fit: ${getImageFit(env)};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Accessibility: Focus styles */
    :focus-visible {
      outline: 2px solid var(--brand-color);
      outline-offset: 2px;
    }

    :focus:not(:focus-visible) {
      outline: none;
    }

    /* Accessibility: Skip link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      padding: 8px 16px;
      background: var(--brand-color);
      color: white;
      text-decoration: none;
      font-weight: 500;
      z-index: 100;
      transition: top 0.2s;
    }

    .skip-link:focus {
      top: 0;
    }

    /* Accessibility: Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Accessibility: Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    html {
      height: 100%;
    }

    body {
      font-family: '${env.FONT_BODY}', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--brand-bg);
      background-image: radial-gradient(circle at 50% 0%, ${env.BRAND_COLOR}08, transparent 40%);
      background-attachment: fixed;
      color: var(--text-primary);
      min-height: 100%;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
    }

    .font-display {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
    }

    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: ${getHeaderBg(env)};
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--brand-border);
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 2.5rem;
      height: 64px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .header-inner {
        padding: 0 1.5rem;
      }
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .share-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-secondary);
      background: transparent;
      border: 1px solid var(--brand-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .share-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
      background: var(--brand-surface);
    }

    .share-btn .check-icon {
      display: none;
    }

    .share-btn.copied {
      color: var(--success-color);
      border-color: var(--success-color);
      background: color-mix(in srgb, var(--success-color) 10%, transparent);
    }

    .share-btn.copied .share-icon {
      display: none;
    }

    .share-btn.copied .check-icon {
      display: block;
    }

    .logo-link {
      position: relative;
      display: flex;
      align-items: center;
    }

    .logo-svg {
      height: 18px;
      width: auto;
      position: relative;
      z-index: 10;
      color: var(--text-primary);
      transition: color 0.3s;
    }

    .logo-link:hover .logo-svg {
      color: var(--link-hover-color);
    }

    .divider {
      height: 24px;
      width: 1px;
      background: var(--brand-border);
    }

    .page-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    /* Main content */
    main {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 2.5rem;
    }

    @media (max-width: 768px) {
      main {
        padding: 1.5rem;
      }
    }

    .content-header {
      margin-bottom: 2rem;
    }

    .content-header h1 {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .meta-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .meta-left a {
      color: var(--text-primary);
      text-decoration: none;
      font-family: '${env.FONT_DISPLAY}', monospace;
    }

    .meta-left a .slug-text {
      text-decoration: underline;
      text-decoration-color: var(--brand-color);
      text-underline-offset: 3px;
      transition: text-decoration-color 0.2s;
    }

    .meta-left a:hover .slug-text {
      text-decoration-color: var(--text-primary);
    }

    .meta-dot {
      color: var(--text-muted);
    }

    .meta-label {
      color: var(--text-secondary);
    }

    .ts-short {
      display: none;
    }

    /* Timestamp wrapper */
    .timestamp-wrap {
      position: relative;
      display: inline-block;
    }


    .timestamp-tooltip {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-4px);
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      padding: 0.5rem 0.75rem;
      margin-top: 10px;
      z-index: 100;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
      pointer-events: auto;
    }

    /* Invisible bridge to prevent hover gap */
    .timestamp-tooltip::after {
      content: '';
      position: absolute;
      top: -14px;
      left: 0;
      right: 0;
      height: 18px;
    }

    /* Arrow */
    .timestamp-tooltip::before {
      content: '';
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 8px;
      height: 8px;
      background: var(--brand-bg);
      border-left: 1px solid var(--brand-border);
      border-top: 1px solid var(--brand-border);
    }

    /* Mobile: tap to toggle */
    .timestamp-tooltip.active {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }

    /* Desktop: hover to show (only on devices that support hover) */
    @media (hover: hover) {
      .timestamp-wrap:hover .timestamp-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
      }

      .timestamp-wrap:hover .timestamp-text {
        text-decoration-color: var(--text-primary);
        color: var(--text-primary);
      }
    }

    .tooltip-local {
      color: var(--success-color);
      font-weight: 500;
      font-size: 0.8125rem;
    }

    .tooltip-tz {
      color: var(--text-secondary);
      font-size: 0.6875rem;
      margin-top: 0.1875rem;
    }

    .tooltip-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--brand-border);
      pointer-events: auto;
    }

    .tooltip-copy {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-secondary);
      background: none;
      border: 1px solid var(--brand-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .tooltip-copy:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .tooltip-copy.copied {
      color: var(--success-color);
      border-color: color-mix(in srgb, var(--success-color) 50%, transparent);
    }

    .tooltip-convert {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.25rem 0.5rem;
      color: var(--text-secondary);
      font-size: 0.6875rem;
      text-decoration: none !important;
      background: none;
      border: 1px solid var(--brand-border);
      transition: all 0.15s;
    }

    .tooltip-convert:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .timestamp-text {
      text-decoration: underline;
      text-decoration-style: dotted;
      text-decoration-color: var(--brand-color);
      text-underline-offset: 3px;
      cursor: pointer;
      color: var(--text-secondary);
      transition: text-decoration-color 0.15s, color 0.15s;
    }

    .timestamp-wrap:has(.timestamp-tooltip.active) .timestamp-text {
      text-decoration-color: var(--text-primary);
      color: var(--text-primary) !important;
    }

    .meta-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .source-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      transition: all 0.15s;
    }

    .source-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .btn.btn-source-mobile {
      display: none;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 0;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      color: var(--text-secondary);
    }

    .pill-counter {
      gap: 0.3rem;
      padding: 0.35rem 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      font-size: 0.75rem;
      line-height: inherit;
      margin: 0;
    }

    .pill-counter:hover {
      border-color: var(--text-muted);
      color: var(--text-primary);
    }

    .reset-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--brand-panel);
      border: 1px solid var(--brand-border);
      border-radius: 0;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: inherit;
      margin: 0;
      padding: 0.35rem 0.65rem;
      transition: all 0.2s;
    }

    .reset-btn:hover:not(:disabled) {
      color: var(--text-primary);
      border-color: var(--text-muted);
      background: var(--brand-surface);
    }

    .reset-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      background: var(--brand-surface);
      border-color: var(--brand-border);
      color: var(--text-muted);
    }

    .reset-btn svg {
      flex-shrink: 0;
      transition: transform 0.4s ease;
    }

    .reset-btn:hover:not(:disabled) svg {
      transform: rotate(-360deg);
    }

    /* File grid */
    .file-grid {
      display: grid;
      grid-template-columns: repeat(var(--grid-columns), 1fr);
      gap: 1.25rem;
      list-style: none;
    }

    /* Only force 1-column on mobile */
    @media (max-width: 540px) {
      .file-grid {
        grid-template-columns: 1fr;
      }
    }

    .file-card {
      display: flex;
      flex-direction: column;
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      border-radius: 0;
      overflow: hidden;
      transition: all 0.2s ease;
      position: relative;
    }

    .file-card:hover {
      border-color: var(--text-muted);
    }


    .card-main {
      display: block;
      text-decoration: none;
      color: inherit;
      position: relative;
      z-index: 1;
    }

    /* Action checkmarks */
    .action-check {
      display: none;
      position: absolute;
      right: 0.6rem;
      color: var(--text-muted);
    }

    .file-card.opened .open-action .action-check {
      display: inline;
    }

    .file-card.downloaded .download-action .action-check {
      display: inline;
    }

    /* Fade checkmarks when hovering reset buttons */
    body.reset-preview .action-check {
      opacity: 0.3;
      transition: opacity 0.15s ease;
    }

    body.reset-preview-downloads .download-action .action-check {
      opacity: 0.3;
      transition: opacity 0.15s ease;
    }

    body.reset-preview-opens .open-action .action-check {
      opacity: 0.3;
      transition: opacity 0.15s ease;
    }

    /* Bulk action hover previews */
    body.bulk-download-preview .download-action {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    body.bulk-download-preview .open-action {
      opacity: 0.5;
    }

    body.bulk-open-preview .open-action {
      background: var(--brand-surface);
      color: var(--text-primary);
      opacity: 1;
    }

    body.bulk-open-preview .download-action {
      opacity: 0.5;
    }

    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1px;
      background: var(--brand-border);
      border-top: 1px solid var(--brand-border);
    }

    .card-action {
      flex: 1 1 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.6rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      position: relative;
      transition: all 0.2s;
      background: var(--brand-bg);
    }

    /* Card hover: highlight both action buttons (only when download/open is main action, not lightbox) */
    body[data-main-action="download"] .file-card:hover .card-action,
    body[data-main-action="open"] .file-card:hover .card-action {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    /* Direct button hover always highlights (regardless of main action) */
    .file-card .card-action:hover {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    /* Individual button hover: that one highlighted, sibling fades (only for download/open main actions) */
    body[data-main-action="download"] .file-card:hover .download-action:hover ~ .open-action,
    body[data-main-action="download"] .file-card:hover:has(.download-action:hover) .open-action,
    body[data-main-action="open"] .file-card:hover .download-action:hover ~ .open-action,
    body[data-main-action="open"] .file-card:hover:has(.download-action:hover) .open-action {
      opacity: 0.5;
      background: var(--brand-bg);
      color: var(--text-secondary);
    }

    body[data-main-action="download"] .file-card:hover .open-action:hover ~ .download-action,
    body[data-main-action="download"] .file-card:hover:has(.open-action:hover) .download-action,
    body[data-main-action="open"] .file-card:hover .open-action:hover ~ .download-action,
    body[data-main-action="open"] .file-card:hover:has(.open-action:hover) .download-action {
      opacity: 0.5;
      background: var(--brand-bg);
      color: var(--text-secondary);
    }

    .open-action .arrow-part {
      transition: transform 0.2s;
    }

    .file-card .open-action:hover .arrow-part {
      transform: translate(1px, -1px);
    }

    .download-action .download-arrow {
      transition: transform 0.2s;
    }

    /* Animate download arrow on card hover when download is main action */
    body[data-main-action="download"] .file-card:hover .download-action .download-arrow {
      transform: translateY(1px);
    }

    /* Also animate on direct download button hover (any main action) */
    .file-card .download-action:hover .download-arrow {
      transform: translateY(1px);
    }

    /* But not when open action is hovered (download fades in that case) */
    body[data-main-action="download"] .file-card:hover:has(.open-action:hover) .download-action .download-arrow,
    body[data-main-action="open"] .file-card:hover:has(.open-action:hover) .download-action .download-arrow {
      transform: translateY(0);
    }


    .thumbnail-container {
      aspect-ratio: 16 / 10;
      background: var(--brand-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .lightbox-trigger {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s, background 0.15s;
      z-index: 20;
    }

    /* Card hover shows lightbox trigger in full hover state (since lightbox is default action) */
    .file-card:hover .lightbox-trigger {
      opacity: 1;
      background: rgba(255, 255, 255, 0.9);
      color: #111;
    }

    .lightbox-trigger:hover,
    .lightbox-trigger:focus {
      opacity: 1;
      background: rgba(255, 255, 255, 0.9);
      color: #111;
    }

    .lightbox-trigger:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: var(--image-fit);
    }

    .fallback-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--text-muted);
    }

    .fallback-icon svg {
      width: 48px;
      height: 48px;
    }

    .file-info {
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .file-name {
      font-weight: 500;
      color: var(--text-primary);
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }


    /* Actions */
    .actions {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--brand-border);
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
    }

    .actions-left {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .actions-right {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: var(--brand-color);
      color: white;
    }

    .btn-primary:hover {
      filter: brightness(0.85);
      box-shadow: 0 0 20px -5px ${env.BRAND_COLOR}80;
    }

    .btn-primary .download-arrow {
      transition: transform 0.2s;
    }

    .btn-primary:hover .download-arrow {
      transform: translateY(1px);
    }

    .btn-secondary {
      background: var(--brand-surface);
      color: var(--text-primary);
      border: 1px solid var(--brand-border);
    }

    .btn-secondary:hover {
      background: var(--brand-panel);
      border-color: var(--text-muted);
    }

    .btn-secondary .grid-icon {
      transition: transform 0.2s;
    }

    .btn-secondary:hover .grid-icon {
      transform: scale(1.15);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--brand-border);
      margin-left: auto;
    }

    .btn-ghost:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
      background: var(--brand-surface);
    }

    .btn-ghost .arrow-part {
      transition: transform 0.2s;
    }

    .btn-ghost:hover .arrow-part {
      transform: translate(2px, -2px);
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--brand-border);
      margin-top: auto;
    }

    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .footer-inner {
        padding: 1rem 1.5rem;
      }
    }

    .footer-version {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: '${env.FONT_DISPLAY}', monospace;
    }

    .footer-link {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: '${env.FONT_DISPLAY}', monospace;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-link:hover {
      color: var(--link-hover-color);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .ts-long {
        display: none;
      }

      .ts-short {
        display: inline;
      }

      .actions {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
      }

      .actions-left {
        flex-direction: column;
        align-items: stretch;
      }

      .actions-right {
        justify-content: center;
      }

      .source-btn {
        display: none;
      }

      .btn.btn-source-mobile {
        display: inline-flex;
        background: transparent;
        border: 1px solid var(--brand-border);
        color: var(--text-secondary);
      }

      .btn.btn-source-mobile:hover {
        background: var(--brand-surface);
        border-color: var(--text-muted);
        color: var(--text-primary);
        box-shadow: none;
      }

      .divider, .page-title {
        display: none;
      }
    }

    /* Error state */
    .error-container {
      max-width: 500px;
      margin: 4rem auto;
      text-align: center;
      padding: 2rem;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    /* Grid selector dropdown */
    .grid-selector {
      position: relative;
      display: inline-flex;
      align-self: stretch;
    }

    .grid-selector-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      height: 100%;
      font-size: 0.75rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-secondary);
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .grid-selector-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .grid-selector-btn svg {
      flex-shrink: 0;
    }

    .grid-selector-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      z-index: 100;
      min-width: 120px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-4px);
      transition: opacity 0.15s, visibility 0.15s, transform 0.15s;
    }

    .grid-selector.open .grid-selector-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .grid-selector-menu button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      font-family: inherit;
      color: var(--text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .grid-selector-menu button:hover {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    .grid-selector-menu button.active {
      color: var(--text-primary);
      font-weight: 500;
    }

    .grid-selector-menu button .check-icon {
      margin-left: auto;
      opacity: 0;
    }

    .grid-selector-menu button.active .check-icon {
      opacity: 1;
    }

    /* Hide grid selector on mobile (always 1 column anyway) */
    @media (max-width: 540px) {
      .grid-selector {
        display: none;
      }
    }

    /* Lightbox */
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      outline: none;
    }

    .lightbox.active {
      opacity: 1;
      visibility: visible;
    }

    .lightbox-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
    }

    .lightbox-container {
      position: relative;
      max-width: calc(100vw - 3rem);
      max-height: calc(100vh - 3rem);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .lightbox-content {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      max-height: calc(100vh - 6rem);
    }

    .lightbox-content img,
    .lightbox-content video {
      max-width: 100%;
      max-height: calc(100vh - 6rem);
      object-fit: contain;
      border-radius: 0;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .lightbox-content video {
      background: #000;
    }

    .lightbox-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%);
      z-index: 10;
    }

    .lightbox-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      flex: 1;
    }

    .lightbox-header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .lightbox-counter {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.7);
      font-family: var(--font-display), monospace;
      flex-shrink: 0;
    }

    .lightbox-download,
    .lightbox-share {
      position: fixed;
      bottom: 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
      box-sizing: border-box;
      color: var(--text-primary);
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s;
      z-index: 10;
    }

    .lightbox-download {
      right: calc(50% + 0.25rem);
    }

    .lightbox-share {
      left: calc(50% + 0.25rem);
    }

    .lightbox-download:hover,
    .lightbox-share:hover {
      background: var(--brand-surface);
      border-color: var(--text-muted);
    }

    .lightbox-share.copied {
      color: var(--success-color);
      border-color: var(--success-color);
    }

    .lightbox-filename {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .lightbox-meta {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
    }

    .lightbox-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      cursor: pointer;
      transition: all 0.15s;
    }

    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .lightbox-close:focus {
      outline: none;
    }

    .lightbox-close:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    /* Mobile: hide meta */
    @media (max-width: 640px) {
      .lightbox-meta {
        display: none;
      }
    }

    .lightbox-nav {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      cursor: pointer;
      transition: all 0.15s;
    }

    .lightbox-nav:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .lightbox-nav:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .lightbox-nav.prev {
      left: 1rem;
    }

    .lightbox-nav.next {
      right: 1rem;
    }

  </style>
</head>
<body data-main-action="${getMainAction(env)}">
  <a href="#main-content" class="skip-link">Skip to content</a>
  
  <!-- Screen reader announcements -->
  <div id="sr-status" aria-live="polite" class="sr-only"></div>
  <div id="download-status" aria-live="assertive" class="sr-only"></div>
  
  <header>
    <div class="header-inner">
      <div class="logo-group">
        <a href="${env.COMPANY_URL}" target="_blank" rel="noopener noreferrer nofollow" class="logo-link">
          ${logoHtml}
        </a>
        <div class="divider"></div>
        <span class="page-title">ATTACHMENTS</span>
      </div>
      ${enableShareButton ? `<button id="share-btn" class="share-btn" aria-label="Copy link to clipboard">
        <svg class="share-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        <svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span class="share-text" aria-hidden="true">Share</span>
      </button>` : ''}
    </div>
  </header>

  <main id="main-content">
    <div class="content-header">
      <h1 class="sr-only">File Attachments</h1>
      <div class="meta-row">
        <div class="meta-left">
          ${pageSlug ? `<span class="meta-label">From</span> <a href="${env.COMPANY_URL}/${pageSlug}" target="_blank" rel="noopener noreferrer nofollow">/<span class="slug-text">${pageSlug}</span></a>` : ''}${timestamp ? `${pageSlug ? ' <span class="meta-label">on</span> ' : ''}<span class="timestamp-wrap" id="timestamp-wrap" data-ts="${timestamp}" tabindex="0" role="button" aria-expanded="false" aria-haspopup="true">
            <span class="timestamp-text"><span class="ts-long">${formatTimestamp(timestamp)}</span><span class="ts-short">${formatTimestampShort(timestamp)}</span></span>
            <div class="timestamp-tooltip" id="timestamp-tooltip" role="tooltip">
              <div class="tooltip-local" id="tooltip-local"></div>
              <div class="tooltip-tz" id="tooltip-tz"></div>
              <div class="tooltip-actions">
                <button class="tooltip-copy" id="tooltip-copy" aria-label="Copy UTC time to clipboard">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
                <a href="#" class="tooltip-convert" id="tooltip-convert" target="_blank" rel="noopener noreferrer" aria-label="Convert time to other timezones">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  <span aria-hidden="true">Convert</span>
                </a>
              </div>
            </div>
          </span>
          ` : ''}
        </div>
        ${count > 1 ? `<div class="meta-right">
          <div class="grid-selector" id="grid-selector">
            <button class="grid-selector-btn" aria-haspopup="true" aria-expanded="false" aria-label="Change grid columns">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span class="grid-selector-value">${getDefaultGridColumns(env)}</span>
            </button>
            <div class="grid-selector-menu" role="menu">
              <button role="menuitem" data-cols="1">1 Column <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
              <button role="menuitem" data-cols="2">2 Columns <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
              <button role="menuitem" data-cols="3">3 Columns <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
              <button role="menuitem" data-cols="4">4 Columns <svg class="check-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg></button>
            </div>
          </div>
          <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" class="source-btn" title="View original Uploadcare URL">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Source
          </a>
        </div>` : ''}
      </div>
    </div>

    <ul class="file-grid" role="list">
      ${fileCards}
    </ul>

    ${count > 1 && (enableZipDownload || enableOpenAll) ? `<div class="actions">
      <div class="actions-left">
        ${enableZipDownload ? `<button onclick="downloadAllFiles()" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line class="download-arrow" x1="12" y1="11" x2="12" y2="17"></line><polyline class="download-arrow" points="9 14 12 17 15 14"></polyline></svg>
          Download ZIP (${count} files)
        </button>` : ''}
        ${enableOpenAll ? `<button onclick="openAllFiles()" class="btn btn-secondary">
          <svg class="grid-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          Open All in Tabs
        </button>` : ''}
        <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-source-mobile" title="View original Uploadcare URL">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          View Source
        </a>
      </div>
      <div class="actions-right">
        <button id="downloaded-pill" class="pill pill-counter" style="display:none;" onclick="resetDownloaded()" aria-label="Clear download history">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          <span id="downloaded-count" aria-hidden="true">0</span>
          <span class="sr-only">files downloaded</span>
        </button>
        <button id="opened-pill" class="pill pill-counter" style="display:none;" onclick="resetOpenedOnly()" aria-label="Clear opened files history">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          <span id="opened-count" aria-hidden="true">0</span>
          <span class="sr-only">files opened</span>
        </button>
        <button id="reset-btn" onclick="resetAll()" class="reset-btn" aria-label="Clear all download and open history" disabled>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          <span aria-hidden="true">Reset All</span>
        </button>
        <span class="pill" aria-label="${count} files total">${count} files</span>
      </div>
    </div>` : ''}
  </main>

  <footer>
    <div class="footer-inner">
      <span class="footer-version">Attachment Viewer v${VERSION}</span>
      <a href="${env.COMPANY_URL}" target="_blank" rel="noopener noreferrer nofollow" class="footer-link">${companyDomain}</a>
    </div>
  </footer>

  ${isLightboxEnabled(env) ? `<div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Image viewer" tabindex="-1" data-page-slug="${pageSlug}" data-timestamp="${timestamp || ''}">
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-header">
      <div class="lightbox-header-left">
        <span class="lightbox-counter"></span>
        <span class="lightbox-filename"></span>
      </div>
      <div class="lightbox-header-right">
        <span class="lightbox-meta"></span>
        <button class="lightbox-close" aria-label="Close viewer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
    <a class="lightbox-download" href="" download aria-label="Download file">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      Download
    </a>
    <button class="lightbox-share" aria-label="Copy link to this file">
      <svg class="share-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      <svg class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><polyline points="20 6 9 17 4 12"></polyline></svg>
      Share
    </button>
    <div class="lightbox-container">
      <button class="lightbox-nav prev" aria-label="Previous image">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <div class="lightbox-content"></div>
      <button class="lightbox-nav next" aria-label="Next image">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  </div>` : ''}

  ${enableZipDownload ? `<script src="${getJsZipUrl(env)}"></script>` : ''}
  <script>
    // Screen reader announcements helper
    function announce(message, assertive = false) {
      const el = document.getElementById(assertive ? 'download-status' : 'sr-status');
      if (el) {
        el.textContent = message;
        // Clear after announcement to allow repeated announcements
        setTimeout(() => { el.textContent = ''; }, 1000);
      }
    }

    const fileUrls = [
      ${Array.from({ length: count }, (_, i) => `'${baseUrl}/nth/${i}/'`).join(',\n      ')}
    ];
    const groupId = '${groupId}';
    const openedKey = 'attachments-opened-' + groupId;
    const downloadedKey = 'attachments-downloaded-' + groupId;

    // Get opened/downloaded files from sessionStorage (resets on tab close)
    function getOpenedFiles() {
      try {
        return JSON.parse(sessionStorage.getItem(openedKey) || '[]');
      } catch { return []; }
    }

    function getDownloadedFiles() {
      try {
        return JSON.parse(sessionStorage.getItem(downloadedKey) || '[]');
      } catch { return []; }
    }

    function markFileOpened(index) {
      const opened = getOpenedFiles();
      if (!opened.includes(index)) {
        opened.push(index);
        sessionStorage.setItem(openedKey, JSON.stringify(opened));
      }
      updateStates();
    }

    function markFileDownloaded(index) {
      const downloaded = getDownloadedFiles();
      if (!downloaded.includes(index)) {
        downloaded.push(index);
        sessionStorage.setItem(downloadedKey, JSON.stringify(downloaded));
      }
      updateStates();
    }

    function updateStates() {
      const opened = getOpenedFiles();
      const downloaded = getDownloadedFiles();
      document.querySelectorAll('.file-card').forEach((card, i) => {
        card.classList.toggle('opened', opened.includes(i));
        card.classList.toggle('downloaded', downloaded.includes(i));
      });
      updateCounter();
    }

    function updateCounter() {
      const opened = getOpenedFiles();
      const downloaded = getDownloadedFiles();
      
      const openedCount = document.getElementById('opened-count');
      const openedPill = document.getElementById('opened-pill');
      const downloadedCount = document.getElementById('downloaded-count');
      const downloadedPill = document.getElementById('downloaded-pill');
      const resetBtn = document.getElementById('reset-btn');
      
      if (openedCount) openedCount.textContent = opened.length;
      if (openedPill) openedPill.style.display = opened.length > 0 ? 'inline-flex' : 'none';
      
      if (downloadedCount) downloadedCount.textContent = downloaded.length;
      if (downloadedPill) downloadedPill.style.display = downloaded.length > 0 ? 'inline-flex' : 'none';
      
      if (resetBtn) {
        resetBtn.disabled = opened.length === 0 && downloaded.length === 0;
      }
    }

    function resetOpenedOnly() {
      sessionStorage.removeItem(openedKey);
      updateStates();
      announce('Opened files history cleared');
    }

    function resetDownloaded() {
      sessionStorage.removeItem(downloadedKey);
      updateStates();
      announce('Download history cleared');
    }

    function resetAll() {
      sessionStorage.removeItem(openedKey);
      sessionStorage.removeItem(downloadedKey);
      updateStates();
      announce('All history cleared');
    }

    // Track clicks on file cards
    const mainAction = '${getMainAction(env)}';
    document.querySelectorAll('.file-card').forEach((card) => {
      const index = parseInt(card.dataset.index, 10);
      const cardMain = card.querySelector('.card-main');
      const hasLightbox = card.dataset.lightbox === 'true';
      // For card-main clicks: lightbox mode doesn't trigger download/open tracking (lightbox handles that),
      // but for non-lightbox files or when mainAction is download/open, track appropriately
      cardMain.addEventListener('click', () => {
        if (mainAction === 'lightbox' && hasLightbox) {
          // Lightbox opens - no download/open tracking here (user may or may not download)
          return;
        }
        // Non-lightbox card in lightbox mode falls back to download
        // Or explicit download/open mode
        if (mainAction === 'open') {
          markFileOpened(index);
        } else {
          markFileDownloaded(index);
        }
      });
      card.querySelector('.open-action').addEventListener('click', () => markFileOpened(index));
      card.querySelector('.download-action').addEventListener('click', () => markFileDownloaded(index));
    });

    // Initialize on load
    updateStates();

    // Reset button hover previews
    const resetBtn = document.getElementById('reset-btn');
    const downloadedPill = document.getElementById('downloaded-pill');
    const openedPill = document.getElementById('opened-pill');

    if (resetBtn) {
      resetBtn.addEventListener('mouseenter', () => {
        if (!resetBtn.disabled) document.body.classList.add('reset-preview');
      });
      resetBtn.addEventListener('mouseleave', () => {
        document.body.classList.remove('reset-preview');
      });
    }

    if (downloadedPill) {
      downloadedPill.addEventListener('mouseenter', () => {
        document.body.classList.add('reset-preview-downloads');
      });
      downloadedPill.addEventListener('mouseleave', () => {
        document.body.classList.remove('reset-preview-downloads');
      });
    }

    if (openedPill) {
      openedPill.addEventListener('mouseenter', () => {
        document.body.classList.add('reset-preview-opens');
      });
      openedPill.addEventListener('mouseleave', () => {
        document.body.classList.remove('reset-preview-opens');
      });
    }

    // Share button (header) - always copies base gallery URL without ?file param
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        try {
          // Get base URL without file param
          const url = new URL(window.location.href);
          url.searchParams.delete('file');
          await navigator.clipboard.writeText(url.toString());
          shareBtn.classList.add('copied');
          shareBtn.querySelector('.share-text').textContent = 'Copied!';
          announce('Link copied to clipboard');
          setTimeout(() => {
            shareBtn.classList.remove('copied');
            shareBtn.querySelector('.share-text').textContent = 'Share';
          }, 2000);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      });
    }

    // Bulk action hover previews
    const downloadZipBtn = document.querySelector('.btn-primary');
    const openAllBtn = document.querySelector('.btn-secondary');

    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('mouseenter', () => {
        document.body.classList.add('bulk-download-preview');
      });
      downloadZipBtn.addEventListener('mouseleave', () => {
        document.body.classList.remove('bulk-download-preview');
      });
    }

    if (openAllBtn) {
      openAllBtn.addEventListener('mouseenter', () => {
        document.body.classList.add('bulk-open-preview');
      });
      openAllBtn.addEventListener('mouseleave', () => {
        document.body.classList.remove('bulk-open-preview');
      });
    }

    // Timestamp tooltip functionality
    (function() {
      const wrap = document.getElementById('timestamp-wrap');
      const tooltip = document.getElementById('timestamp-tooltip');
      if (!wrap || !tooltip) return;

      const ts = parseInt(wrap.dataset.ts, 10);
      const date = new Date(ts * 1000);

      // Format UTC time for copying
      const utcStr = date.toLocaleString('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) + ' UTC';

      // Format local time
      const localStr = date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Get timezone name
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Populate tooltip
      document.getElementById('tooltip-local').textContent = localStr;
      document.getElementById('tooltip-tz').textContent = tzName.replace(/_/g, ' ');

      // Build timeanddate.com link
      const isoDate = date.toISOString().replace(/[-:]/g, '').split('.')[0];
      const convertUrl = 'https://www.timeanddate.com/worldclock/fixedtime.html?iso=' + isoDate + '&p1=1440';
      document.getElementById('tooltip-convert').href = convertUrl;

      // Toggle tooltip and update aria-expanded
      function toggleTooltip(show) {
        const isOpen = show !== undefined ? show : !tooltip.classList.contains('active');
        tooltip.classList.toggle('active', isOpen);
        wrap.setAttribute('aria-expanded', isOpen.toString());
      }

      // Copy UTC functionality
      const copyBtn = document.getElementById('tooltip-copy');
      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(utcStr);
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          announce('UTC time copied to clipboard');
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
          }, 1500);
        } catch (err) {
          console.error('Copy failed:', err);
        }
      });

      // Mobile/touch: tap to toggle (desktop hover is handled by CSS)
      wrap.addEventListener('click', (e) => {
        // Don't interfere with copy/convert button clicks
        if (e.target.closest('.tooltip-copy') || e.target.closest('.tooltip-convert')) return;
        e.stopPropagation();
        toggleTooltip();
      });

      // Keyboard accessibility: Enter/Space to toggle, Escape to close
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTooltip();
        } else if (e.key === 'Escape') {
          toggleTooltip(false);
        }
      });

      // Close when clicking elsewhere
      document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) {
          toggleTooltip(false);
        }
      });

      // Close on Escape key anywhere
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tooltip.classList.contains('active')) {
          toggleTooltip(false);
          wrap.focus();
        }
      });
    })();

    function openAllFiles() {
      fileUrls.forEach((url, i) => {
        window.open(url, '_blank');
        markFileOpened(i);
      });
    }

    function getExtFromContentType(contentType) {
      const extMap = {
        'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
        'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/bmp': '.bmp',
        'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
        'application/pdf': '.pdf', 'text/plain': '.txt', 'text/csv': '.csv',
        'application/zip': '.zip', 'application/json': '.json',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
      };
      return extMap[contentType.split(';')[0]] || '';
    }

    async function downloadAllFiles() {
      const btn = document.querySelector('.btn-primary');
      const originalText = btn.innerHTML;
      const spinnerSvg = '<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
      
      btn.disabled = true;
      btn.innerHTML = spinnerSvg + ' Preparing...';
      announce('Preparing ZIP download', true);

      try {
        const zip = new JSZip();
        
        // Fetch all files
        for (let i = 0; i < fileUrls.length; i++) {
          btn.innerHTML = spinnerSvg + ' Fetching ' + (i + 1) + '/' + fileUrls.length;
          announce('Downloading file ' + (i + 1) + ' of ' + fileUrls.length, true);
          
          const response = await fetch(fileUrls[i]);
          const blob = await response.blob();
          const contentType = response.headers.get('Content-Type') || '';
          const ext = getExtFromContentType(contentType);
          const filename = 'attachment-' + (i + 1) + ext;
          
          zip.file(filename, blob);
        }
        
        // Generate zip
        btn.innerHTML = spinnerSvg + ' Zipping...';
        announce('Creating ZIP archive', true);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        // Download the zip
        const blobUrl = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'attachments-${count}-files.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        btn.innerHTML = originalText;
        announce('Download complete', true);
      } catch (err) {
        console.error('Download failed:', err);
        btn.innerHTML = '❌ Download failed';
        announce('Download failed', true);
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      }
      
      btn.disabled = false;
    }

    // Grid selector functionality
    (function() {
      const selector = document.getElementById('grid-selector');
      if (!selector) return;
      
      const btn = selector.querySelector('.grid-selector-btn');
      const menu = selector.querySelector('.grid-selector-menu');
      const valueDisplay = selector.querySelector('.grid-selector-value');
      const menuItems = menu.querySelectorAll('[data-cols]');
      
      // Get current column count from CSS variable
      function getCurrentCols() {
        return getComputedStyle(document.documentElement).getPropertyValue('--grid-columns').trim() || '${getDefaultGridColumns(env)}';
      }
      
      // Update active state in menu
      function updateActiveState() {
        const currentCols = getCurrentCols();
        menuItems.forEach(item => {
          item.classList.toggle('active', item.dataset.cols === currentCols);
        });
        valueDisplay.textContent = currentCols;
      }
      
      // Set column count
      function setColumns(cols) {
        document.documentElement.style.setProperty('--grid-columns', cols);
        localStorage.setItem('gallery-grid-columns', cols);
        updateActiveState();
        selector.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        announce(cols + ' column' + (cols === '1' ? '' : 's') + ' view');
      }
      
      // Toggle menu
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = selector.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen.toString());
      });
      
      // Handle menu item clicks
      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          setColumns(item.dataset.cols);
        });
      });
      
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!selector.contains(e.target)) {
          selector.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Keyboard navigation
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          selector.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Initialize active state
      updateActiveState();
    })();

    // Lightbox functionality
    (function() {
      const lightbox = document.getElementById('lightbox');
      if (!lightbox) return;
      
      const content = lightbox.querySelector('.lightbox-content');
      const downloadBtn = lightbox.querySelector('.lightbox-download');
      const shareBtn = lightbox.querySelector('.lightbox-share');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      const prevBtn = lightbox.querySelector('.lightbox-nav.prev');
      const nextBtn = lightbox.querySelector('.lightbox-nav.next');
      const counter = lightbox.querySelector('.lightbox-counter');
      const filenameEl = lightbox.querySelector('.lightbox-filename');
      const metaEl = lightbox.querySelector('.lightbox-meta');
      
      // Get all lightbox-enabled cards
      const cards = Array.from(document.querySelectorAll('[data-lightbox="true"]'));
      let currentIndex = -1;
      let previousFocus = null;
      
      function openLightbox(index) {
        if (index < 0 || index >= cards.length) return;
        
        const card = cards[index];
        const src = card.dataset.lightboxSrc;
        const downloadUrl = card.dataset.lightboxDownload;
        const isVideo = card.dataset.lightboxVideo === 'true';
        const name = card.dataset.lightboxName;
        
        currentIndex = index;
        previousFocus = document.activeElement;
        
        // Clear previous content
        content.innerHTML = '';
        
        // Create media element
        if (isVideo) {
          const video = document.createElement('video');
          video.src = src;
          video.controls = true;
          video.autoplay = true;
          video.setAttribute('aria-label', name);
          content.appendChild(video);
        } else {
          const img = document.createElement('img');
          img.src = src;
          img.alt = name;
          content.appendChild(img);
        }
        
        // Update download action
        downloadBtn.href = downloadUrl;
        
        // Update counter
        if (counter) {
          counter.textContent = (index + 1) + ' / ' + cards.length;
        }
        
        // Update filename
        if (filenameEl) {
          filenameEl.textContent = name;
        }
        
        // Update meta (from page slug and timestamp)
        if (metaEl) {
          const pageSlug = lightbox.dataset.pageSlug;
          const ts = lightbox.dataset.timestamp;
          let metaText = '';
          if (pageSlug) {
            metaText = 'From /' + pageSlug;
          }
          if (ts) {
            const date = new Date(parseInt(ts, 10) * 1000);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            metaText += (metaText ? ' on ' : '') + dateStr;
          }
          metaEl.textContent = metaText;
          metaEl.style.display = metaText ? '' : 'none';
        }
        
        // Update nav buttons
        if (prevBtn) prevBtn.disabled = index === 0;
        if (nextBtn) nextBtn.disabled = index === cards.length - 1;
        
        // Show lightbox
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Update URL with file param (without adding to history)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('file', String(index));
        history.replaceState(null, '', newUrl.toString());
        
        // Focus lightbox container for immediate keyboard nav (arrow keys)
        setTimeout(() => lightbox.focus(), 100);
        
        announce('Viewing ' + name + ', ' + (index + 1) + ' of ' + cards.length);
      }
      
      function closeLightbox() {
        // Stop any playing video
        const video = content.querySelector('video');
        if (video) video.pause();
        
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        currentIndex = -1;
        
        // Remove file param from URL (without adding to history)
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('file');
        history.replaceState(null, '', newUrl.toString());
        
        // Restore focus
        if (previousFocus) {
          previousFocus.focus();
          previousFocus = null;
        }
      }
      
      // Share button - copy gallery URL with file param
      if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
          const url = new URL(window.location.href);
          url.searchParams.set('file', String(currentIndex));
          try {
            await navigator.clipboard.writeText(url.toString());
            shareBtn.classList.add('copied');
            shareBtn.querySelector('.share-icon').style.display = 'none';
            shareBtn.querySelector('.check-icon').style.display = '';
            announce('Link copied to clipboard');
            setTimeout(() => {
              shareBtn.classList.remove('copied');
              shareBtn.querySelector('.share-icon').style.display = '';
              shareBtn.querySelector('.check-icon').style.display = 'none';
            }, 2000);
          } catch (err) {
            console.error('Copy failed:', err);
          }
        });
      }
      
      function navigate(direction) {
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < cards.length) {
          openLightbox(newIndex);
        }
      }
      
      // Event listeners
      closeBtn.addEventListener('click', closeLightbox);
      lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
      
      if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));
      
      // Keyboard navigation
      lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeLightbox();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigate(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigate(1);
        } else if (e.key === 'Tab') {
          // Focus trap
          const focusable = lightbox.querySelectorAll('button:not(:disabled), a[href]');
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          
          // If focus is on lightbox container (not a button), move to first/last focusable
          if (document.activeElement === lightbox) {
            e.preventDefault();
            if (e.shiftKey) {
              last.focus();
            } else {
              first.focus();
            }
          } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      });
      
      // Wire up lightbox trigger button clicks
      document.querySelectorAll('.lightbox-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const index = parseInt(btn.dataset.lightboxIndex, 10);
          openLightbox(index);
        });
      });
      
      // Wire up card-main clicks to open lightbox for previewable files (only when mainAction is lightbox)
      const mainAction = '${getMainAction(env)}';
      if (mainAction === 'lightbox') {
        document.querySelectorAll('.file-card[data-lightbox="true"] .card-main').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const card = link.closest('.file-card');
            const cardIndex = cards.indexOf(card);
            if (cardIndex >= 0) {
              openLightbox(cardIndex);
            }
          });
        });
      }
      
      // Make openLightbox available globally for potential external use
      window.openLightbox = openLightbox;
      window.closeLightbox = closeLightbox;
      
      // Auto-open lightbox if ?file=N param is present
      const urlParams = new URLSearchParams(window.location.search);
      const fileParam = urlParams.get('file');
      if (fileParam !== null) {
        const fileIndex = parseInt(fileParam, 10);
        if (!isNaN(fileIndex) && fileIndex >= 0 && fileIndex < cards.length) {
          // Delay slightly to ensure DOM is ready
          setTimeout(() => openLightbox(fileIndex), 100);
        }
      }
    })();
  </script>
</body>
</html>`;
}

function generateErrorHtml(env: Env, error: string): string {
  // Extract domain from company URL for display
  const companyDomain = env.COMPANY_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Logo HTML - prefer SVG, fall back to URL
  const logoHtml = env.LOGO_SVG 
    ? env.LOGO_SVG 
    : env.LOGO_URL 
      ? `<img src="${env.LOGO_URL}" alt="${env.COMPANY_NAME}" class="logo-img" style="height: 18px; width: auto;" />`
      : `<span class="logo-text" style="font-weight: 600; font-size: 1rem;">${env.COMPANY_NAME}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <meta name="description" content="File attachments for ${env.COMPANY_NAME} form submissions.">
  <title>Error - ${env.COMPANY_NAME} Attachments</title>
  <link rel="icon" href="${env.FAVICON_URL}">
  ${getFontLoadingHtml(env)}
  <style>
    :root {
      --brand-color: ${env.BRAND_COLOR};
      --success-color: ${getSuccessColor(env)};
      --link-hover-color: ${getLinkHoverColor(env)};
      --brand-bg: ${getBgColor(env)};
      --brand-panel: ${getPanelColor(env)};
      --brand-surface: ${getSurfaceColor(env)};
      --brand-border: ${getBorderColor(env)};
      --text-primary: ${getTextColor(env)};
      --text-secondary: ${getTextSecondaryColor(env)};
      --text-muted: ${getTextMutedColor(env)};
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: '${env.FONT_BODY}', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--brand-bg);
      background-image: radial-gradient(circle at 50% 0%, ${env.BRAND_COLOR}08, transparent 40%);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: ${getHeaderBg(env)};
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--brand-border);
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 64px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-link {
      position: relative;
      display: flex;
      align-items: center;
    }

    .logo-svg {
      height: 18px;
      width: auto;
      color: var(--text-primary);
      position: relative;
      z-index: 10;
      transition: color 0.3s;
    }

    .logo-link:hover .logo-svg { color: var(--link-hover-color); }

    .divider {
      height: 24px;
      width: 1px;
      background: var(--brand-border);
    }

    .page-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .error-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .error-card {
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      padding: 3rem 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    }

    .error-icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: color-mix(in srgb, var(--brand-color) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--brand-color) 30%, transparent);
      margin-bottom: 1.5rem;
    }

    .error-icon-wrap svg {
      width: 32px;
      height: 32px;
      color: var(--brand-color);
    }

    .error-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }

    .error-code {
      display: inline-block;
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      padding: 0.25rem 0.5rem;
      font-family: '${env.FONT_DISPLAY}', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--brand-color);
      color: white;
      border-radius: 0;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      width: 100%;
    }

    .btn:hover {
      filter: brightness(0.9);
      box-shadow: 0 0 20px -5px ${env.BRAND_COLOR}80;
    }

    .btn svg {
      transition: transform 0.2s;
    }

    .btn:hover svg {
      transform: translateX(2px);
    }

    footer {
      border-top: 1px solid var(--brand-border);
    }

    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .footer-inner {
        padding: 1rem 1.5rem;
      }
    }

    .footer-version {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: '${env.FONT_DISPLAY}', monospace;
    }

    .footer-link {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: '${env.FONT_DISPLAY}', monospace;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-link:hover {
      color: var(--link-hover-color);
    }

    @media (max-width: 640px) {
      .divider, .page-title { display: none; }
      .error-card { padding: 2rem 1.5rem; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="${env.COMPANY_URL}" target="_blank" rel="noopener noreferrer nofollow" class="logo-link">
        ${logoHtml}
      </a>
      <div class="divider"></div>
      <span class="page-title">ATTACHMENTS</span>
    </div>
  </header>

  <div class="error-wrapper">
    <div class="error-card">
      <div class="error-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <h1 class="error-title">Unable to Load Attachments</h1>
      <p class="error-message">${error}</p>
      <a href="${env.COMPANY_URL}" rel="noopener noreferrer nofollow" class="btn">
        Go to ${env.COMPANY_NAME}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </a>
    </div>
  </div>

  <footer>
    <div class="footer-inner">
      <span class="footer-version">Attachment Viewer v${VERSION}</span>
      <a href="${env.COMPANY_URL}" target="_blank" rel="noopener noreferrer nofollow" class="footer-link">${companyDomain}</a>
    </div>
  </footer>
</body>
</html>`;
}

// UC Gallery Connect script served from worker (CDN cached)
// The WORKER_URL placeholder is replaced at runtime with env.WORKER_URL
const UC_GALLERY_CONNECT_SCRIPT = `/**
 * Uploadcare Gallery URL Transformer
 * Automatically wraps Uploadcare group URLs with the gallery worker for a better viewing experience.
 */
(function() {
  const WORKER_URL = '__WORKER_URL__';

  function init() {
    const providers = document.querySelectorAll('uc-upload-ctx-provider');
    
    providers.forEach(provider => {
      provider.addEventListener('group-created', (e) => {
        const groupUrl = e.detail?.group?.cdnUrl;
        if (!groupUrl) return;

        const ctxName = provider.getAttribute('ctx-name');
        if (!ctxName) return;

        const input = document.querySelector('input[name="' + ctxName + '"]');
        if (input) {
          const pageSlug = window.location.pathname.replace(/^\\//, '').replace(/\\/$/, '') || 'unknown';
          const timestamp = Math.floor(Date.now() / 1000);
          input.value = WORKER_URL + '?url=' + encodeURIComponent(groupUrl) + '&from=' + encodeURIComponent(pageSlug) + '&ts=' + timestamp;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check endpoint for monitoring
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', version: VERSION }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Serve the UC Gallery Connect script (CDN cached)
    if (url.pathname === '/uc-gallery-connect.js') {
      // Generate script with configured worker URL
      const script = UC_GALLERY_CONNECT_SCRIPT.replace(
        "'__WORKER_URL__'",
        `'${env.WORKER_URL}'`
      );
      return new Response(script, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=UTF-8',
          'Cache-Control': `public, max-age=${getScriptBrowserCacheSeconds(env)}, s-maxage=${getScriptCdnCacheSeconds(env)}`,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get the Uploadcare URL from query param
    const uploadcareUrl = url.searchParams.get('url');
    
    // Get optional metadata params
    const pageSlug = url.searchParams.get('from') || '';
    const tsParam = url.searchParams.get('ts');
    const timestamp = tsParam ? parseInt(tsParam, 10) : null;

    // Validate the URL
    const validation = validateUrl(uploadcareUrl || '', env);

    if (!validation.valid) {
      return new Response(generateErrorHtml(env, validation.error), {
        status: 400,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    const { host, groupId, count } = validation;

    // Fetch file info (filenames) from Uploadcare
    const fileInfos = await fetchFileInfos(host, groupId, count);

    // Generate and return the gallery HTML
    const html = generateHtml(
      env,
      host,
      groupId,
      count,
      uploadcareUrl!,
      pageSlug,
      timestamp,
      fileInfos
    );

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': `public, max-age=${getGalleryCacheSeconds(env)}`
      }
    });
  }
};
