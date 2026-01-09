/**
 * Demo mode data for testing gallery branding/UI
 * 
 * Provides mock file data so developers can preview the gallery
 * without needing real Uploadcare files.
 */

import type { FileInfo } from './types';

// Demo constants (not real Uploadcare values)
export const DEMO_GROUP_ID = 'demo-gallery';
export const DEMO_HOST = 'demo.example.com';

/**
 * Returns mock FileInfo array with a variety of file types.
 * 
 * Uses publicly available media files for realistic demo:
 * - Images: picsum.photos (random beautiful photos)
 * - Video: MDN sample video (CC0)
 * - Audio: MDN sample audio (CC0)
 * - PDF: W3C test PDF
 * - Documents: placeholder URLs (show icons only)
 */
export function getDemoFileInfos(): FileInfo[] {
  return [
    // Images - picsum.photos for real working thumbnails
    {
      index: 0,
      url: 'https://picsum.photos/id/1015/800/600',
      filename: 'mountain-landscape.jpg',
      extension: 'jpg'
    },
    {
      index: 1,
      url: 'https://picsum.photos/id/1025/800/600',
      filename: 'dog-portrait.png',
      extension: 'png'
    },
    {
      index: 2,
      url: 'https://picsum.photos/id/1035/800/600',
      filename: 'waterfall-scenic.webp',
      extension: 'webp'
    },
    // Video - real playable video (MDN CC0 sample)
    {
      index: 3,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      filename: 'flower-timelapse.mp4',
      extension: 'mp4'
    },
    // Audio - real playable audio (MDN CC0 sample)
    {
      index: 4,
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
      filename: 't-rex-roar.mp3',
      extension: 'mp3'
    },
    // PDF - real viewable PDF (W3C test)
    {
      index: 5,
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      filename: 'sample-document.pdf',
      extension: 'pdf'
    },
    // Generic document - icon only (placeholder URL)
    {
      index: 6,
      url: 'https://demo.example.com/files/meeting-notes.docx',
      filename: 'meeting-notes.docx',
      extension: 'docx'
    },
    // Archive - icon only (placeholder URL)
    {
      index: 7,
      url: 'https://demo.example.com/files/project-assets.zip',
      filename: 'project-assets.zip',
      extension: 'zip'
    }
  ];
}
