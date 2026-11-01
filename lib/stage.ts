/**
 * Mutable state shared between DOM controls and the 3D scene. Read inside useFrame, never in React render,
 * so pointer and scroll updates cost no re-renders.
 */
export type View = 'set' | 'top' | 'legs';

export const stage = {
  mouse: { x: 0, y: 0 }, // -0.5..0.5
  ndc: { x: 0, y: 0 }, // -1..1, y up
  view: 'set' as View,
  fx: { blur: 0 },
  padZone: -1,
  tour: null as number | null, // fractional tour position (0..zones-1) while the tour section is on screen
  live: false,
  el: null as HTMLElement | null,
  requestView: null as null | ((v: View) => void),
};
