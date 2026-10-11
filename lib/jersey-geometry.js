/**
 * Jersey outline geometry on a 600 × 640 canvas.
 *
 * Plain SVG path strings so the exact same shapes drive:
 *   • the live <canvas> preview in the Design Studio (via Path2D)
 *   • the build-time product artwork (scripts/generate-assets.mjs → SVG → WebP)
 *   • the Shopify theme's vanilla-JS customizer (copied by `npm run theme:sync`)
 *
 * Only absolute M / L / C / Q / Z commands are used so mirrorPath() can flip
 * a shape by transforming every x coordinate.
 */

export const JERSEY_SIZE = { width: 600, height: 640 };

/** Mirror an absolute-coordinate path around the vertical centre line. */
export function mirrorPath(d, width = JERSEY_SIZE.width) {
  let index = 0;
  return d.replace(/-?\d+(?:\.\d+)?/g, (num) => {
    const isX = index % 2 === 0;
    index += 1;
    return isX ? String(Number((width - Number(num)).toFixed(2))) : num;
  });
}

// Right half (viewer's right) hand-authored; left half derived by mirroring.
const SLEEVE_R = 'M450 104 C486 134 542 300 574 468 L482 494 C462 420 440 340 424 294 C432 236 442 170 450 104 Z';
const CUFF_R = 'M574 468 L482 494 L476 458 L563 432 Z';
const TORSO_CORE = 'M238 70 C262 122 338 122 362 70 L450 104 C442 170 432 236 424 294 C428 400 430 500 428 592 C360 608 240 608 172 592 C170 500 172 400 176 294 C168 236 158 170 150 104 Z';

export const JERSEY_PATHS = {
  /** Whole silhouette (torso + both sleeves) – used for clipping + outline. */
  body:
    'M238 70 C262 122 338 122 362 70 L450 104 C486 134 542 300 574 468 L482 494 C462 420 440 340 424 294 C428 400 430 500 428 592 C360 608 240 608 172 592 C170 500 172 400 176 294 C160 340 138 420 118 494 L26 468 C58 300 114 134 150 104 Z',
  torso: TORSO_CORE,
  sleeveRight: SLEEVE_R,
  sleeveLeft: mirrorPath(SLEEVE_R),
  cuffRight: CUFF_R,
  cuffLeft: mirrorPath(CUFF_R),
  /** Dark inside of the neck opening (front view). */
  neckHoleFront: 'M238 70 C252 56 348 56 362 70 C338 122 262 122 238 70 Z',
  /** Back view: higher, flatter neckline. */
  neckHoleBack: 'M238 70 C252 56 348 56 362 70 C340 90 260 90 238 70 Z',
  collarFront: 'M238 70 C262 122 338 122 362 70',
  collarBack: 'M238 70 C260 90 340 90 362 70',
  hem: 'M172 592 C240 608 360 608 428 592 L429 566 C360 580 240 580 171 566 Z',
};

/** Rotated ellipse patches (elbow guards). cx/cy are canvas coordinates. */
export const ELBOW_PATCHES = [
  { cx: 505, cy: 368, rx: 27, ry: 50, rotation: -0.27 },
  { cx: 95, cy: 368, rx: 27, ry: 50, rotation: 0.27 },
];

/** Anchor points for artwork, in canvas coordinates. */
export const ANCHORS = {
  front: {
    'chest-left': { x: 370, y: 200 },
    'chest-center': { x: 300, y: 215 },
    'lower-front': { x: 300, y: 470 },
    number: { x: 300, y: 330 },
  },
  back: {
    name: { x: 300, y: 205 },
    number: { x: 300, y: 365 },
    'upper-back': { x: 300, y: 138 },
  },
};

export const LOGO_PLACEMENTS = [
  { id: 'chest-left', label: 'Left chest', view: 'front' },
  { id: 'chest-center', label: 'Chest centre', view: 'front' },
  { id: 'lower-front', label: 'Lower front', view: 'front' },
  { id: 'upper-back', label: 'Upper back', view: 'back' },
];
