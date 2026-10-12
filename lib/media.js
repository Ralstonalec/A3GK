import media from '../data/media.json';

/**
 * Media slots (data/media.json). Everything photographic on the home page is
 * read from here so swapping in real photography never needs a code change.
 */
export const MEDIA = media;

/** Expand `{ pattern: '/images/360/jersey-{n}.webp', count: 36, pad: 2 }` to a URL list. */
export function frameUrls(frames) {
  if (!frames || !frames.pattern || !frames.count) return [];
  const pad = frames.pad ?? String(frames.count).length;
  return Array.from({ length: frames.count }, (_, i) => frames.pattern.replace('{n}', String(i + 1).padStart(pad, '0')));
}

/** Is there anything for the 360° viewer to show? */
export function hasViewerMedia(viewer = media.viewer) {
  return frameUrls(viewer?.frames).length > 1 || Boolean(viewer?.modelUrl);
}
