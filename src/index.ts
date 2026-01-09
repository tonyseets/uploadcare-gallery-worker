/**
 * Uploadcare Gallery Worker
 * 
 * Transforms Uploadcare group URLs into a clean, branded gallery
 * with thumbnails, download buttons, and session-based tracking.
 * 
 * Fully white-labelable via wrangler.toml [vars].
 * 
 * @see README.md for setup instructions
 * @see wrangler.toml.example for configuration options
 */

import type { Env } from './types';
import { validateUrl } from './validation';
import { fetchFileInfos } from './files';
import { generateHtml, generateErrorHtml } from './html';
import { UC_GALLERY_CONNECT_SCRIPT } from './connect-script';
import {
  VERSION,
  getScriptBrowserCacheSeconds,
  getScriptCdnCacheSeconds,
  getGalleryCacheSeconds,
  getContentSecurityPolicy,
  isDemoEnabled
} from './env';
import { getDemoFileInfos, DEMO_GROUP_ID, DEMO_HOST } from './demo';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check endpoint for monitoring
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', version: VERSION }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Demo mode: preview gallery with mock files (opt-in via ENABLE_DEMO env var)
    if (url.pathname === '/demo') {
      if (!isDemoEnabled(env)) {
        return new Response('Demo mode is not enabled. Set ENABLE_DEMO="true" in wrangler.toml to enable.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      const demoFiles = getDemoFileInfos();
      const html = generateHtml(
        env,
        DEMO_HOST,
        DEMO_GROUP_ID,
        demoFiles.length,
        `https://${DEMO_HOST}/${DEMO_GROUP_ID}~${demoFiles.length}/`,
        'demo-page',
        Math.floor(Date.now() / 1000),  // Unix timestamp in seconds
        demoFiles,
        true  // demoMode
      );
      
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-cache',
          'Content-Security-Policy': getContentSecurityPolicy(env),
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });
    }
    
    // Serve the UC Gallery Connect script (ETag-based caching)
    if (url.pathname === '/uc-gallery-connect.js') {
      const etag = `"${VERSION}"`;
      const ifNoneMatch = request.headers.get('If-None-Match');
      
      // Return 304 if ETag matches (content unchanged)
      if (ifNoneMatch === etag) {
        return new Response(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': `public, max-age=${getScriptBrowserCacheSeconds(env)}, s-maxage=${getScriptCdnCacheSeconds(env)}`,
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Check for debug mode
      const debug = url.searchParams.get('debug') === 'true';
      
      // Generate script with configured worker URL and debug flag
      const script = UC_GALLERY_CONNECT_SCRIPT
        .replace("'__WORKER_URL__'", `'${env.WORKER_URL}'`)
        .replace("const DEBUG = false;", `const DEBUG = ${debug};`);
      
      return new Response(script, {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript; charset=UTF-8',
          'Cache-Control': `public, max-age=${getScriptBrowserCacheSeconds(env)}, s-maxage=${getScriptCdnCacheSeconds(env)}`,
          'ETag': etag,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Get the Uploadcare URL from query param
    const uploadcareUrl = url.searchParams.get('url');
    
    // Get optional metadata params
    const pageSlug = url.searchParams.get('from') || '';
    const tsParam = url.searchParams.get('ts');
    const timestamp = tsParam ? parseInt(tsParam, 10) : null;

    // Validate the URL
    const validation = validateUrl(uploadcareUrl || '', env);

    if (!validation.valid) {
      return new Response(generateErrorHtml(env, validation.error), {
        status: 400,
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Content-Security-Policy': getContentSecurityPolicy(env),
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
      });
    }

    const { host, groupId, count } = validation;

    // Fetch file info (filenames) from Uploadcare
    const fileInfos = await fetchFileInfos(host, groupId, count);

    // Generate and return the gallery HTML
    const html = generateHtml(
      env,
      host,
      groupId,
      count,
      uploadcareUrl!,
      pageSlug,
      timestamp,
      fileInfos
    );

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': `public, max-age=${getGalleryCacheSeconds(env)}`,
        'Content-Security-Policy': getContentSecurityPolicy(env),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    });
  }
};
