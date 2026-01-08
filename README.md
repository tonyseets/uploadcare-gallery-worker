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

**Features:**
- 🖼️ Thumbnail previews for all files
- 📝 Real filenames (fetched from Uploadcare headers)
- ⬇️ Download individual files or ZIP all
- 🔗 Open all in tabs
- ✅ Session-based "viewed" tracking
- 📍 Source page + timestamp metadata
- 🎨 Fully white-labelable (your logo, colors, fonts)
- 📱 Responsive design

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

All branding is controlled via environment variables in `wrangler.toml`:

| Variable | Required | Description |
|----------|----------|-------------|
| `ALLOWED_CDN_HOSTS` | ✅ | Uploadcare CDN hostname(s), comma-separated |
| `COMPANY_NAME` | ✅ | Displayed in UI and page title |
| `COMPANY_URL` | ✅ | Logo links here |
| `WORKER_URL` | ✅ | Full URL of your deployed worker |
| `BRAND_COLOR` | ✅ | Primary color (hex, e.g., `#0066FF`) |
| `FAVICON_URL` | ✅ | URL to your favicon |
| `LOGO_SVG` | ⬜ | Inline SVG logo (preferred) |
| `LOGO_URL` | ⬜ | URL to logo image (fallback) |
| `FONT_BODY` | ✅ | Font family name for body text |
| `FONT_DISPLAY` | ✅ | Font family name for headings |
| `FONT_CSS_URL` | ⬜ | Custom font CSS URL (if set, skips Google Fonts) |
| `MAIN_ACTION` | ⬜ | Card click behavior: `"download"` (default) or `"open"` |
| `SUCCESS_COLOR` | ⬜ | Success/confirmation color (default: `#16a34a` green) |
| `LINK_HOVER_COLOR` | ⬜ | Link hover color (default: `inherit` = no change) |
| `BG_COLOR` | ⬜ | Page background (default: `#ffffff`) |
| `PANEL_COLOR` | ⬜ | Panel/card backgrounds (default: `#f9fafb`) |
| `SURFACE_COLOR` | ⬜ | Interactive surfaces (default: `#f3f4f6`) |
| `BORDER_COLOR` | ⬜ | Borders (default: `#e5e7eb`) |
| `TEXT_COLOR` | ⬜ | Primary text (default: `#111827`) |
| `TEXT_SECONDARY_COLOR` | ⬜ | Secondary text (default: `#6b7280`) |
| `TEXT_MUTED_COLOR` | ⬜ | Muted text (default: `#9ca3af`) |
| `HEADER_BG` | ⬜ | Header background (default: `rgba(255,255,255,0.8)`) |

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
| `/uploader.js?v=X.X.X` | Client-side URL transformer | Immutable (use version for cache busting) |

## Client-Side Integration

The `/uploader.js` script transforms Uploadcare group URLs into gallery URLs before form submission. This is useful when you want the transformation to happen automatically on the client side.

> **Note:** The included script is built for Webflow + Uploadcare's file uploader widget, but can be adapted for other platforms.

### Option 1: Load from Worker (Recommended for Webflow)

Add this to your site's footer code:

```html
<script src="https://your-worker.workers.dev/uploader.js?v=1.1.2"></script>
```

**Important:** Update the `?v=` version parameter when upgrading to get the latest script. The script is cached aggressively (immutable), so changing the version busts the cache instantly.

**Pros:**
- Simple one-line setup
- `WORKER_URL` is injected automatically (no hardcoding)
- Instant updates via version bump
- CORS headers handled for you
- No need to host the script yourself
- Served from Cloudflare's edge (fast globally)

**Cons:**
- Depends on your worker being deployed and reachable
- Script updates require changing the version parameter in your site

### Option 2: Inline the Script

Copy the contents of [`uploader-snippet.js`](./uploader-snippet.js) directly into your site's custom code. Replace `__WORKER_URL__` with your actual worker URL:

```javascript
const WORKER_URL = 'https://your-worker.workers.dev';
```

**Pros:** Full control, can customize behavior, no external dependency.  
**Cons:** You manage updates manually.

### Option 3: Self-Host or Fork & Customize

If you want full control, you can:

- **Self-host:** Copy `uploader-snippet.js` to your own server/CDN and serve it from there. Replace `__WORKER_URL__` with your actual worker URL before hosting.
- **Fork & customize:** For custom behavior (different tracking, additional metadata, different event handling), fork this repo and modify `uploader-snippet.js` or the `UPLOADER_SNIPPET` constant in `src/index.ts`.

### What the Script Does

1. Listens for Uploadcare `group-created` events
2. Transforms the raw CDN URL → your gallery URL
3. Adds metadata (source page slug, timestamp)
4. Updates the form's hidden input

Now when forms submit to your CRM/backend, they contain gallery URLs instead of raw Uploadcare URLs.

## Security

| Feature | Implementation |
|---------|----------------|
| **CDN Allowlist** | Only URLs from configured `ALLOWED_CDN_HOSTS` are accepted |
| **URL Validation** | Strict regex matching for Uploadcare group URL format |
| **File Count Limit** | Configure in Uploadcare project settings |
| **No Indexing** | `noindex, nofollow` meta tags |
| **CORS** | Only enabled for `/uploader.js` endpoint |

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
│   Your Form     │────▶│  uploader.js     │────▶│   Your CRM/     │
│   + Uploadcare  │     │  (transforms URL)│     │   Backend       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Uploadcare    │◀────│  This Worker     │◀────│   User clicks   │
│   CDN           │     │  (renders gallery)│    │   link          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

> **Without uploader.js:** You can skip the client-side script entirely and transform URLs server-side, or even manually prepend the worker URL when needed.

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
