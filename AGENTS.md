# Agent Guidelines for Uploadcare Gallery Worker

## Project Overview

Cloudflare Worker that wraps Uploadcare group URLs in a branded gallery page. Two main functions:

1. **Gallery Viewer** (`/?url=...`) — Renders HTML gallery for file groups
2. **UC Gallery Connect** (`/uc-gallery-connect.js`) — Client-side script for Webflow forms (ETag-based caching)

**Fully white-labelable** via environment variables in `wrangler.toml`.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main worker handler (~120 lines) - routes and request handling |
| `src/types.ts` | Type definitions (Env, FileInfo, ValidationResult) |
| `src/utils.ts` | Shared utilities (escapeHtml) |
| `src/env.ts` | Environment helpers, constants, VERSION |
| `src/validation.ts` | URL validation logic |
| `src/icons.ts` | File type icon SVG generation |
| `src/files.ts` | File fetching, extension checks, formatters |
| `src/fonts.ts` | Font loading HTML generation |
| `src/connect-script.ts` | UC Gallery Connect script constant |
| `src/html/gallery.ts` | Gallery page HTML generation |
| `src/html/error.ts` | Error page HTML generation |
| `src/html/styles.ts` | Gallery CSS styles |
| `src/html/scripts.ts` | Gallery client-side JavaScript |
| `src/html/index.ts` | HTML module exports |
| `uc-gallery-connect.example.js` | Reference copy of the connect script (canonical version is in connect-script.ts) |
| `wrangler.toml.example` | Template for configuration (copy to wrangler.toml) |
| `wrangler.toml` | Local config (gitignored - contains your specific branding) |
| `CHANGELOG.md` | Version history (update when making notable changes) |

## Code Structure

The worker is organized into focused modules for maintainability. No external dependencies at runtime.

### Module Structure

```
src/
├── index.ts              # Main handler + routes (~120 lines)
├── types.ts              # Env, FileInfo, ValidationResult
├── utils.ts              # escapeHtml + shared utilities
├── env.ts                # VERSION, constants, 25+ helpers
├── validation.ts         # validateUrl, getHostFromUrl
├── icons.ts              # getFileTypeIconSvg
├── files.ts              # File fetching, extensions, formatters
├── fonts.ts              # getFontLoadingHtml
├── connect-script.ts     # UC_GALLERY_CONNECT_SCRIPT
└── html/
    ├── index.ts          # Re-exports generateHtml, generateErrorHtml
    ├── gallery.ts        # generateHtml
    ├── error.ts          # generateErrorHtml
    ├── styles.ts         # All CSS
    └── scripts.ts        # All client JS
```

### Module Dependencies

- `index.ts` imports from: `types`, `validation`, `files`, `html`, `connect-script`, `env`
- `html/gallery.ts` imports from: `types`, `env`, `utils`, `files`, `icons`, `fonts`, `html/styles`, `html/scripts`
- `html/error.ts` imports from: `types`, `env`, `utils`, `fonts`
- `env.ts` imports from: `types`, `utils`
- `validation.ts` imports from: `types`, `env`
- `files.ts` imports from: `types`, `env`, `icons`
- `icons.ts` imports from: `files` (for extension checks)

### Key Types and Functions

```typescript
// Environment interface (all config via wrangler.toml [vars])
interface Env { ... }  // See src/types.ts for full definition

// URL validation
function validateUrl(url: string, env: Env): ValidationResult

// HTML generation (uses env for all branding)
function generateHtml(env: Env, host: string, groupId: string, count: number, originalUrl: string, pageSlug: string, timestamp: number | null, fileInfos: FileInfo[]): string
function generateErrorHtml(env: Env, error: string): string

// File info fetching
async function fetchFileInfos(host: string, groupId: string, count: number): Promise<FileInfo[]>

// Main handler
export default { fetch(request: Request, env: Env): Promise<Response> }
```

## Security Considerations

1. **CDN Allowlist**: Only URLs from configured `ALLOWED_CDN_HOSTS` are accepted
2. **XSS Protection**: All user-supplied content (filenames, URL params) is HTML-escaped server-side via `escapeHtml()` and client-side
3. **File Count Limits**: `MAX_GROUP_FILE_COUNT` env var (default: 50) + Uploadcare project settings
4. **Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
5. **Content-Security-Policy (CSP)**: Dynamic CSP restricts resource loading to known sources (JSZip CDN, fonts, etc.)
6. **Subresource Integrity (SRI)**: JSZip loaded with integrity hash to prevent CDN tampering (default hash for cdnjs, configurable via `JSZIP_INTEGRITY`)
7. **DoS Protection**: HEAD requests limited to 20 concurrent to avoid overwhelming Uploadcare
8. **No Secrets**: All config is via non-secret env vars

## Common Tasks

### Update the Uploader Script

1. Edit the `UC_GALLERY_CONNECT_SCRIPT` constant in `src/connect-script.ts`
2. Bump the `VERSION` constant in `src/env.ts` (used for ETag cache invalidation)
3. Optionally update `uc-gallery-connect.example.js` for reference
4. Deploy: `npm run deploy`

### Flexible Input Targeting

By default, the script updates an input with `name` matching the provider's `ctx-name`. Use `data-gallery-input` to override with a different name or a full CSS selector:

```html
<!-- Default: updates input[name="file_upload_url"] -->
<uc-upload-ctx-provider ctx-name="file_upload_url">

<!-- Override with different name -->
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input="attachments">

<!-- Override with CSS selector -->
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input="#my-field">
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input=".upload-url">
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input="[data-gallery-url]">
```

Submit-time rewrite: If Uploadcare `<uc-form-input>` writes raw CDN URLs to `file_upload_url`, the script rewrites them to gallery URLs during submit (capture phase). No downstream form/HubSpot changes needed.

Values starting with `#`, `.`, `[`, or containing `:` are treated as CSS selectors.

### Debug Mode

Add `?debug=true` to the script URL for console logging:

```html
<script src="https://your-worker.workers.dev/uc-gallery-connect.js?debug=true"></script>
```

Logs: initialization, provider setup, group-created events, and URL transformations.

### Add a New CDN Host

Update `ALLOWED_CDN_HOSTS` in `wrangler.toml` (comma-separated):
```toml
ALLOWED_CDN_HOSTS = "project1.ucarecdn.com,project2.ucarecdn.com"
```

### Modify Gallery UI

All HTML/CSS is generated inline in `generateHtml()`. The gallery uses:
- CSS variables for branding (`--brand-color`, `--success-color`, `--grid-columns`, `--image-fit`, etc.)
- Fonts loaded via `getFontLoadingHtml()` — Google Fonts by default, or custom CSS via `FONT_CSS_URL`
- Inline `<script>` for interactivity (ZIP download, lightbox, tracking, etc.)
- FOUC prevention script in `<head>` to apply saved grid preference before paint

### Lightbox Modal

The lightbox allows users to navigate through ALL files in a fullscreen overlay. Each file type renders differently:

**Supported preview types:**
- **Images** (jpg, jpeg, png, gif, webp, svg, bmp): Displayed as `<img>`
- **Videos** (mp4, webm, mov): Displayed as `<video>` with controls
- **PDFs**: Embedded in `<iframe>` when `ENABLE_PDF_PREVIEW=true`
- **Audio** (mp3, wav, flac, aac, ogg, m4a, wma, aiff): Custom branded audio player when `ENABLE_AUDIO_PREVIEW=true`
- **Other files**: Large file type icon + filename (still navigable, download button works)

**Features:**
- Expand button appears on hover in top-right corner of ALL file cards
- Navigate through entire gallery with arrow keys or nav buttons
- Backdrop blur effect
- Close via: X button, backdrop click, or Escape key
- Download button for quick file download
- Share button copies gallery URL with `?file=N` param
- Auto-opens to specific file when `?file=N` param is present
- Focus trap for keyboard accessibility
- Screen reader announcements
- Media (video/audio) pauses when navigating or closing

**Configuration:**
- `ENABLE_LIGHTBOX`: Set to `"false"` to disable lightbox entirely
- `ENABLE_PDF_PREVIEW`: Set to `"false"` to show PDF icon instead of iframe (default: true)
- `ENABLE_AUDIO_PREVIEW`: Set to `"false"` to show audio icon instead of player (default: true)
- `VIDEO_AUTOPLAY`: Set to `"true"` to auto-play videos when opened (default: false)
- `MAIN_ACTION`: Controls card click behavior:
  - `"lightbox"` (default): Clicking card opens lightbox for inline-previewable files (image/video/pdf/audio)
  - `"download"`: Clicking card downloads file (lightbox still accessible via expand button)
  - `"open"`: Clicking card opens file in new tab (lightbox still accessible via expand button)

**Fallback behavior:**
- If `MAIN_ACTION="lightbox"` but `ENABLE_LIGHTBOX="false"`, falls back to download
- If `MAIN_ACTION="lightbox"` on icon-only file (doc, zip, etc.), card click downloads (but lightbox button still opens lightbox)
- The expand button in card corner always opens lightbox for ALL files when lightbox is enabled

### Grid Layout

The file grid supports 1-4 columns, configurable via environment and user preference.

**Configuration:**
- `DEFAULT_GRID_COLUMNS`: Set default to `"1"`, `"2"`, `"3"`, or `"4"` (default: `"2"`)
- `IMAGE_FIT`: Set to `"contain"` (letterbox, shows full image) or `"cover"` (crops to fill)

**User Preference:**
- Grid selector dropdown in the meta row lets users choose their preferred column count
- Preference saved to `localStorage` (`gallery-grid-columns`)
- FOUC prevention script in `<head>` applies saved preference before first paint
- Mobile always uses 1 column regardless of setting

### White-Label for Your Company

1. Copy `wrangler.toml.example` to `wrangler.toml`
2. Set `ALLOWED_CDN_HOSTS` to your Uploadcare CDN
3. Update `COMPANY_NAME`, `COMPANY_URL`, `WORKER_URL`
4. Set `BRAND_COLOR` to your primary brand color
5. Provide `LOGO_SVG` (preferred) or `LOGO_URL`
6. Update `FAVICON_URL`
7. Choose fonts: either Google Fonts names in `FONT_BODY`/`FONT_DISPLAY`, or provide `FONT_CSS_URL` for custom fonts
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
    
    // Existing uc-gallery-connect.js route
    if (url.pathname === '/uc-gallery-connect.js') { ... }
    
    // Gallery handler (default)
    const uploadcareUrl = url.searchParams.get('url');
    ...
  }
};
```

## Testing

### Prerequisites

This is a **template repo** — you must create a `wrangler.toml` before running locally:

```bash
# One-time setup: copy the example config
cp wrangler.toml.example wrangler.toml

# Edit wrangler.toml to set at minimum:
# - ALLOWED_CDN_HOSTS (your Uploadcare CDN hostname)
# - COMPANY_NAME, COMPANY_URL, WORKER_URL
# - BRAND_COLOR, FAVICON_URL
```

### Local Development

```bash
# Start the dev server (default port 8787)
npm run dev

# Or specify a different port if 8787 is in use
npm run dev -- --port 8788
```

The dev server runs at `http://localhost:8787` (or your specified port).

### Type Checking

```bash
npx tsc --noEmit
```

### Test Endpoints

Once the dev server is running, test these endpoints:

```bash
# Health check (should return JSON with version)
curl "http://localhost:8787/health"

# UC Gallery Connect script (should return JavaScript)
curl "http://localhost:8787/uc-gallery-connect.js"

# Gallery page (replace with your CDN host and a real group UUID)
curl "http://localhost:8787/?url=https://your-project.ucarecdn.com/UUID~3/"

# Or open in browser for visual testing
open "http://localhost:8787/?url=https://your-project.ucarecdn.com/UUID~3/"
```

### Visual Testing Checklist

When testing in browser, verify:
- [ ] Gallery renders with correct branding (logo, colors, fonts)
- [ ] File cards display thumbnails or type icons
- [ ] Lightbox opens on card click (for images/video/pdf/audio)
- [ ] Lightbox navigation works (arrows, keyboard)
- [ ] Download button works
- [ ] ZIP download works (if enabled)
- [ ] Grid column selector works
- [ ] Share button copies URL (if enabled)

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing entry-point" error | Create `wrangler.toml` from the example |
| "Address already in use" | Use `--port 8788` or kill existing process: `lsof -i :8787` then `kill <PID>` |
| Gallery shows error page | Check `ALLOWED_CDN_HOSTS` matches your test URL's hostname |
| Fonts not loading | Check `FONT_BODY`/`FONT_DISPLAY` are valid Google Font names |

### Demo Mode

Preview gallery branding/UI without real Uploadcare files. Disabled by default.

**Enable demo mode:**

1. Add to `wrangler.toml`:
   ```toml
   ENABLE_DEMO = "true"
   ```

2. Access the demo:
   ```bash
   # Local
   open "http://localhost:8787/demo"
   
   # Production (if enabled)
   open "https://your-worker.workers.dev/demo"
   ```

**What the demo shows:**
- 3 images with real thumbnails (via picsum.photos)
- Video, audio, PDF with icon previews
- Generic files (.docx, .zip) with type icons
- Full lightbox navigation

**Use cases:**
- Test branding setup before having real files
- Share gallery appearance with stakeholders
- Verify theme colors and typography

Note: Downloads won't work in demo mode (placeholder URLs). This is expected.

## Deployment

```bash
npm run deploy
```

The `/uc-gallery-connect.js` script uses ETag-based caching. When you deploy a new version, browsers automatically fetch the updated script on their next revalidation (every 60s by default). No manual cache busting needed.

## Dependencies

- **Runtime**: Zero (pure Cloudflare Workers)
- **Client-side**: JSZip from CDN (for ZIP downloads only)
- **Dev**: TypeScript, Wrangler, @cloudflare/workers-types

## Gotchas

1. **File info fetching**: Uses HEAD requests to get Content-Disposition headers. If Uploadcare changes their API, filenames may break.

2. **JSZip CDN**: The ZIP functionality depends on JSZip loaded from a CDN (default: `cdnjs.cloudflare.com`). If it's down, ZIP downloads fail (individual downloads still work). Use `JSZIP_URL` env var to self-host or use an alternate CDN.

3. **Session storage**: Opened/downloaded tracking uses `sessionStorage`, so it resets when the tab closes. This is intentional.

4. **CORS on uc-gallery-connect.js**: Has `Access-Control-Allow-Origin: *` because it's loaded cross-origin from various sites.

5. **Lightbox video formats**: Only mp4, webm, and mov can play inline in lightbox (browser-native formats). Other video formats show icon fallback but are still navigable.

6. **Grid preference localStorage**: User grid preference is stored in `localStorage` under key `gallery-grid-columns`. The FOUC prevention script reads this synchronously in `<head>` to prevent layout shift.

7. **PDF iframe in lightbox**: Some browsers may block PDFs from third-party domains. If PDFs don't load, users can use the download button.

8. **Audio player in lightbox**: The custom audio player uses the native `<audio>` element. Codec support depends on the browser.

## Design Philosophy

The gallery intentionally uses **minimal, utilitarian styling**:

1. **No decorative elements**: Buttons use solid colors, no gradients, no shadows
2. **Theme-aware colors**: All colors reference CSS variables (`--brand-bg`, `--text-color`, etc.) so buttons work in light/dark themes
3. **Functional over flashy**: Prefer subtle hover states (border color change) over animated effects
4. **Consistent patterns**: New buttons should follow existing button styles (`.source-btn`, `.lightbox-download`)

When adding new UI elements:
- Use existing CSS variables for colors
- Match padding/sizing of similar elements
- Keep hover effects minimal (color/border changes only)
- Test in both light and dark themes
