/**
 * Uploadcare Gallery URL Transformer v1.6.0
 * 
 * This is a REFERENCE COPY. The canonical version is embedded in src/index.ts.
 * 
 * The script is served from the worker at /uc-gallery-connect.js and automatically
 * uses the WORKER_URL configured in wrangler.toml [vars].
 * 
 * Usage (add to your site's footer):
 * <script src="https://your-worker.workers.dev/uc-gallery-connect.js"></script>
 * 
 * For debug logging:
 * <script src="https://your-worker.workers.dev/uc-gallery-connect.js?debug=true"></script>
 * 
 * Features:
 * - Transforms Uploadcare group URLs to gallery URLs on form submission
 * - Supports data-gallery-input attribute to override target input (name or CSS selector)
 * - MutationObserver for dynamically added providers
 * - Debug mode via ?debug=true query param
 * - ETag-based caching (no manual version bumping needed)
 */
(function() {
  // WORKER_URL is injected at runtime from env.WORKER_URL
  const WORKER_URL = '__WORKER_URL__';
  // DEBUG is set to true when ?debug=true is in the script URL
  const DEBUG = false;
  
  // WeakSet to prevent duplicate listeners on same provider
  const processedProviders = new WeakSet();
  
  function log(...args) {
    if (DEBUG) console.log('[uc-gallery-connect]', ...args);
  }
  
  function warn(...args) {
    if (DEBUG) console.warn('[uc-gallery-connect]', ...args);
  }

  function setupProvider(provider) {
    // Skip if already processed
    if (processedProviders.has(provider)) {
      log('Provider already processed, skipping:', provider);
      return;
    }
    processedProviders.add(provider);
    
    const ctxName = provider.getAttribute('ctx-name');
    if (!ctxName) {
      warn('Provider missing ctx-name attribute:', provider);
      return;
    }
    
    log('Setting up provider:', ctxName);
    
    provider.addEventListener('group-created', (e) => {
      const groupUrl = e.detail?.group?.cdnUrl;
      if (!groupUrl) {
        warn('group-created event missing cdnUrl:', e.detail);
        return;
      }
      
      log('Group created:', groupUrl);
      
      // Check for data-gallery-input override, fallback to ctx-name
      const inputTarget = provider.getAttribute('data-gallery-input') || ctxName;
      // If it looks like a CSS selector (starts with # . [ or contains :), use as-is
      // Otherwise treat as input name attribute
      const isSelector = /^[#.\[]|:/.test(inputTarget);
      const selector = isSelector ? inputTarget : 'input[name="' + inputTarget + '"]';
      const input = document.querySelector(selector);
      
      if (!input) {
        warn('Input not found for selector:', selector);
        return;
      }
      
      const pageSlug = window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'unknown';
      const timestamp = Math.floor(Date.now() / 1000);
      const galleryUrl = WORKER_URL + '?url=' + encodeURIComponent(groupUrl) + '&from=' + encodeURIComponent(pageSlug) + '&ts=' + timestamp;
      
      input.value = galleryUrl;
      log('Updated input', selector, 'with:', galleryUrl);
    });
  }

  function init() {
    log('Initializing...');
    
    // Setup existing providers
    const providers = document.querySelectorAll('uc-upload-ctx-provider');
    log('Found', providers.length, 'existing provider(s)');
    providers.forEach(setupProvider);
    
    // Watch for dynamically added providers
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a provider
            if (node.tagName === 'UC-UPLOAD-CTX-PROVIDER') {
              log('New provider added dynamically');
              setupProvider(node);
            }
            // Check children of added node
            const childProviders = node.querySelectorAll?.('uc-upload-ctx-provider');
            if (childProviders) {
              childProviders.forEach(setupProvider);
            }
          }
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    log('MutationObserver active');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
