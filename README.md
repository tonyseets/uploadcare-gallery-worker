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
| `FONT_BODY` | ✅ | Google Fonts family for body text |
| `FONT_DISPLAY` | ✅ | Google Fonts family for headings |

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
| `/uploader.js` | Webflow integration script | CDN: 7 days |

## Webflow Integration

The uploader script transforms Uploadcare group URLs into gallery URLs before form submission. You have several options for using it:

### Option 1: Load from Worker (Recommended)

Add this to your Webflow site (Settings → Custom Code → Footer):

```html
<script src="https://your-worker.workers.dev/uploader.js"></script>
```

**Pros:** Always up-to-date, no maintenance, `WORKER_URL` is injected automatically.

### Option 2: Inline the Script

Copy the contents of [`webflow-snippet.js`](./webflow-snippet.js) directly into your Webflow custom code. Replace `__WORKER_URL__` with your actual worker URL:

```javascript
const WORKER_URL = 'https://your-worker.workers.dev';
```

**Pros:** Full control, can customize behavior, no external dependency.  
**Cons:** You manage updates manually.

### Option 3: Fork & Customize

If you need custom behavior (different tracking, additional metadata, different event handling), fork this repo and modify `webflow-snippet.js` or the `WEBFLOW_SNIPPET` constant in `src/index.ts`.

### What the Script Does

1. Listens for Uploadcare `group-created` events
2. Transforms the raw CDN URL → your gallery URL
3. Adds metadata (source page slug, timestamp)
4. Updates the form's hidden input

Now when forms submit to HubSpot/etc., they contain gallery URLs instead of raw Uploadcare URLs.

## Security

| Feature | Implementation |
|---------|----------------|
| **CDN Allowlist** | Only URLs from configured `ALLOWED_CDN_HOSTS` are accepted |
| **URL Validation** | Strict regex matching for Uploadcare group URL format |
| **File Count Limit** | Max 50 files per group |
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
│   Webflow Form  │────▶│  uploader.js     │────▶│   Your CRM      │
│   + Uploadcare  │     │  (transforms URL)│     │   (stores URL)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Uploadcare    │◀────│  This Worker     │◀────│   User clicks   │
│   CDN           │     │  (renders gallery)│    │   link          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

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
