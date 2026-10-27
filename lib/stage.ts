/**
 * Mutable state shared between DOM controls and the 3D scene. Read inside useFrame, never in React render,
 * so pointer and scroll updates cost no re-renders.
 */
export type View = 'set' | 'top' | 'legs';

export const stage = {
  mouse: { x: 0, y: 0 }, // -0.5..0.5
  ndc: { x: 0, y: 0 }, // -1..1, y up
  view: 'set' as View,
  fx: { spin: 0, blur: 0, implode: 0 },
  reshuffle: 0,
  switching: false,
  live: false,
  el: null as HTMLElement | null,
  requestView: null as null | ((v: View) => void),
};
