/**
 * Uploadcare Gallery URL Transformer
 * 
 * This is a REFERENCE COPY. The canonical version is embedded in src/index.ts.
 * 
 * The script is served from the worker at /uploader.js and automatically
 * uses the WORKER_URL configured in wrangler.toml [vars].
 * 
 * Usage (add to your site's footer):
 * <script src="https://your-worker.workers.dev/uploader.js"></script>
 * 
 * Wraps Uploadcare group URLs with the gallery worker for a better viewing experience.
 * Built for Webflow + Uploadcare widget, but can be adapted for other platforms.
 */
(function() {
  // WORKER_URL is injected at runtime from env.WORKER_URL
  const WORKER_URL = '__WORKER_URL__';

  // Wait for DOM to be ready
  function init() {
    // Find all Uploadcare context providers
    const providers = document.querySelectorAll('uc-upload-ctx-provider');
    
    providers.forEach(provider => {
      provider.addEventListener('group-created', (e) => {
        const groupUrl = e.detail?.group?.cdnUrl;
        if (!groupUrl) return;

        // Get the context name to find the associated hidden input
        const ctxName = provider.getAttribute('ctx-name');
        if (!ctxName) return;

        // Find the hidden input that stores the URL
        const input = document.querySelector(`input[name="${ctxName}"]`);
        if (input) {
          // Get page slug from current URL (strip leading/trailing slashes)
          const pageSlug = window.location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'unknown';
          // Get current timestamp (seconds since epoch)
          const timestamp = Math.floor(Date.now() / 1000);
          
          // Transform the URL to use the gallery worker with metadata
          input.value = `${WORKER_URL}?url=${encodeURIComponent(groupUrl)}&from=${encodeURIComponent(pageSlug)}&ts=${timestamp}`;
        }
      });
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
