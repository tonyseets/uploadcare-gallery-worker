/**
 * Gallery page CSS styles
 * 
 * Generates all CSS for the gallery page, including lightbox, grid, and responsive styles.
 */

import type { Env } from '../types';
import {
  getSuccessColor,
  getLinkHoverColor,
  getBgColor,
  getPanelColor,
  getSurfaceColor,
  getBorderColor,
  getTextColor,
  getTextSecondaryColor,
  getTextMutedColor,
  getDefaultGridColumns,
  getImageFit,
  getHeaderBg
} from '../env';

export function getStyles(env: Env): string {
  return `    :root {
      --brand-color: ${env.BRAND_COLOR};
      --success-color: ${getSuccessColor(env)};
      --link-hover-color: ${getLinkHoverColor(env)};
      --brand-bg: ${getBgColor(env)};
      --brand-panel: ${getPanelColor(env)};
      --brand-surface: ${getSurfaceColor(env)};
      --brand-border: ${getBorderColor(env)};
      --text-primary: ${getTextColor(env)};
      --text-secondary: ${getTextSecondaryColor(env)};
      --text-muted: ${getTextMutedColor(env)};
      --grid-columns: ${getDefaultGridColumns(env)};
      --image-fit: ${getImageFit(env)};
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Accessibility: Focus styles */
    :focus-visible {
      outline: 2px solid var(--brand-color);
      outline-offset: 2px;
    }

    :focus:not(:focus-visible) {
      outline: none;
    }

    /* Accessibility: Skip link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      padding: 8px 16px;
      background: var(--brand-color);
      color: white;
      text-decoration: none;
      font-weight: 500;
      z-index: 100;
      transition: top 0.2s;
    }

    .skip-link:focus {
      top: 0;
    }

    /* Accessibility: Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Accessibility: Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    html {
      height: 100%;
    }

    body {
      font-family: '${env.FONT_BODY}', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--brand-bg);
      background-image: radial-gradient(circle at 50% 0%, ${env.BRAND_COLOR}08, transparent 40%);
      background-attachment: fixed;
      color: var(--text-primary);
      min-height: 100%;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
    }

    .font-display {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
    }

    /* Header */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: ${getHeaderBg(env)};
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--brand-border);
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 2.5rem;
      height: 64px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .header-inner {
        padding: 0 1.5rem;
      }
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .share-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-secondary);
      background: transparent;
      border: 1px solid var(--brand-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .share-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
      background: var(--brand-surface);
    }

    .share-btn .check-icon {
      display: none;
    }

    .share-btn.copied {
      color: var(--success-color);
      border-color: var(--success-color);
      background: color-mix(in srgb, var(--success-color) 10%, transparent);
    }

    .share-btn.copied .share-icon {
      display: none;
    }

    .share-btn.copied .check-icon {
      display: block;
    }

    .logo-link {
      position: relative;
      display: flex;
      align-items: center;
    }

    .logo-svg {
      height: 18px;
      width: auto;
      position: relative;
      z-index: 10;
      color: var(--text-primary);
      transition: color 0.3s;
    }

    .logo-link:hover .logo-svg {
      color: var(--link-hover-color);
    }

    .divider {
      height: 24px;
      width: 1px;
      background: var(--brand-border);
    }

    .page-title-link {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      text-decoration: none;
    }
    
    .page-title-link:hover {
      color: var(--link-hover-color);
    }

    /* Main content */
    main {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 2.5rem;
    }

    @media (max-width: 768px) {
      main {
        padding: 1.5rem;
      }
    }

    .content-header {
      margin-bottom: 2rem;
    }

    .content-header h1 {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .meta-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .meta-left a {
      color: var(--text-primary);
      text-decoration: none;
      font-family: '${env.FONT_DISPLAY}', monospace;
    }

    .meta-left a .slug-text {
      text-decoration: underline;
      text-decoration-color: var(--brand-color);
      text-underline-offset: 3px;
      transition: text-decoration-color 0.2s;
    }

    .meta-left a:hover .slug-text {
      text-decoration-color: var(--text-primary);
    }

    .meta-dot {
      color: var(--text-muted);
    }

    .meta-label {
      color: var(--text-secondary);
    }

    .ts-short {
      display: none;
    }

    /* Timestamp wrapper */
    .timestamp-wrap {
      position: relative;
      display: inline-block;
    }


    .timestamp-tooltip {
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) translateY(-4px);
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      padding: 0.5rem 0.75rem;
      margin-top: 10px;
      z-index: 100;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease;
      white-space: nowrap;
      pointer-events: auto;
    }

    /* Invisible bridge to prevent hover gap */
    .timestamp-tooltip::after {
      content: '';
      position: absolute;
      top: -14px;
      left: 0;
      right: 0;
      height: 18px;
    }

    /* Arrow */
    .timestamp-tooltip::before {
      content: '';
      position: absolute;
      top: -5px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 8px;
      height: 8px;
      background: var(--brand-bg);
      border-left: 1px solid var(--brand-border);
      border-top: 1px solid var(--brand-border);
    }

    /* Mobile: tap to toggle */
    .timestamp-tooltip.active {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) translateY(0);
      pointer-events: auto;
    }

    /* Desktop: hover to show (only on devices that support hover) */
    @media (hover: hover) {
      .timestamp-wrap:hover .timestamp-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
        pointer-events: auto;
      }

      .timestamp-wrap:hover .timestamp-text {
        text-decoration-color: var(--text-primary);
        color: var(--text-primary);
      }
    }

    .tooltip-local {
      color: var(--success-color);
      font-weight: 500;
      font-size: 0.8125rem;
    }

    .tooltip-tz {
      color: var(--text-secondary);
      font-size: 0.6875rem;
      margin-top: 0.1875rem;
    }

    .tooltip-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--brand-border);
      pointer-events: auto;
    }

    .tooltip-copy {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: var(--text-secondary);
      background: none;
      border: 1px solid var(--brand-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .tooltip-copy:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .tooltip-copy.copied {
      color: var(--success-color);
      border-color: color-mix(in srgb, var(--success-color) 50%, transparent);
    }

    .tooltip-convert {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      padding: 0.25rem 0.5rem;
      color: var(--text-secondary);
      font-size: 0.6875rem;
      text-decoration: none !important;
      background: none;
      border: 1px solid var(--brand-border);
      transition: all 0.15s;
    }

    .tooltip-convert:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .timestamp-text {
      text-decoration: underline;
      text-decoration-style: dotted;
      text-decoration-color: var(--brand-color);
      text-underline-offset: 3px;
      cursor: pointer;
      color: var(--text-secondary);
      transition: text-decoration-color 0.15s, color 0.15s;
    }

    .timestamp-wrap:has(.timestamp-tooltip.active) .timestamp-text {
      text-decoration-color: var(--text-primary);
      color: var(--text-primary) !important;
    }

    .meta-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .source-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      transition: all 0.15s;
    }

    .source-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .btn.btn-source-mobile {
      display: none;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 0;
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      color: var(--text-secondary);
    }

    .pill-counter {
      gap: 0.3rem;
      padding: 0.35rem 0.5rem;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      font-size: 0.75rem;
      line-height: inherit;
      margin: 0;
    }

    .pill-counter:hover {
      border-color: var(--text-muted);
      color: var(--text-primary);
    }

    .reset-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--brand-panel);
      border: 1px solid var(--brand-border);
      border-radius: 0;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: inherit;
      margin: 0;
      padding: 0.35rem 0.65rem;
      transition: all 0.2s;
    }

    .reset-btn:hover:not(:disabled) {
      color: var(--text-primary);
      border-color: var(--text-muted);
      background: var(--brand-surface);
    }

    .reset-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      background: var(--brand-surface);
      border-color: var(--brand-border);
      color: var(--text-muted);
    }

    .reset-btn svg {
      flex-shrink: 0;
      transition: transform 0.4s ease;
    }

    .reset-btn:hover:not(:disabled) svg {
      transform: rotate(-360deg);
    }

    /* File grid */
    .file-grid {
      display: grid;
      grid-template-columns: repeat(var(--grid-columns), 1fr);
      gap: 1.25rem;
      list-style: none;
    }

    /* Only force 1-column on mobile */
    @media (max-width: 540px) {
      .file-grid {
        grid-template-columns: 1fr;
      }
    }

    .file-card {
      display: flex;
      flex-direction: column;
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      border-radius: 0;
      overflow: hidden;
      transition: all 0.2s ease;
      position: relative;
    }

    .file-card:hover {
      border-color: var(--text-muted);
    }


    .card-main {
      display: block;
      text-decoration: none;
      color: inherit;
      position: relative;
      z-index: 1;
    }

    /* Action checkmarks */
    .action-check {
      display: none;
      position: absolute;
      right: 0.6rem;
      color: var(--text-muted);
    }

    .file-card.opened .open-action .action-check {
      display: inline;
    }

    .file-card.downloaded .download-action .action-check {
      display: inline;
    }

    /* Fade checkmarks when hovering reset buttons */
    body.reset-preview .action-check {
      opacity: 0.3;
      transition: opacity 0.15s ease;
    }

    body.reset-preview-downloads .download-action .action-check {
      opacity: 0.3;
      transition: opacity 0.15s ease;
    }

    body.reset-preview-opens .open-action .action-check {
      opacity: 0.3;
      transition: opacity 0.15s ease;
    }

    /* Bulk action hover previews */
    body.bulk-download-preview .download-action {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    body.bulk-download-preview .open-action {
      opacity: 0.5;
    }

    body.bulk-open-preview .open-action {
      background: var(--brand-surface);
      color: var(--text-primary);
      opacity: 1;
    }

    body.bulk-open-preview .download-action {
      opacity: 0.5;
    }

    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1px;
      background: var(--brand-border);
      border-top: 1px solid var(--brand-border);
    }

    .card-action {
      flex: 1 1 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.6rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-secondary);
      text-decoration: none;
      position: relative;
      transition: all 0.2s;
      background: var(--brand-bg);
    }

    /* Card hover: highlight both action buttons (only when download/open is main action, not lightbox) */
    body[data-main-action="download"] .file-card:hover .card-action,
    body[data-main-action="open"] .file-card:hover .card-action {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    /* Direct button hover always highlights (regardless of main action) */
    .file-card .card-action:hover {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    /* Individual button hover: that one highlighted, sibling fades (only for download/open main actions) */
    body[data-main-action="download"] .file-card:hover .download-action:hover ~ .open-action,
    body[data-main-action="download"] .file-card:hover:has(.download-action:hover) .open-action,
    body[data-main-action="open"] .file-card:hover .download-action:hover ~ .open-action,
    body[data-main-action="open"] .file-card:hover:has(.download-action:hover) .open-action {
      opacity: 0.5;
      background: var(--brand-bg);
      color: var(--text-secondary);
    }

    body[data-main-action="download"] .file-card:hover .open-action:hover ~ .download-action,
    body[data-main-action="download"] .file-card:hover:has(.open-action:hover) .download-action,
    body[data-main-action="open"] .file-card:hover .open-action:hover ~ .download-action,
    body[data-main-action="open"] .file-card:hover:has(.open-action:hover) .download-action {
      opacity: 0.5;
      background: var(--brand-bg);
      color: var(--text-secondary);
    }

    .open-action .arrow-part {
      transition: transform 0.2s;
    }

    .file-card .open-action:hover .arrow-part {
      transform: translate(1px, -1px);
    }

    .download-action .download-arrow {
      transition: transform 0.2s;
    }

    /* Animate download arrow on card hover when download is main action */
    body[data-main-action="download"] .file-card:hover .download-action .download-arrow {
      transform: translateY(1px);
    }

    /* Also animate on direct download button hover (any main action) */
    .file-card .download-action:hover .download-arrow {
      transform: translateY(1px);
    }

    /* But not when open action is hovered (download fades in that case) */
    body[data-main-action="download"] .file-card:hover:has(.open-action:hover) .download-action .download-arrow,
    body[data-main-action="open"] .file-card:hover:has(.open-action:hover) .download-action .download-arrow {
      transform: translateY(0);
    }


    .thumbnail-container {
      aspect-ratio: 16 / 10;
      background: var(--brand-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      position: relative;
    }

    .lightbox-trigger {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s, background 0.15s;
      z-index: 20;
    }

    /* Card hover shows lightbox trigger in full hover state (since lightbox is default action) */
    .file-card:hover .lightbox-trigger {
      opacity: 1;
      background: rgba(255, 255, 255, 0.9);
      color: #111;
    }

    .lightbox-trigger:hover,
    .lightbox-trigger:focus {
      opacity: 1;
      background: rgba(255, 255, 255, 0.9);
      color: #111;
    }

    .lightbox-trigger:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    .thumbnail {
      width: 100%;
      height: 100%;
      object-fit: var(--image-fit);
    }

    .fallback-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--text-muted);
    }

    .fallback-icon svg {
      width: 48px;
      height: 48px;
    }

    .file-info {
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .file-name {
      font-weight: 500;
      color: var(--text-primary);
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }


    /* Actions */
    .actions {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--brand-border);
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
    }

    .actions-left {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
    }

    .actions-right {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 0;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: var(--brand-color);
      color: white;
    }

    .btn-primary:hover {
      filter: brightness(0.85);
      box-shadow: 0 0 20px -5px ${env.BRAND_COLOR}80;
    }

    .btn-primary .download-arrow {
      transition: transform 0.2s;
    }

    .btn-primary:hover .download-arrow {
      transform: translateY(1px);
    }

    .btn-secondary {
      background: var(--brand-surface);
      color: var(--text-primary);
      border: 1px solid var(--brand-border);
    }

    .btn-secondary:hover {
      background: var(--brand-panel);
      border-color: var(--text-muted);
    }

    .btn-secondary .grid-icon {
      transition: transform 0.2s;
    }

    .btn-secondary:hover .grid-icon {
      transform: scale(1.15);
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--brand-border);
      margin-left: auto;
    }

    .btn-ghost:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
      background: var(--brand-surface);
    }

    .btn-ghost .arrow-part {
      transition: transform 0.2s;
    }

    .btn-ghost:hover .arrow-part {
      transform: translate(2px, -2px);
    }

    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Footer */
    footer {
      border-top: 1px solid var(--brand-border);
      margin-top: auto;
    }

    .footer-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 1rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media (max-width: 768px) {
      .footer-inner {
        padding: 1rem 1.5rem;
      }
    }

    .footer-version {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: '${env.FONT_DISPLAY}', monospace;
    }

    .footer-link {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: '${env.FONT_DISPLAY}', monospace;
      text-decoration: none;
      transition: color 0.2s;
    }

    .footer-link:hover {
      color: var(--link-hover-color);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .ts-long {
        display: none;
      }

      .ts-short {
        display: inline;
      }

      .actions {
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
      }

      .actions-left {
        flex-direction: column;
        align-items: stretch;
      }

      .actions-right {
        justify-content: center;
      }

      .source-btn {
        display: none;
      }

      .btn.btn-source-mobile {
        display: inline-flex;
        background: transparent;
        border: 1px solid var(--brand-border);
        color: var(--text-secondary);
      }

      .btn.btn-source-mobile:hover {
        background: var(--brand-surface);
        border-color: var(--text-muted);
        color: var(--text-primary);
        box-shadow: none;
      }

      .divider, .page-title-link {
        display: none;
      }
    }

    /* Error state */
    .error-container {
      max-width: 500px;
      margin: 4rem auto;
      text-align: center;
      padding: 2rem;
    }

    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    /* Grid selector dropdown */
    .grid-selector {
      position: relative;
      display: inline-flex;
      align-self: stretch;
    }

    .grid-selector-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      height: 100%;
      font-size: 0.75rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--text-secondary);
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      cursor: pointer;
      transition: all 0.15s;
    }

    .grid-selector-btn:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .grid-selector-btn svg {
      flex-shrink: 0;
    }

    .grid-selector-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      z-index: 100;
      min-width: 120px;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-4px);
      transition: opacity 0.15s, visibility 0.15s, transform 0.15s;
    }

    .grid-selector.open .grid-selector-menu {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .grid-selector-menu button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
      font-family: inherit;
      color: var(--text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s;
    }

    .grid-selector-menu button:hover {
      background: var(--brand-surface);
      color: var(--text-primary);
    }

    .grid-selector-menu button.active {
      color: var(--text-primary);
      font-weight: 500;
    }

    .grid-selector-menu button .check-icon {
      margin-left: auto;
      opacity: 0;
    }

    .grid-selector-menu button.active .check-icon {
      opacity: 1;
    }

    /* Hide grid selector on mobile (always 1 column anyway) */
    @media (max-width: 540px) {
      .grid-selector {
        display: none;
      }
    }

    /* Lightbox */
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s, visibility 0.2s;
      outline: none;
    }

    .lightbox.active {
      opacity: 1;
      visibility: visible;
    }

    .lightbox-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
    }

    .lightbox-container {
      position: relative;
      max-width: calc(100vw - 3rem);
      max-height: calc(100vh - 3rem);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .lightbox-content {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      max-height: calc(100vh - 6rem);
    }

    .lightbox-content img,
    .lightbox-content video {
      max-width: calc(100vw - 8rem);
      max-height: calc(100vh - 6rem);
      object-fit: contain;
      border-radius: 0;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .lightbox-content video {
      background: #000;
    }

    .lightbox-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%);
      z-index: 10;
    }

    .lightbox-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
      flex: 1;
    }

    .lightbox-header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .lightbox-counter {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.7);
      font-family: var(--font-display), monospace;
      flex-shrink: 0;
    }

    .lightbox-download,
    .lightbox-share {
      position: fixed;
      bottom: 1.5rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      line-height: 1;
      box-sizing: border-box;
      color: var(--text-primary);
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s;
      z-index: 10;
    }

    .lightbox-download {
      right: calc(50% + 0.25rem);
    }

    .lightbox-share {
      left: calc(50% + 0.25rem);
    }

    .lightbox-download:hover,
    .lightbox-share:hover {
      background: var(--brand-surface);
      border-color: var(--text-muted);
    }

    .lightbox-share.copied {
      color: var(--success-color);
      border-color: var(--success-color);
    }

    .lightbox-filename {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .lightbox-meta {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
      white-space: nowrap;
    }

    .lightbox-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      cursor: pointer;
      transition: all 0.15s;
    }

    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .lightbox-close:focus {
      outline: none;
    }

    .lightbox-close:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }

    /* Mobile: hide meta */
    @media (max-width: 640px) {
      .lightbox-meta {
        display: none;
      }
    }

    .lightbox-nav {
      position: fixed;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      cursor: pointer;
      transition: all 0.15s;
    }

    .lightbox-nav:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .lightbox-nav.hidden {
      visibility: hidden;
      pointer-events: none;
    }

    .lightbox-nav.prev {
      left: 1rem;
    }

    .lightbox-nav.next {
      right: 1rem;
    }

    /* PDF iframe in lightbox */
    .lightbox-content iframe {
      width: 80vw;
      height: calc(100vh - 8rem);
      max-width: min(900px, calc(100vw - 8rem));
      border: none;
      border-radius: 0;
      background: white;
    }

    /* Icon fallback for non-previewable files */
    .lightbox-icon-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: white;
    }
    .lightbox-icon-fallback svg {
      width: 96px;
      height: 96px;
      stroke: white;
      opacity: 0.9;
    }
    .lightbox-icon-fallback .fallback-filename {
      font-size: 1.125rem;
      font-weight: 500;
      max-width: 80vw;
      text-align: center;
      word-break: break-word;
    }

    /* Audio player in lightbox */
    .lightbox-audio-player {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 0;
      backdrop-filter: blur(8px);
      min-width: 320px;
      max-width: min(90vw, calc(100vw - 8rem));
    }
    .lightbox-audio-player .audio-icon {
      width: 64px;
      height: 64px;
      stroke: white;
    }
    .lightbox-audio-player .audio-filename {
      font-size: 1rem;
      font-weight: 500;
      color: white;
      max-width: 100%;
      text-align: center;
      word-break: break-word;
    }
    .audio-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }
    .audio-play-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--brand-color);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .audio-play-btn .play-icon {
      margin-left: 3px; /* Optical centering for triangle */
    }
    .audio-play-btn:hover {
      opacity: 0.9;
    }
    .audio-progress {
      flex: 1;
      height: 6px;
      background: rgba(255,255,255,0.2);
      border-radius: 3px;
      cursor: pointer;
      position: relative;
    }
    .audio-progress-fill {
      height: 100%;
      background: var(--brand-color);
      border-radius: 3px;
      width: 0%;
      transition: width 0.1s linear;
    }
    .audio-time {
      font-size: 0.75rem;
      color: rgba(255,255,255,0.8);
      font-variant-numeric: tabular-nums;
      min-width: 80px;
      text-align: right;
    }

`;
}
