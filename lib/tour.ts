/**
 * Padded-area zones the home page film moves across, as rectangles in the studio render (2000x1116 px).
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
