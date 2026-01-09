/**
 * File handling utilities
 * 
 * Extension checks, file fetching, and formatting functions.
 */

import type { Env, FileInfo } from './types';
import { HEAD_REQUEST_CONCURRENCY } from './env';

// Extension checks
export function isImageExtension(ext: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
}

export function isVideoExtension(ext: string): boolean {
  return ['mp4', 'mov', 'avi', 'webm', 'mkv', 'flv', 'wmv', 'm4v', '3gp'].includes(ext);
}

export function isPdfExtension(ext: string): boolean {
  return ext === 'pdf';
}

export function isAudioExtension(ext: string): boolean {
  return ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'aiff'].includes(ext);
}

// Get file extension from URL
export function getFileExtension(url: string): string {
  // Try to extract extension from URL path
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : '';
}

// Get file extension from filename
export function getExtensionFromFilename(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

// Determine what type of preview to show in lightbox
// Returns: 'image' | 'video' | 'pdf' | 'audio' | 'icon'
export function getPreviewType(ext: string, env: Env, pdfPreviewEnabled: boolean, audioPreviewEnabled: boolean): string {
  if (isImageExtension(ext)) return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (isPdfExtension(ext) && pdfPreviewEnabled) return 'pdf';
  if (isAudioExtension(ext) && audioPreviewEnabled) return 'audio';
  return 'icon';
}

// Format timestamp for display (long format)
export function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm} UTC`;
}

// Format timestamp for display (short format)
export function formatTimestampShort(ts: number): string {
  const date = new Date(ts * 1000);
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear().toString().slice(-2);
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

// Check if file can be previewed in lightbox (images + browser-native video formats)
export function isLightboxPreviewable(ext: string): boolean {
  return isImageExtension(ext) || ['mp4', 'webm', 'mov'].includes(ext);
}

// Fetch single file info via HEAD request
export async function fetchSingleFileInfo(baseUrl: string, index: number): Promise<FileInfo> {
  const fileUrl = `${baseUrl}/nth/${index}/`;
  try {
    const response = await fetch(fileUrl, { method: 'HEAD' });
    const contentDisposition = response.headers.get('Content-Disposition') || '';
    // Parse filename from: inline; filename="somefile.png"
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : `File ${index + 1}`;
    const extension = getExtensionFromFilename(filename);
    return { index, url: fileUrl, filename, extension };
  } catch {
    return { index, url: fileUrl, filename: `File ${index + 1}`, extension: '' };
  }
}

// Fetch file infos with concurrency limiting to avoid overwhelming Uploadcare
export async function fetchFileInfos(host: string, groupId: string, count: number): Promise<FileInfo[]> {
  const baseUrl = `https://${host}/${groupId}~${count}`;
  const results: FileInfo[] = [];

  // Process in batches of HEAD_REQUEST_CONCURRENCY (20)
  for (let i = 0; i < count; i += HEAD_REQUEST_CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(HEAD_REQUEST_CONCURRENCY, count - i) },
      (_, j) => fetchSingleFileInfo(baseUrl, i + j)
    );
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results.sort((a, b) => a.index - b.index);
}
