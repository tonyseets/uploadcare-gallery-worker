/**
 * Gallery page JavaScript
 * 
 * Generates all client-side JavaScript for the gallery page, including
 * lightbox functionality, ZIP downloads, grid selector, and tracking.
 */

import type { Env } from '../types';
import {
  getMainAction,
  isVideoAutoplayEnabled,
  getDefaultGridColumns,
  getJsZipConfig
} from '../env';

export interface ScriptOptions {
  baseUrl: string;
  groupId: string;
  count: number;
  fileInfos: Array<{ index: number; url: string; filename: string; extension: string }>;
  pageSlug: string;
  timestamp: number | null;
}

export function getScripts(env: Env, options: ScriptOptions): string {
  const { baseUrl, groupId, count, fileInfos, pageSlug, timestamp } = options;
  
  return `    // HTML escaping for safe DOM insertion
    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

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
      
      // Client-side icon SVGs for lightbox fallback
      function getIconSvgForExt(ext) {
        const e = ext.toLowerCase();
        // Video
        if (['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v', '3gp'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>';
        }
        // PDF
        if (e === 'pdf') {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>';
        }
        // Audio
        if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
        }
        // Word docs
        if (['doc', 'docx', 'rtf', 'odt'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>';
        }
        // Spreadsheets
        if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="12" y1="9" x2="12" y2="21"></line></svg>';
        }
        // Presentations
        if (['ppt', 'pptx', 'odp', 'key'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
        }
        // Archives
        if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>';
        }
        // Code files
        if (['js', 'ts', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'css', 'html', 'json', 'xml', 'yml', 'yaml', 'sh', 'sql'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
        }
        // Text files
        if (['txt', 'md', 'log'].includes(e)) {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>';
        }
        // Default file icon
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
      }
      
      // Audio player HTML generator
      function createAudioPlayerHtml(src, name) {
        return '<div class="lightbox-audio-player">' +
          '<svg class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
            '<path d="M9 18V5l12-2v13"></path>' +
            '<circle cx="6" cy="18" r="3"></circle>' +
            '<circle cx="18" cy="16" r="3"></circle>' +
          '</svg>' +
          '<div class="audio-filename">' + escapeHtml(name) + '</div>' +
          '<div class="audio-controls">' +
            '<button class="audio-play-btn" aria-label="Play">' +
              '<svg class="play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' +
              '<svg class="pause-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>' +
            '</button>' +
            '<div class="audio-progress"><div class="audio-progress-fill"></div></div>' +
            '<span class="audio-time">0:00 / 0:00</span>' +
          '</div>' +
          '<audio src="' + escapeHtml(src) + '" preload="metadata"></audio>' +
        '</div>';
      }
      
      // Initialize audio player event listeners
      function initAudioPlayer(container) {
        const audio = container.querySelector('audio');
        const playBtn = container.querySelector('.audio-play-btn');
        const playIcon = container.querySelector('.play-icon');
        const pauseIcon = container.querySelector('.pause-icon');
        const progress = container.querySelector('.audio-progress');
        const progressFill = container.querySelector('.audio-progress-fill');
        const timeDisplay = container.querySelector('.audio-time');
        
        function formatTime(sec) {
          if (!isFinite(sec)) return '0:00';
          const m = Math.floor(sec / 60);
          const s = Math.floor(sec % 60).toString().padStart(2, '0');
          return m + ':' + s;
        }
        
        audio.addEventListener('loadedmetadata', () => {
          timeDisplay.textContent = '0:00 / ' + formatTime(audio.duration);
        });
        
        audio.addEventListener('timeupdate', () => {
          const pct = (audio.currentTime / audio.duration) * 100;
          progressFill.style.width = pct + '%';
          timeDisplay.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
        });
        
        audio.addEventListener('ended', () => {
          playIcon.style.display = '';
          pauseIcon.style.display = 'none';
          playBtn.setAttribute('aria-label', 'Play');
        });
        
        playBtn.addEventListener('click', () => {
          if (audio.paused) {
            audio.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = '';
            playBtn.setAttribute('aria-label', 'Pause');
          } else {
            audio.pause();
            playIcon.style.display = '';
            pauseIcon.style.display = 'none';
            playBtn.setAttribute('aria-label', 'Play');
          }
        });
        
        progress.addEventListener('click', (e) => {
          const rect = progress.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          audio.currentTime = pct * audio.duration;
        });
      }
      
      // Stop any playing media in lightbox content
      function stopMedia() {
        const video = content.querySelector('video');
        const audio = content.querySelector('audio');
        if (video) video.pause();
        if (audio) audio.pause();
      }
      
      function openLightbox(index) {
        if (index < 0 || index >= cards.length) return;
        
        const card = cards[index];
        const src = card.dataset.lightboxSrc;
        const downloadUrl = card.dataset.lightboxDownload;
        const previewType = card.dataset.lightboxType || 'icon';
        const name = card.dataset.lightboxName;
        const ext = card.dataset.lightboxExt || '';
        
        // Stop any previously playing media before switching
        stopMedia();
        
        currentIndex = index;
        previousFocus = document.activeElement;
        
        // Clear previous content
        content.innerHTML = '';
        
        // Create appropriate element based on preview type
        if (previewType === 'image') {
          const img = document.createElement('img');
          img.src = src;
          img.alt = name;
          content.appendChild(img);
        } else if (previewType === 'video') {
          const video = document.createElement('video');
          video.src = src;
          video.controls = true;
          video.autoplay = ${isVideoAutoplayEnabled(env)};
          video.setAttribute('aria-label', name);
          content.appendChild(video);
        } else if (previewType === 'pdf') {
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.title = name;
          content.appendChild(iframe);
        } else if (previewType === 'audio') {
          content.innerHTML = createAudioPlayerHtml(src, name);
          initAudioPlayer(content);
        } else {
          // Icon fallback for non-previewable files
          const fallback = document.createElement('div');
          fallback.className = 'lightbox-icon-fallback';
          fallback.innerHTML = getIconSvgForExt(ext) + '<span class="fallback-filename">' + escapeHtml(name) + '</span>';
          content.appendChild(fallback);
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
        
        // Update nav buttons - hide at ends instead of disabling
        if (prevBtn) prevBtn.classList.toggle('hidden', index === 0);
        if (nextBtn) nextBtn.classList.toggle('hidden', index === cards.length - 1);
        
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
        // Stop any playing media
        stopMedia();
        
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
      
      // Wire up card-main clicks to open lightbox (only when mainAction is lightbox)
      // ALL files open in lightbox when clicked - icon-only files show their type icon
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
`;
}
