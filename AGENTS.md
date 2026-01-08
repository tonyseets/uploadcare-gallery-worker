# Agent Guidelines for Uploadcare Gallery Worker

## Project Overview

Cloudflare Worker that wraps Uploadcare group URLs in a branded gallery page. Two main functions:

1. **Gallery Viewer** (`/?url=...`) — Renders HTML gallery for file groups
2. **Uploader Script** (`/uploader.js?v=X.X.X`) — Client-side script for Webflow forms

**Fully white-labelable** via environment variables in `wrangler.toml`.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main worker code (all logic in one file) |
| `uploader-snippet.js` | Reference copy of the uploader script (canonical version is in index.ts) |
| `wrangler.toml.example` | Template for configuration (copy to wrangler.toml) |
| `wrangler.toml` | Local config (gitignored - contains your specific branding) |
| `CHANGELOG.md` | Version history (update when making notable changes) |

## Code Structure

The worker is intentionally simple — single file, no external dependencies at runtime.

```typescript
// Environment interface (all config via wrangler.toml [vars])
interface Env {
  ALLOWED_CDN_HOSTS: string  // Comma-separated CDN hostnames
  COMPANY_NAME: string       // Display name
  COMPANY_URL: string        // Company website
  WORKER_URL: string         // This worker's URL
  BRAND_COLOR: string        // Primary color (hex)
  LOGO_SVG?: string          // Inline SVG logo
  LOGO_URL?: string          // Alternative: URL to logo
  FAVICON_URL: string        // Favicon URL
  FONT_BODY: string          // Google Fonts body font
  FONT_DISPLAY: string       // Google Fonts display font
}

// URL validation (uses env.ALLOWED_CDN_HOSTS)
function validateUrl(url: string, env: Env): ValidationResult

// HTML generation (uses env for all branding)
function generateHtml(env: Env, ...): string
function generateErrorHtml(env: Env, error: string): string

// File info fetching
async function fetchFileInfos(...): Promise<FileInfo[]>

// Main handler
export default { fetch(request: Request, env: Env): Promise<Response> }
```

## Security Considerations

1. **CDN Allowlist**: Only URLs from configured `ALLOWED_CDN_HOSTS` are accepted
2. **No User Input in HTML**: All dynamic content is escaped
3. **File Count Limits**: 1-50 files per group
4. **No Secrets**: All config is via non-secret env vars

## Common Tasks

### Update the Uploader Script

1. Edit the `UPLOADER_SNIPPET` constant in `src/index.ts`
2. Optionally update `uploader-snippet.js` for reference
3. Deploy: `npm run deploy`

### Add a New CDN Host

Update `ALLOWED_CDN_HOSTS` in `wrangler.toml` (comma-separated):
```toml
ALLOWED_CDN_HOSTS = "project1.ucarecdn.com,project2.ucarecdn.com"
```

### Modify Gallery UI

All HTML/CSS is generated inline in `generateHtml()`. The gallery uses:
- CSS variables for branding (`--brand-color`, `--brand-dark`, etc.)
- Google Fonts loaded from `env.FONT_BODY` and `env.FONT_DISPLAY`
- Inline `<script>` for interactivity (ZIP download, tracking, etc.)

### White-Label for Your Company

1. Copy `wrangler.toml.example` to `wrangler.toml`
2. Set `ALLOWED_CDN_HOSTS` to your Uploadcare CDN
3. Update `COMPANY_NAME`, `COMPANY_URL`, `WORKER_URL`
4. Set `BRAND_COLOR` to your primary brand color
5. Provide `LOGO_SVG` (preferred) or `LOGO_URL`
6. Update `FAVICON_URL`
7. Choose appropriate `FONT_BODY` and `FONT_DISPLAY` from Google Fonts
8. Deploy: `npm run deploy`

### Add New Endpoint

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Add new route before the gallery handler
    if (url.pathname === '/new-endpoint') {
      return new Response('...', { headers: { 'Content-Type': '...' } });
    }
    
    // Existing uploader.js route
    if (url.pathname === '/uploader.js') { ... }
    
    // Gallery handler (default)
    const uploadcareUrl = url.searchParams.get('url');
    ...
  }
};
```

## Testing

```bash
# Local development
npm run dev

# Type check
npx tsc --noEmit

# Test locally (replace with your CDN host)
curl "http://localhost:8787/?url=https://your-project.ucarecdn.com/UUID~3/"
curl "http://localhost:8787/uploader.js"
```

## Deployment

```bash
npm run deploy
```

Note: `/uploader.js` uses immutable caching with version-based cache busting.
To push updates, bump the version in the embed URL: `/uploader.js?v=X.X.X`

## Dependencies

- **Runtime**: Zero (pure Cloudflare Workers)
- **Client-side**: JSZip from CDN (for ZIP downloads only)
- **Dev**: TypeScript, Wrangler, @cloudflare/workers-types

## Gotchas

1. **File info fetching**: Uses HEAD requests to get Content-Disposition headers. If Uploadcare changes their API, filenames may break.

2. **JSZip CDN**: The ZIP functionality depends on `cdnjs.cloudflare.com`. If it's down, ZIP downloads fail (individual downloads still work).

3. **Session storage**: Opened/downloaded tracking uses `sessionStorage`, so it resets when the tab closes. This is intentional.

4. **CORS on uploader.js**: Has `Access-Control-Allow-Origin: *` because it's loaded cross-origin from various sites.
