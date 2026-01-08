# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
- Webflow integration script (`/uploader.js`) for automatic URL transformation
- CDN allowlist security to restrict accepted Uploadcare hosts
- File count validation (1-50 files per group)
- Light mode as default theme
- Retina display support for thumbnails (2x resolution)

### Technical

- `VERSION` and `MAX_FILES` constants for maintainability
- Discriminated union type for `ValidationResult` (type-safe validation)
- Health check endpoint (`/health`) for monitoring
