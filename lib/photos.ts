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

export type Promo = { id: 'dive' | 'stance' | 'closeup' | 'banner'; src: string; w: number; h: number; alt: string; caption?: string };

/**
 * AI-generated promo renderings of the padded base layer on a body (the back has NO padding and is never shown,
 * see docs/IMAGE-RULES.md). Always labelled "Rendering". No faces. Add an entry here once the file exists in /public/photos.
 */
export const PROMO: Promo[] = [
  { id: 'stance', src: '/photos/promo-under-stance.webp', w: 1100, h: 1289, alt: 'Rendering of a goalkeeper in a ready stance in a short-sleeve jersey and shorts over the A3GK base layer: honeycomb panels show on the forearms and knees where the base layer is exposed', caption: 'Under a short-sleeve jersey and shorts' },
  { id: 'closeup', src: '/photos/promo-under-elbow.webp', w: 1600, h: 1194, alt: 'Rendering of the A3GK base layer elbow and forearm panel showing below a short jersey sleeve', caption: 'Elbow panel below a short sleeve' },
  { id: 'banner', src: '/photos/promo-banner.webp', w: 2000, h: 848, alt: 'Rendering of the A3GK padded top and leggings side by side on a dark studio floor' },
];

export type ShortImage = { src: string; w: number; h: number; alt: string; caption?: string };

/**
 * AI-generated renderings of the short-sleeve top and padded shorts, made from the owner's product photos
 * (same padding as the long-sleeve set minus the elbow and knee panels). No faces, no back shown. Always labelled "Rendering".
 */
export const SHORT_SET: { banner: ShortImage; stance: ShortImage; closeup: ShortImage } = {
  banner: { src: '/photos/short-banner.webp', w: 2000, h: 848, alt: 'Rendering of the A3GK short-sleeve padded top and padded shorts with a COMPRESSION waistband, side by side on a dark studio floor' },
  stance: { src: '/photos/short-stance.webp', w: 1100, h: 1377, alt: 'Rendering of a goalkeeper in a ready stance wearing the A3GK short-sleeve padded top and padded shorts, with honeycomb panels on the chest, ribs, sleeves and hips and thighs', caption: 'Top and shorts worn together' },
  closeup: { src: '/photos/short-closeup.webp', w: 1600, h: 1195, alt: 'Rendering close-up of the A3GK short-sleeve top: chest panel, two rib panels and a panel on the short sleeve', caption: 'Chest, rib and sleeve panels' },
};
