# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.6.2] - 2026-01-XX

### Added

- **JSZip fallback URL support** (`JSZIP_FALLBACK_URL`): Configure a fallback CDN URL for JSZip library. If the primary URL fails to load, the gallery automatically tries the fallback URL before falling back to the default cdnjs URL.

### Changed

- JSZip loading now includes error handling with automatic fallback mechanism for improved reliability

## [1.6.1] - 2026-01-09

### Fixed

- Submit-time rewrite guarantees `file_upload_url` (and `file_upload_url[]`) are converted to gallery URLs right before form submission, even if Uploadcare `<uc-form-input>` overwrites them with raw CDN URLs
- Version bump for ETag: `uc-gallery-connect.js` now serves v1.6.1

## [1.6.0] - 2026-01-08

### Added

- **ETag-based cache busting**: Script uses ETag headers for efficient revalidation — no more `?v=X.X.X` needed in embed URLs
- **Flexible input targeting** (`data-gallery-input`): Override target input with a name or full CSS selector (`#id`, `.class`, `[attr]`)
- **Debug mode** (`?debug=true`): Enable console logging for troubleshooting integration issues
- **MutationObserver**: Dynamically added `<uc-upload-ctx-provider>` elements are automatically detected
- **Manual URL construction docs**: README now documents how to construct gallery URLs for JS SDK/API users

### Changed

- Default browser cache for `/uc-gallery-connect.js` reduced from 1 day to 60 seconds for faster ETag revalidation
- Script endpoint returns `304 Not Modified` when ETag matches (fast, no body transfer)
- Old embeds with `?v=X.X.X` continue to work — version param is simply ignored

### Technical

- ETag value matches VERSION constant (e.g., `"1.6.0"`)
- `data-gallery-input` accepts CSS selectors (values starting with `#`, `.`, `[`, or containing `:`)
- MutationObserver watches `document.body` with `{ childList: true, subtree: true }`
- WeakSet prevents duplicate event listeners on same provider
- `log()` and `warn()` helpers for debug output

## [1.5.0] - 2026-01-08

### Added

- **Lightbox All-File Navigation**: Navigate through ALL files in lightbox, not just images/videos
  - Non-previewable files show their file type icon + filename
  - Arrow keys and nav buttons cycle through entire gallery
- **PDF Preview in Lightbox** (`ENABLE_PDF_PREVIEW`): PDFs embed in iframe instead of showing icon (default: true)
- **Audio Player in Lightbox** (`ENABLE_AUDIO_PREVIEW`): Custom branded audio player with play/pause, progress bar, and time display (default: true)
- **Video Autoplay Toggle** (`VIDEO_AUTOPLAY`): Control whether videos auto-play when opened in lightbox (default: false)
- **Lightbox trigger on all files**: Expand button now appears on ALL file cards, not just previewable ones

### Changed

- Lightbox navigation now includes all files regardless of preview type
- Card clicks for icon-only files still trigger download (as before), but lightbox button opens them in lightbox
- Media (video/audio) now properly pauses when navigating to next/prev file or closing lightbox

### Technical

- New env vars: `ENABLE_PDF_PREVIEW`, `ENABLE_AUDIO_PREVIEW`, `VIDEO_AUTOPLAY`
- New helpers: `isPdfPreviewEnabled()`, `isAudioPreviewEnabled()`, `isVideoAutoplayEnabled()`, `isAudioExtension()`, `getPreviewType()`
- New data attributes: `data-lightbox-type`, `data-lightbox-ext` (replaces `data-lightbox-video`)
- Client-side `getIconSvgForExt()` function for lightbox icon fallback
- New CSS for `.lightbox-icon-fallback`, `.lightbox-audio-player`, and iframe styling

## [1.4.5] - 2026-01-08

### Fixed

- **Lightbox share button height**: Normalized button height with `line-height: 1` and `box-sizing: border-box` to match sibling download link
- **Card hover states**: Download/Open buttons now only highlight on card hover when they're the main action. When `MAIN_ACTION="lightbox"` (default), the action buttons only highlight on direct hover, not card hover
- **Lightbox keyboard focus**: Focus now goes to lightbox container (not close button) so arrow keys work immediately for prev/next navigation. No visible focus ring on the container.
- **Lightbox arrow key navigation**: Arrow keys now properly prevent default behavior and work immediately after opening
- **Lightbox focus trap**: Improved Tab handling when focus is on the lightbox container
- **URL sync with lightbox state**: URL now updates when opening/closing lightbox (`?file=N` added/removed via `history.replaceState`). Header Share button always copies base gallery URL without `?file` param.

## [1.4.4] - 2026-01-08

### Changed

- **`MAIN_ACTION` default is now `"lightbox"`**: Clicking an image/video card opens the lightbox by default
- **New `MAIN_ACTION="lightbox"` option**: Explicitly set lightbox as the card click behavior
- **Graceful fallback**: If `MAIN_ACTION="lightbox"` but lightbox is disabled (`ENABLE_LIGHTBOX="false"`), falls back to download
- **Non-previewable files**: When `MAIN_ACTION="lightbox"`, non-previewable files (PDFs, docs, etc.) fall back to download
- **Lightbox trigger button always works**: The expand button in the card corner opens lightbox regardless of `MAIN_ACTION` setting

### Technical

- New `getMainAction()` helper function with fallback logic
- Card click tracking updated to handle all three modes correctly
- Lightbox card-main click interception now conditional on `mainAction === 'lightbox'`

## [1.4.3] - 2026-01-08

### Added

- **Lightbox share button**: Copy gallery URL with `?file=N` param to share specific file
- **Auto-open lightbox**: Gallery opens lightbox automatically when `?file=N` param is present

### Changed

- **Lightbox button styling**: Download/Share buttons now use page background color with border (not brand color), no hover shadow - cleaner look that works on any image

## [1.4.2] - 2026-01-08

### Changed

- **Lightbox header redesign**: Controls reorganized into header bar and bottom action
  - Header: Counter + Filename (left), Meta info + Close button (right)
  - Bottom: Download button with solid brand color background (always visible over images)
- **Card hover lightbox trigger**: Now shows full hover state (white background, dark icon) since lightbox is the default action for previewable files

### Fixed

- **Grid selector button height**: Now properly fills row height with `align-self: stretch` on parent

## [1.4.1] - 2026-01-08

### Added

- **Lightbox trigger button**: Expand icon appears in top-right corner of image/video cards on hover — click to open lightbox without triggering the default card action

### Changed

- **Buttons stack on narrow cards**: Download/Open buttons now wrap vertically when card is too narrow (e.g., 4-column grid)
- **Grid selector hidden on mobile**: Since mobile always shows 1 column, the grid selector is now hidden at ≤540px

### Removed

- **Hover zoom on thumbnails**: Removed the scale(1.05) zoom effect on thumbnail hover — border highlight remains

## [1.4.0] - 2026-01-08

### Added

- **Configurable grid layout** (`DEFAULT_GRID_COLUMNS`): Set default columns to 1, 2, 3, or 4 (default: 2)
- **User grid preference**: Users can change grid columns via dropdown, preference saved to localStorage
- **Image fit modes** (`IMAGE_FIT`): Choose `contain` (letterbox, default) or `cover` (crop to fill)
- **Lightbox modal** (`ENABLE_LIGHTBOX`): Click images/videos to view in fullscreen modal overlay
  - Supports images (jpg, png, gif, webp, svg, bmp) and browser-native videos (mp4, webm, mov)
  - Keyboard accessible: Escape to close, Tab to cycle focus, Enter/Space to activate
  - Download button in lightbox for quick file download
  - Non-previewable files (PDFs, other video formats, documents) open in new tab as before

### Technical

- New CSS variables: `--grid-columns`, `--image-fit`
- FOUC prevention script in `<head>` for instant grid column restoration from localStorage
- New helper functions: `getDefaultGridColumns()`, `getImageFit()`, `isLightboxEnabled()`, `isLightboxPreviewable()`
- Grid selector dropdown with accessible ARIA attributes
- Lightbox with focus trap, backdrop blur, and screen reader announcements

## [1.3.1] - 2026-01-08

### Fixed

- SVG fallback icons breaking HTML when thumbnail fails to load — double quotes in SVG attributes weren't escaped, causing malformed `onerror` handlers and `'" />` text appearing in file cards

## [1.3.0] - 2026-01-08

### Added

- **JSZip URL env var** (`JSZIP_URL`): Self-host JSZip or use an alternate CDN instead of the default cdnjs
- **Feature toggles**: Disable specific UI components via env vars:
  - `ENABLE_ZIP_DOWNLOAD` - Show/hide "Download ZIP" button
  - `ENABLE_OPEN_ALL` - Show/hide "Open All in Tabs" button
  - `ENABLE_SHARE_BUTTON` - Show/hide "Share" button in header
- **Cache duration env vars**: Fine-tune caching behavior:
  - `CACHE_GALLERY_SECONDS` - Gallery page cache (default: 3600 = 1 hour)
  - `CACHE_SCRIPT_BROWSER_SECONDS` - Script browser cache (default: 86400 = 1 day)
  - `CACHE_SCRIPT_CDN_SECONDS` - Script CDN cache (default: 604800 = 7 days)
- **Single-file URL support**: URLs with `~1` (single file) are now explicitly supported for compatibility with integrations that always append the count suffix

### Technical

- New helper functions: `getJsZipUrl()`, `getGalleryCacheSeconds()`, `getScriptBrowserCacheSeconds()`, `getScriptCdnCacheSeconds()`, `isFeatureEnabled()`
- Conditional rendering for ZIP download button, Open All button, and Share button based on feature toggles
- JSZip script tag only included when ZIP download is enabled

## [1.2.0] - 2026-01-07

### Changed

- Renamed `/uploader.js` → `/uc-gallery-connect.js` (the script connects Uploadcare uploads to the gallery, not an "uploader")
- Renamed reference file to `uc-gallery-connect.example.js` (`.example.js` convention makes it clear this is a template, not the served file)
- Renamed internal constant `WEBFLOW_SNIPPET` → `UC_GALLERY_CONNECT_SCRIPT`

## [1.1.6] - 2026-01-07

### Added

- Theme color env vars for full color customization:
  - `BG_COLOR`, `PANEL_COLOR`, `SURFACE_COLOR`, `BORDER_COLOR`
  - `TEXT_COLOR`, `TEXT_SECONDARY_COLOR`, `TEXT_MUTED_COLOR`
  - `HEADER_BG`
- All color vars support any CSS color format (hex, rgba, hsl, etc.)
- Defaults to light theme; set these for dark or brand-specific themes

## [1.1.5] - 2026-01-07

### Added

- `LINK_HOVER_COLOR` env var to control link hover color (default: `inherit` = no change)

### Changed

- Logo and footer link hovers now use `--link-hover-color` CSS variable
- By default, links don't change color on hover (cleaner look)
- Set `LINK_HOVER_COLOR` to brand color if you want hover effects

## [1.1.4] - 2026-01-07

### Added

- `FONT_CSS_URL` env var for custom/brand fonts (use your own font CSS instead of Google Fonts)
- `getFontLoadingHtml()` helper for centralized font loading logic

### Changed

- Font loading now supports either Google Fonts (default) or custom CSS URL
- If `FONT_CSS_URL` is set, it loads that URL instead of Google Fonts

## [1.1.3] - 2026-01-07

### Added

- `SUCCESS_COLOR` env var for customizable success/confirmation states (default: `#16a34a` green)
- `--success-color` CSS variable for consistent theming

### Changed

- Error page icon now uses brand color instead of hardcoded amber/yellow
- Success states (copied buttons, timestamps) now use `--success-color` CSS variable
- Uses modern `color-mix()` for transparent color variations

### Fixed

- Hardcoded colors that broke white-label theming:
  - Error page amber gradient → brand color at 12% opacity
  - Error icon color → brand color
  - Success green (`#16a34a`) → configurable via `SUCCESS_COLOR`

## [1.1.2] - 2026-01-07

### Changed

- Removed hover shadows from logo and file cards for cleaner look

## [1.1.1] - 2026-01-07

### Changed

- Card click now downloads file by default (matches hover visual cue)
- New `MAIN_ACTION` env var to configure card click behavior ("download" or "open")

## [1.1.0] - 2026-01-07

### Added

- Smart file type handling: images, videos, and PDFs get preview thumbnails; other file types show clean SVG icons without wasted network requests
- File type SVG icons for: videos, PDFs, Word docs, spreadsheets, presentations, archives, audio files, text/code files
- Comprehensive accessibility improvements:
  - Skip-to-content link for keyboard/screen reader users
  - Visible focus indicators (`:focus-visible`) on all interactive elements
  - `aria-label` attributes on icon-only buttons (share, download, open, reset)
  - `aria-live` regions for dynamic announcements (clipboard copy, download progress, history cleared)
  - `prefers-reduced-motion` media query to disable animations
  - Proper heading hierarchy with semantic `<h1>` (visually hidden)
  - File grid converted from `<div>` to semantic `<ul>/<li>` list
  - Keyboard-accessible timestamp tooltip (Enter/Space to toggle, Escape to close, `aria-expanded`)
  - Screen reader announcements for ZIP download progress

### Changed

- Version bump to 1.1.0
- Removed server-side file count limit (MAX_FILES) — configure limits in Uploadcare project settings instead
- Fallback icons now use SVG instead of emoji for consistent styling

### Technical

- Added `extension` field to `FileInfo` interface parsed from filename
- New helper functions: `isVideoExtension()`, `isPdfExtension()`, `getFileTypeIconSvg()`
- New helper function: `getExtensionFromFilename()`

## [1.0.0] - 2026-01-07

### Added

- Health check endpoint (`/health`) for monitoring
- Gallery viewer with thumbnail previews for Uploadcare file groups
- Real filename extraction from Uploadcare Content-Disposition headers
- Download individual files or ZIP all files at once
- "Open All" to open all files in new tabs
- Session-based tracking for opened/downloaded files
- Source page and timestamp metadata support
- Full white-labeling via environment variables (logo, colors, fonts, company name)
- Responsive design for mobile and desktop
- Webflow integration script (`/uc-gallery-connect.js`) for automatic URL transformation
- CDN allowlist security to restrict accepted Uploadcare hosts
- File count validation (1-50 files per group)
- Light mode as default theme
- Retina display support for thumbnails (2x resolution)

### Technical

- `VERSION` and `MAX_FILES` constants for maintainability
- Discriminated union type for `ValidationResult` (type-safe validation)
- Health check endpoint (`/health`) for monitoring
