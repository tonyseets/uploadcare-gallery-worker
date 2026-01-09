# Uploadcare Gallery Worker

A Cloudflare Worker that transforms raw Uploadcare group URLs into a beautiful, branded file gallery.

![Gallery Preview](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

<p align="center">
  <img src="./assets/screenshot.webp" alt="Gallery Screenshot" width="700">
</p>

## The Problem

Uploadcare supports **file groups** — a way to bundle multiple uploaded files under a single URL. This is useful when a form field accepts multiple attachments:

```
https://your-project.ucarecdn.com/20a62b9a-96be-4782-9016-6a82ce5ef6c7~3/
```

But the default group page is barebones: no thumbnails, no real filenames, no branding. When these URLs end up in your CRM, helpdesk, or team notifications, they're nearly unusable.

## The Solution

This worker wraps those URLs in a clean gallery page:

```
https://your-worker.workers.dev/?url=https://your-project.ucarecdn.com/...
```

The gallery works with **any** Uploadcare group URL — whether it comes from Webflow, a custom app, your own backend, or anywhere else. Just pass the URL to the worker.

> **Note:** Single-file URLs (`uuid~1`) are also supported for compatibility. Some integrations always append `~1` even for single files, and the gallery handles this gracefully.

**Features:**
- 🖼️ Thumbnail previews for all files
- 🔍 Lightbox modal for images and videos
- 📝 Real filenames (fetched from Uploadcare headers)
- ⬇️ Download individual files or ZIP all
- 🔗 Open all in tabs
- 📋 Share button (copy gallery URL to clipboard)
- ✅ Session-based "viewed" tracking
- 📍 Source page + timestamp metadata
- 🎨 Fully white-labelable (your logo, colors, fonts)
- 📱 Responsive design with configurable grid layout

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/uploadcare-gallery-worker.git
cd uploadcare-gallery-worker
npm install
```

### 2. Configure

```bash
cp wrangler.toml.example wrangler.toml
```

Edit `wrangler.toml` with your:
- Cloudflare account ID
- Uploadcare CDN hostname
- Company branding (name, colors, logo, fonts)

### 3. Deploy

```bash
npm run deploy
```

## Configuration

All branding is controlled via environment variables in `wrangler.toml`.

### Required

| Variable | Description |
|----------|-------------|
| `ALLOWED_CDN_HOSTS` | Uploadcare CDN hostname(s), comma-separated |
| `COMPANY_NAME` | Displayed in header, page title, and meta description |
| `COMPANY_URL` | Logo links here |
| `WORKER_URL` | Full URL of your deployed worker |

### Branding

| Variable | Required | Description |
|----------|----------|-------------|
| `BRAND_COLOR` | ✅ | Primary accent color (hex, e.g., `#0066FF`) |
| `FAVICON_URL` | ✅ | URL to your favicon |
| `LOGO_SVG` | ⬜ | Inline SVG logo (preferred) |
| `LOGO_URL` | ⬜ | URL to logo image (fallback if no SVG) |

### Typography

| Variable | Required | Description |
|----------|----------|-------------|
| `FONT_BODY` | ✅ | Font family for body text (e.g., `Inter`) |
| `FONT_DISPLAY` | ✅ | Font family for headings (e.g., `Inter`) |
| `FONT_CSS_URL` | ⬜ | Custom font CSS URL (skips Google Fonts if set) |

### Behavior

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIN_ACTION` | `download` | Card click behavior: `download` or `open` |

### Grid Layout (Optional)

Control the gallery grid appearance:

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_GRID_COLUMNS` | `2` | Default columns: `1`, `2`, `3`, or `4` |
| `IMAGE_FIT` | `contain` | Thumbnail fit: `contain` (letterbox) or `cover` (crop) |

Users can change column count via the grid selector dropdown. Their preference is saved to `localStorage` and restored on future visits.

### Theme Colors (Optional)

Set these to customize the color scheme (e.g., for dark themes). All color vars support any CSS color format (hex, rgba, hsl, etc.):

| Variable | Default | Description |
|----------|---------|-------------|
| `SUCCESS_COLOR` | `#16a34a` | Success/confirmation color |
| `LINK_HOVER_COLOR` | inherit | Link hover color |
| `BG_COLOR` | `#ffffff` | Page background |
| `PANEL_COLOR` | `#f9fafb` | Panel/card backgrounds |
| `SURFACE_COLOR` | `#f3f4f6` | Interactive surfaces (hover states) |
| `BORDER_COLOR` | `#e5e7eb` | Borders |
| `TEXT_COLOR` | `#111827` | Primary text |
| `TEXT_SECONDARY_COLOR` | `#6b7280` | Secondary text |
| `TEXT_MUTED_COLOR` | `#9ca3af` | Muted text |
| `HEADER_BG` | `#ffffffcc` | Header background (supports alpha via 8-digit hex) |

### CDN URLs (Optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `JSZIP_URL` | cdnjs URL | JSZip library URL - self-host or use alternate CDN |

### Cache Control (Optional)

Control caching behavior (values in seconds as strings):

| Variable | Default | Description |
|----------|---------|-------------|
| `CACHE_GALLERY_SECONDS` | `3600` | Gallery page cache (1 hour) |
| `CACHE_SCRIPT_BROWSER_SECONDS` | `60` | Script browser cache (60s, frequent ETag revalidation) |
| `CACHE_SCRIPT_CDN_SECONDS` | `604800` | Script CDN cache (7 days) |

### Feature Toggles (Optional)

Disable specific UI features by setting to `"false"`:

| Variable | Default | Description |
|----------|---------|-------------|
| `ENABLE_ZIP_DOWNLOAD` | `true` | Show "Download ZIP" button |
| `ENABLE_OPEN_ALL` | `true` | Show "Open All in Tabs" button |
| `ENABLE_SHARE_BUTTON` | `true` | Show "Share" button in header |
| `ENABLE_LIGHTBOX` | `true` | Enable lightbox modal for images/videos |

### Lightbox

When enabled (default), clicking an image or video opens it in a fullscreen modal overlay:

- **Supported images**: jpg, png, gif, webp, svg, bmp
- **Supported videos**: mp4, webm, mov (browser-native formats)
- **Other files**: Open in new tab (no lightbox)

The lightbox includes:
- Close button (X), backdrop click, or Escape key to close
- Download button for quick file download
- Full keyboard accessibility with focus trap

### Example Configuration

```toml
[vars]
ALLOWED_CDN_HOSTS = "abc123.ucarecdn.com"
COMPANY_NAME = "Acme Corp"
COMPANY_URL = "https://acme.com"
WORKER_URL = "https://files.acme.workers.dev"
BRAND_COLOR = "#FF6600"  # Your brand's accent color
FAVICON_URL = "https://acme.com/favicon.ico"
LOGO_URL = "https://acme.com/logo.png"
FONT_BODY = "Inter"
FONT_DISPLAY = "Inter"
```

## Endpoints

| Path | Description | Caching |
|------|-------------|---------|
| `/?url=...` | Gallery viewer | 1 hour |
| `/uc-gallery-connect.js` | Client-side URL transformer | ETag-based (auto-invalidates on deploy) |

## Client-Side Integration

The `/uc-gallery-connect.js` script transforms Uploadcare group URLs into gallery URLs before form submission. This is useful when you want the transformation to happen automatically on the client side.

> **Note:** The included script is built for Webflow + Uploadcare's file uploader widget, but can be adapted for other platforms.

### Option 1: Load from Worker (Recommended)

One script tag, auto-configured. Add to your site's footer code:

```html
<!-- UC Gallery Connect - transforms Uploadcare URLs to gallery URLs -->
<script src="https://your-worker.workers.dev/uc-gallery-connect.js"></script>
```

The worker URL is injected automatically. Cache invalidation is automatic via ETag — when you deploy a new version, browsers will fetch the updated script.

### Option 2: Inline the Script

Copy [`uc-gallery-connect.example.js`](./uc-gallery-connect.example.js) into your site's custom code and set your worker URL:

```javascript
const WORKER_URL = 'https://your-worker.workers.dev';
```

### Option 3: Self-Host the Script

Host the script on your own CDN (R2, S3, Cloudflare Pages, etc.). Copy `uc-gallery-connect.example.js`, replace `__WORKER_URL__` with your worker URL, and serve it from your CDN.

### What the Script Does

1. Listens for Uploadcare `group-created` events
2. Transforms the raw CDN URL → your gallery URL
3. Adds metadata (source page slug, timestamp)
4. Updates the form's hidden input

Now when forms submit to your CRM/backend, they contain gallery URLs instead of raw Uploadcare URLs.

### Flexible Input Targeting

By default, the script updates an input with the same `name` as the provider's `ctx-name`. Use `data-gallery-input` to override with a different name or a full CSS selector:

```html
<!-- Default: updates input[name="file_upload_url"] -->
<uc-upload-ctx-provider ctx-name="file_upload_url">

<!-- Override with different name -->
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input="attachments">

<!-- Override with CSS selector (id) -->
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input="#my-hidden-field">

<!-- Override with CSS selector (class) -->
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input=".upload-url-field">

<!-- Override with CSS selector (attribute) -->
<uc-upload-ctx-provider ctx-name="file_upload_url" data-gallery-input="[data-gallery-url]">
```

Values starting with `#`, `.`, `[`, or containing `:` are treated as CSS selectors. Plain text is treated as an input name.

**Submit-time rewrite:** Even if Uploadcare’s `<uc-form-input>` overwrites `file_upload_url` with the raw CDN URL, the script rewrites it to the gallery URL during form submit (capture phase). No HubSpot script changes are required.

### Debug Mode

Add `?debug=true` to the script URL to enable console logging:

```html
<script src="https://your-worker.workers.dev/uc-gallery-connect.js?debug=true"></script>
```

This logs initialization, provider setup, and URL transformations to help troubleshoot issues.

## Security

| Feature | Implementation |
|---------|----------------|
| **CDN Allowlist** | Only URLs from configured `ALLOWED_CDN_HOSTS` are accepted |
| **URL Validation** | Strict regex matching for Uploadcare group URL format |
| **File Count Limit** | Configure in Uploadcare project settings |
| **No Indexing** | `noindex, nofollow` meta tags |
| **CORS** | Only enabled for `/uc-gallery-connect.js` endpoint |

## Development

```bash
# Start local dev server
npm run dev

# Type check
npx tsc --noEmit

# Deploy to Cloudflare
npm run deploy

# View live logs
npm run tail
```

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Your Form     │────▶│ uc-gallery-      │────▶│   Your CRM/     │
│   + Uploadcare  │     │ connect.js       │     │   Backend       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Uploadcare    │◀────│  This Worker     │◀────│   User clicks   │
│   CDN           │     │  (renders gallery)│    │   link          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Manual URL Construction (JS SDK / API Users)

If you're using Uploadcare's JS SDK or REST API directly (not the web component), construct gallery URLs yourself:

```javascript
// After uploading a file group via SDK/API
const groupCdnUrl = 'https://ucarecdn.com/abc123~3/';
const galleryUrl = `https://your-worker.workers.dev/?url=${encodeURIComponent(groupCdnUrl)}`;

// Optional: add metadata
const pageSlug = window.location.pathname.replace(/^\/|\/$/g, '') || 'unknown';
const timestamp = Math.floor(Date.now() / 1000);
const fullUrl = `${galleryUrl}&from=${encodeURIComponent(pageSlug)}&ts=${timestamp}`;
```

Works from any context: browser JS, Node.js, serverless functions, backend APIs, etc.

## Alternative Hosting

This project is built for **Cloudflare Workers** and deploys with `wrangler`. If you want to host on a different platform (Vercel Edge Functions, Deno Deploy, AWS Lambda@Edge, etc.), you'll need to adapt the code:

- The worker uses Cloudflare's `Request`/`Response` APIs (standard Fetch API, so most platforms are compatible)
- Environment variables are accessed via the `env` parameter in the fetch handler
- No Cloudflare-specific APIs are used, so porting should be straightforward

This isn't officially supported, but the codebase is simple enough to adapt.

## Dependencies

- **Runtime**: None (pure Cloudflare Workers)
- **Client-side**: JSZip (loaded from CDN for ZIP downloads)
- **Dev**: TypeScript, Wrangler

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions welcome! Please open an issue first to discuss proposed changes.
