# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [1.0.0] - 2026-01-07

### Added

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
