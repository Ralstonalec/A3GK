/**
 * Padded-area zones the 3D tour moves across, as rectangles in the studio render (2000x1116 px).
 * Kept free of three.js so the DOM overlay can use it without loading the 3D bundle.
 */
export type Rect = [number, number, number, number]; // x, y, w, h in render pixels

export const TOUR: { id: string; rect: Rect }[] = [
  { id: 'chest', rect: [515, 221, 268, 229] },
  { id: 'ribs', rect: [421, 457, 386, 172] },
  { id: 'upper-arms', rect: [250, 193, 114, 236] },
  { id: 'elbows', rect: [221, 471, 122, 272] },
  { id: 'hips-thighs', rect: [1593, 164, 136, 372] },
  { id: 'knees', rect: [1571, 579, 129, 200] },
];

// Same maths the camera uses (see RenderPlane), so the on-screen frame lands exactly on the zoomed zone.
const RW = 2000;
const RH = 1116;
const PH = 3;
const PW = PH * (RW / RH);
const WORLD_H = 2 * 6.5 * Math.tan((30 * Math.PI) / 360); // camera fov 30 at z 6.5

/** Size in CSS pixels of tour zone i as it appears when the camera has zoomed onto it. */
export function tourBox(i: number, W: number, H: number): { w: number; h: number } {
  const narrow = W / H < 0.85;
  const worldW = WORLD_H * (W / H);
  const r = TOUR[i].rect;
  const rw = (r[2] / RW) * PW;
  const rh = (r[3] / RH) * PH;
  const s = Math.min(2.6, Math.max(0.2, Math.min((worldW * (narrow ? 0.92 : 0.5)) / rw, (WORLD_H * (narrow ? 0.3 : 0.62)) / rh)));
  const px = H / WORLD_H;
  return { w: rw * s * px, h: rh * s * px };
}
