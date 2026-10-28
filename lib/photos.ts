/**
 * Imagery. RENDER is a photoreal rendering generated from photographs of the real garments (it is a rendering,
 * not a photograph — it is always captioned as such). MACRO are real photographs produced by
 * scripts/process-photos.py from the supplied flat lays.
 */
export const RENDER = {
  src: '/photos/render-set.webp',
  w: 2000,
  h: 1116,
  alt: 'Rendering of the A3GK padded base layer: a black mock-neck long-sleeve top with a bib chest panel, two rib panels and long arm panels, beside black leggings with a printed waistband, hip and thigh panels and knee panels',
};

export const MACRO = [
  { id: 'chest', src: '/photos/pad-chest.webp', w: 450, h: 360, label: 'Chest panel' },
  { id: 'ribs', src: '/photos/pad-ribs.webp', w: 500, h: 310, label: 'Rib panel' },
  { id: 'upper-arm', src: '/photos/pad-upper-arm.webp', w: 350, h: 340, label: 'Upper-arm panel' },
  { id: 'forearm', src: '/photos/pad-forearm.webp', w: 290, h: 460, label: 'Elbow and forearm panel' },
  { id: 'hip-thigh', src: '/photos/pad-hip-thigh.webp', w: 610, h: 510, label: 'Hip and thigh panels' },
  { id: 'knee', src: '/photos/pad-knee.webp', w: 590, h: 430, label: 'Knee panel' },
  { id: 'waistband', src: '/photos/waistband.webp', w: 150, h: 590, label: 'Printed waistband' },
] as const;

export type Promo = { id: 'dive' | 'stance' | 'closeup' | 'banner'; src: string; w: number; h: number; alt: string };

/**
 * AI-generated promo renderings of the padded base layer on a body (front views only: the back has NO padding,
 * see docs/IMAGE-RULES.md). Always labelled "Rendering". Add an entry here once the file exists in /public/photos.
 */
export const PROMO: Promo[] = [
  { id: 'dive', src: '/photos/promo-dive.webp', w: 1800, h: 1004, alt: 'Rendering of a goalkeeper diving for a save at night in the A3GK padded base layer, with honeycomb panels on the chest, ribs, arm, hip and knee' },
  { id: 'stance', src: '/photos/promo-stance.webp', w: 1100, h: 1474, alt: 'Rendering of a goalkeeper in a ready stance facing the camera in the A3GK padded base layer, with panels on the chest, ribs, arms, hips and knees' },
  { id: 'banner', src: '/photos/promo-banner.webp', w: 2000, h: 848, alt: 'Rendering of the A3GK padded top and leggings side by side on a dark studio floor' },
];
