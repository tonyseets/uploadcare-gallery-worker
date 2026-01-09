/**
 * Error page HTML generation
 * 
 * Generates HTML for error pages when URL validation fails.
 */

import type { Env } from '../types';
import { escapeHtml } from '../utils';
import { getFontLoadingHtml } from '../fonts';
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
  getHeaderBg,
  VERSION
} from '../env';

export function generateErrorHtml(env: Env, error: string): string {
  // Extract domain from company URL for display
  const companyDomain = env.COMPANY_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Escape error message for safe HTML embedding
  const escapedError = escapeHtml(error);
  
  // Logo HTML - prefer SVG, fall back to URL
  const logoHtml = env.LOGO_SVG 
    ? env.LOGO_SVG 
    : env.LOGO_URL 
      ? `<img src="${env.LOGO_URL}" alt="${env.COMPANY_NAME}" class="logo-img" style="height: 18px; width: auto;" />`
      : `<span class="logo-text" style="font-weight: 600; font-size: 1rem;">${env.COMPANY_NAME}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <meta name="description" content="File attachments for ${env.COMPANY_NAME} form submissions.">
  <title>Error - ${env.COMPANY_NAME} Attachments</title>
  <link rel="icon" href="${env.FAVICON_URL}">
  ${getFontLoadingHtml(env)}
  <style>
    :root {
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
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: '${env.FONT_BODY}', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--brand-bg);
      background-image: radial-gradient(circle at 50% 0%, ${env.BRAND_COLOR}08, transparent 40%);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: ${getHeaderBg(env)};
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--brand-border);
    }

    .header-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 64px;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logo-link {
      position: relative;
      display: flex;
      align-items: center;
    }

    .logo-svg {
      height: 18px;
      width: auto;
      color: var(--text-primary);
      position: relative;
      z-index: 10;
      transition: color 0.3s;
    }

    .logo-link:hover .logo-svg { color: var(--link-hover-color); }

    .divider {
      height: 24px;
      width: 1px;
      background: var(--brand-border);
    }

    .page-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }

    .error-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .error-card {
      background: var(--brand-bg);
      border: 1px solid var(--brand-border);
      padding: 3rem 2.5rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    }

    .error-icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: color-mix(in srgb, var(--brand-color) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--brand-color) 30%, transparent);
      margin-bottom: 1.5rem;
    }

    .error-icon-wrap svg {
      width: 32px;
      height: 32px;
      color: var(--brand-color);
    }

    .error-title {
      font-family: '${env.FONT_DISPLAY}', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
    }

    .error-message {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.5;
      margin-bottom: 1.75rem;
    }

    .error-code {
      display: inline-block;
      background: var(--brand-surface);
      border: 1px solid var(--brand-border);
      padding: 0.25rem 0.5rem;
      font-family: '${env.FONT_DISPLAY}', monospace;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--brand-color);
      color: white;
      border-radius: 0;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      width: 100%;
    }

    .btn:hover {
      filter: brightness(0.9);
      box-shadow: 0 0 20px -5px ${env.BRAND_COLOR}80;
    }

    .btn svg {
      transition: transform 0.2s;
    }

    .btn:hover svg {
      transform: translateX(2px);
    }

    footer {
      border-top: 1px solid var(--brand-border);
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

    @media (max-width: 640px) {
      .divider, .page-title { display: none; }
      .error-card { padding: 2rem 1.5rem; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner">
      <a href="${env.COMPANY_URL}" target="_blank" rel="noopener noreferrer nofollow" class="logo-link">
        ${logoHtml}
      </a>
      <div class="divider"></div>
      <span class="page-title">ATTACHMENTS</span>
    </div>
  </header>

  <div class="error-wrapper">
    <div class="error-card">
      <div class="error-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <h1 class="error-title">Unable to Load Attachments</h1>
      <p class="error-message">${escapedError}</p>
      <a href="${env.COMPANY_URL}" rel="noopener noreferrer nofollow" class="btn">
        Go to ${env.COMPANY_NAME}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
      </a>
    </div>
  </div>

  <footer>
    <div class="footer-inner">
      <span class="footer-version">Attachment Viewer v${VERSION}</span>
      <a href="${env.COMPANY_URL}" target="_blank" rel="noopener noreferrer nofollow" class="footer-link">${companyDomain}</a>
    </div>
  </footer>
</body>
</html>`;
}
