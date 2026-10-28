/** Real photographs of the garments, produced by scripts/process-photos.py from the supplied flat lays. */
export const PHOTOS = {
  top: { src: '/photos/top-cutout.webp', w: 1490, h: 1150, alt: 'The A3GK padded top laid flat: mock neck, long sleeves, a bib-shaped chest panel, two rib panels, and upper-arm and forearm panels' },
  legs: { src: '/photos/leggings-cutout.webp', w: 707, h: 1509, alt: 'The A3GK padded leggings laid flat: printed waistband, joined hip and thigh panels, and a knee panel' },
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
