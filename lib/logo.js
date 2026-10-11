import { MAX_LOGO_DATA_URL_LENGTH } from './validation';

/**
 * Client-side logo ingestion for the Design Studio.
 *
 * Whatever the visitor uploads is DECODED and RE-ENCODED through a canvas, so
 * the stored result is always a clean, downscaled raster image: EXIF/GPS
 * metadata is dropped and nothing executable (e.g. SVG script, polyglot files)
 * can ride along. SVG input is rejected outright.
 */

export const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_LOGO_FILE_BYTES = 6 * 1024 * 1024;
const MAX_EDGE = 512;

export class LogoError extends Error {}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new LogoError('That file could not be read as an image.'));
    img.src = url;
  });
}

/**
 * @param {File} file
 * @returns {Promise<{ dataUrl: string, image: HTMLImageElement, width: number, height: number }>}
 */
export async function processLogoFile(file) {
  if (!ACCEPTED_LOGO_TYPES.includes(file.type)) throw new LogoError('Please upload a PNG, JPEG or WebP image.');
  if (file.size > MAX_LOGO_FILE_BYTES) throw new LogoError('That file is over 6 MB. Please choose a smaller image.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const source = await loadImage(objectUrl);
    const ratio = Math.min(1, MAX_EDGE / Math.max(source.naturalWidth, source.naturalHeight));
    const width = Math.max(1, Math.round(source.naturalWidth * ratio));
    const height = Math.max(1, Math.round(source.naturalHeight * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(source, 0, 0, width, height);

    // Re-encode as WebP (keeps transparency), stepping quality down until it fits the API limit.
    let dataUrl = '';
    for (const quality of [0.9, 0.8, 0.68, 0.55, 0.4]) {
      dataUrl = canvas.toDataURL('image/webp', quality);
      if (dataUrl.startsWith('data:image/webp') && dataUrl.length <= MAX_LOGO_DATA_URL_LENGTH) break;
      if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/png'); // very old browsers
    }
    if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) throw new LogoError('That image is too detailed to store. Try a simpler or smaller logo.');

    const image = await loadImage(dataUrl);
    return { dataUrl, image, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Rebuild an <img> from a stored data URL (loading a saved design). */
export function imageFromDataUrl(dataUrl) {
  return loadImage(dataUrl);
}
