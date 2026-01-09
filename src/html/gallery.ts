/**
 * Gallery page HTML generation
 * 
 * Generates the main gallery page HTML with file cards, styles, and scripts.
 */

import type { Env, FileInfo } from '../types';
import { escapeHtml } from '../utils';
import { getFontLoadingHtml } from '../fonts';
import {
  isFeatureEnabled,
  getMainAction,
  isLightboxEnabled,
  getDefaultGridColumns,
  getJsZipConfig,
  VERSION
} from '../env';
import {
  isImageExtension,
  isVideoExtension,
  isPdfExtension,
  getPreviewType,
  formatTimestamp,
  formatTimestampShort
} from '../files';
import {
  isPdfPreviewEnabled,
  isAudioPreviewEnabled
} from '../env';
import { getFileTypeIconSvg } from '../icons';
import { getStyles } from './styles';
import { getScripts, ScriptOptions } from './scripts';

export function generateHtml(
  env: Env,
  host: string,
  groupId: string,
  count: number,
  originalUrl: string,
  pageSlug: string,
  timestamp: number | null,
  fileInfos: FileInfo[],
  demoMode: boolean = false
): string {
  const baseUrl = `https://${host}/${groupId}~${count}`;
  
  // Escape pageSlug for safe HTML embedding
  const escapedPageSlug = escapeHtml(pageSlug);
  
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
    // Escape HTML entities in filename for safe embedding in HTML
    const escapedName = escapeHtml(displayName);
    
    const downloadUrl = `${fileUrl}/-/inline/no/`;
    
    // Smart thumbnail logic based on file type
    let thumbnailHtml: string;
    if (demoMode) {
      // Demo mode: use file.url directly (no Uploadcare transforms)
      if (isImageExtension(ext)) {
        thumbnailHtml = `<img 
              src="${fileUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\'fallback-icon\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
      } else {
        // Non-images: show icon (demo URLs won't have real thumbnails)
        thumbnailHtml = `<div class="fallback-icon">${getFileTypeIconSvg(ext)}</div>`;
      }
    } else if (isImageExtension(ext)) {
      // Images: use Uploadcare's preview transformation
      const thumbnailUrl = `${baseUrl}/nth/${i}/-/preview/1200x750/-/quality/smart/-/format/auto/`;
      thumbnailHtml = `<img 
              src="${thumbnailUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\'fallback-icon\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
    } else if (isVideoExtension(ext)) {
      // Videos: Uploadcare extracts first frame automatically with preview
      const thumbnailUrl = `${baseUrl}/nth/${i}/-/preview/1200x750/-/format/jpeg/`;
      thumbnailHtml = `<img 
              src="${thumbnailUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\'fallback-icon\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
    } else if (isPdfExtension(ext)) {
      // PDFs: Uploadcare converts first page to image
      const thumbnailUrl = `${baseUrl}/nth/${i}/-/preview/1200x750/-/format/jpeg/`;
      thumbnailHtml = `<img 
              src="${thumbnailUrl}" 
              alt="${escapedName}" 
              class="thumbnail"
              loading="lazy"
              onerror="this.parentElement.innerHTML='<div class=\'fallback-icon\'>${getFileTypeIconSvg(ext).replace(/'/g, "\\'").replace(/"/g, '&quot;')}</div>'"
            />`;
    } else {
      // Non-previewable files: show SVG icon immediately (no wasted network request)
      thumbnailHtml = `<div class="fallback-icon">${getFileTypeIconSvg(ext)}</div>`;
    }
    
    // Lightbox: ALL files can be navigated in lightbox when enabled
    const lightboxEnabled = isLightboxEnabled(env);
    const previewType = getPreviewType(ext, env, isPdfPreviewEnabled(env), isAudioPreviewEnabled(env)); // 'image' | 'video' | 'pdf' | 'audio' | 'icon'
    const canPreviewInline = previewType !== 'icon'; // Can render content inline (not just icon)
    
    // Determine main action for this card
    const mainAction = getMainAction(env);
    // For non-inline-previewable files with lightbox action, fall back to download for card click
    const effectiveAction = (mainAction === 'lightbox' && !canPreviewInline) ? 'download' : mainAction;
    const cardMainHref = effectiveAction === 'open' ? fileUrl : downloadUrl;
    const cardMainTarget = effectiveAction === 'open' ? ' target="_blank" rel="noopener noreferrer"' : '';
    
    // ALL files get lightbox attributes when lightbox is enabled (enables navigation through all files)
    const lightboxAttrs = lightboxEnabled 
      ? ` data-lightbox="true" data-lightbox-src="${fileUrl}" data-lightbox-download="${downloadUrl}" data-lightbox-type="${previewType}" data-lightbox-name="${escapedName}" data-lightbox-ext="${ext}"`
      : '';
    
    // Lightbox trigger button (shown for ALL files when lightbox is enabled)
    const lightboxTriggerHtml = lightboxEnabled 
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
            <span class="file-name" title="${escapedName}">${escapedName}</span>
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

  // Prepare script options
  const scriptOptions: ScriptOptions = {
    baseUrl,
    groupId,
    count,
    fileInfos,
    pageSlug: escapedPageSlug,
    timestamp
  };

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
${getStyles(env)}
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
        <a href="/" class="page-title-link">${env.HEADER_TITLE || 'Attachments'}</a>
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
          ${pageSlug ? `<span class="meta-label">From</span> <a href="${env.COMPANY_URL}/${escapedPageSlug}" target="_blank" rel="noopener noreferrer nofollow">/<span class="slug-text">${escapedPageSlug}</span></a>` : ''}${timestamp ? `${pageSlug ? ' <span class="meta-label">on</span> ' : ''}<span class="timestamp-wrap" id="timestamp-wrap" data-ts="${timestamp}" tabindex="0" role="button" aria-expanded="false" aria-haspopup="true">
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

  ${isLightboxEnabled(env) ? `<div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Image viewer" tabindex="-1" data-page-slug="${escapedPageSlug}" data-timestamp="${timestamp || ''}">
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

  ${enableZipDownload ? (() => {
    const config = getJsZipConfig(env);
    return `<script>
    (function() {
      const primaryUrl = ${JSON.stringify(config.primary)};
      const fallbackUrl = ${JSON.stringify(config.fallback)};
      const integrity = ${JSON.stringify(config.integrity || '')};
      let script = document.createElement('script');
      script.src = primaryUrl;
      if (integrity) {
        script.integrity = integrity;
        script.crossOrigin = 'anonymous';
      }
      script.onerror = function() {
        console.warn('JSZip primary URL failed, trying fallback:', fallbackUrl);
        script = document.createElement('script');
        script.src = fallbackUrl;
        if (integrity) {
          script.integrity = integrity;
          script.crossOrigin = 'anonymous';
        }
        script.onerror = function() {
          console.error('JSZip failed to load from both primary and fallback URLs');
        };
        document.head.appendChild(script);
      };
      document.head.appendChild(script);
    })();
    </script>`;
  })() : ''}
  <script>
${getScripts(env, scriptOptions)}
  </script>
</body>
</html>`;
}
