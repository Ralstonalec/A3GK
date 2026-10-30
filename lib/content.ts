/**
 * Single source of truth for launch copy and the list of facts still to be confirmed.
 *
 * Anything the business has not yet confirmed is `null` here and renders as a visible
 * "To confirm" marker via <Tbc/>. Do NOT replace these with invented specifications.
 * See docs/PRE-LAUNCH-CHECKLIST.md — every `null` must be filled or removed before launch.
 */

export const SITE = {
  name: 'A3GK',
  legalName: 'A3 Goalkeeping',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};

export const HANDLES = {
  base: 'padded-base-layer', // the "build your kit" page; the pieces below are the products in Shopify
  longTop: 'long-sleeve-top',
  shortTop: 'short-sleeve-top',
  leggings: 'leggings',
  shorts: 'shorts',
  socks: 'grip-socks',
  bandages: 'sports-bandages',
} as const;

/** Each piece is sold on its own and in any combination: one top, one bottom, both or either. */
export const PIECES = {
  tops: [
    { handle: HANDLES.longTop, label: 'Long-sleeve top', padding: 'Chest, ribs, upper arms, and elbows and forearms.' },
    { handle: HANDLES.shortTop, label: 'Short-sleeve top', padding: 'Chest, ribs and a panel on each short sleeve. No elbow panels.' },
  ],
  bottoms: [
    { handle: HANDLES.leggings, label: 'Leggings', padding: 'Joined hip-and-thigh panel and a knee panel on each leg.' },
    { handle: HANDLES.shorts, label: 'Shorts', padding: 'Joined hip-and-thigh panel on each leg. No knee panels.' },
  ],
} as const;

export const NAV = [
  { label: 'Padded Base Layer', href: `/products/${HANDLES.base}` },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Other Essentials', href: '/#complete-your-kit' },
  { label: 'The Club', href: '/club' },
  { label: 'About A3GK', href: '/about' },
  { label: 'Help', href: '/help' },
];

/** Owner-supplied guidance: wearing it with short sleeves or shorts is possible but not recommended. */
export const WEAR_NOTE = 'You can wear the base layer under a short-sleeve jersey and shorts, but we do not recommend it. Leaving the sleeves and legs exposed can reduce its durability. It is designed to sit fully under a long-sleeve jersey and long pants.';

/** Facts about the base layer. `null` = not yet confirmed. */
export const BASE_LAYER = {
  // From the supplied product photograph: a long-sleeve top and leggings. CONFIRM before launch,
  // including whether they are sold together or separately (piecesSoldTogether).
  garmentType: 'mock-neck long-sleeve top and full-length leggings' as string | null,
  productName: 'A3GK Padded Base Layer', // working name from brief; confirm exact name
  included: 'Only the pieces you choose. Every top and bottom is sold on its own, so you can buy one piece or any combination.' as string | null,
  piecesSoldTogether: false as boolean | null, // confirmed by the owner: pieces are sold individually and in any combination
  fabricComposition: null as string | null,
  paddingSpec: null as string | null, // only manufacturer-verified information
  intendedFit: null as string | null,
  care: null as string | null,
  origin: null as string | null,
  fulfilment: null as string | null,
  /** Only padded areas that really exist. Empty until confirmed — hotspots/labels render nothing. */
  paddedAreas: [
    // Read from photographs of the real garments. CONFIRM before launch.
    { id: 'chest', label: 'Chest', description: 'One bib-shaped panel across the front of the chest (top).' },
    { id: 'ribs', label: 'Ribs', description: 'A wide panel on each side of the lower front (top).' },
    { id: 'upper-arms', label: 'Upper arms', description: 'A long panel on the outer upper arm of each sleeve (top).' },
    { id: 'elbows', label: 'Elbows and forearms', description: 'A panel over each elbow, running down the forearm (top).' },
    { id: 'hips-thighs', label: 'Hips and thighs', description: 'A hip panel joined to a larger thigh panel on each leg (leggings).' },
    { id: 'knees', label: 'Knees', description: 'A panel over each knee (leggings).' },
  ] as { id: string; label: string; description: string }[],
};

export const SIZE_GUIDE = {
  /** 'body' | 'garment' — must be stated before launch. */
  measurementType: null as 'body' | 'garment' | null,
  unit: 'cm',
  columns: [] as string[], // e.g. ['Size','Chest','Waist','Height']
  rows: [] as string[][],
  howToMeasure: null as string | null,
};

export const POLICIES = {
  contactEmail: null as string | null,
  processingTime: null as string | null,
  productionTime: null as string | null,
  transitTime: null as string | null,
  deliveryEstimate: null as string | null,
  separateShipments: null as string | null,
  returnsWindow: null as string | null,
  sizeExchanges: null as string | null,
  returnProcess: null as string | null,
  returnCosts: null as string | null,
  privacyUrl: '/privacy' as string | null,
  termsUrl: '/terms' as string | null,
  social: [] as { label: string; href: string }[],
};

/** Who is legally selling. Fill these in before launch: they appear on the privacy policy, the terms of sale and in marketing emails (CASL). */
export const BUSINESS = {
  legalName: null as string | null,
  mailingAddress: null as string | null,
  privacyContactEmail: null as string | null,
  governingLaw: null as string | null, // e.g. "the laws of the Province of Ontario and the federal laws of Canada"
};

/** Date the privacy policy and terms were last reviewed. */
export const LEGAL_UPDATED = '2026-10-30';

export const BRAND_INTRO =
  'A3 Goalkeeping is building a focused collection of goalkeeper apparel and essentials, with our padded base layer at the centre of the range. Our aim is straightforward: clear product information, purposeful choices, and a shopping experience built around keepers.';

export const FAQ = [
  { q: 'What am I buying?', a: BASE_LAYER.included, tbc: 'What is included in each purchase' },
  { q: 'Where is it padded?', a: BASE_LAYER.paddedAreas.length ? BASE_LAYER.paddedAreas.map((p) => p.label).join(', ') : null, tbc: 'Actual padding locations' },
  { q: 'Can I wear it under a short-sleeve jersey or shorts?', a: WEAR_NOTE, tbc: '' },
  { q: 'How is it meant to be worn?', a: BASE_LAYER.intendedFit, tbc: 'Intended fit and how it sits under kit' },
  { q: 'What is it made from?', a: BASE_LAYER.fabricComposition, tbc: 'Fabric composition' },
  { q: 'Which size should I choose?', a: SIZE_GUIDE.rows.length ? 'See the size guide for measurements and how to measure.' : null, tbc: 'Sizes and measurement chart' },
  { q: 'When will it arrive?', a: POLICIES.deliveryEstimate, tbc: 'Delivery estimates by destination' },
  { q: 'What if the fit is wrong?', a: POLICIES.sizeExchanges, tbc: 'Returns and exchange terms' },
  { q: 'How do I look after it?', a: BASE_LAYER.care, tbc: 'Care instructions' },
];

/** Unconnected fallback so the site renders before Shopify is wired. Price is deliberately absent. */
export const PLACEHOLDER_PRODUCTS: Record<string, { title: string; blurb: string }> = {
  [HANDLES.base]: { title: BASE_LAYER.productName, blurb: 'Padded base layer for goalkeepers.' },
  [HANDLES.longTop]: { title: 'Long-Sleeve Top', blurb: 'Padded long-sleeve top.' },
  [HANDLES.shortTop]: { title: 'Short-Sleeve Top', blurb: 'Padded short-sleeve top.' },
  [HANDLES.leggings]: { title: 'Leggings', blurb: 'Padded leggings.' },
  [HANDLES.shorts]: { title: 'Shorts', blurb: 'Padded shorts.' },
  [HANDLES.socks]: { title: 'Grip Socks', blurb: 'Regular grip socks.' },
  [HANDLES.bandages]: { title: 'Self-Adhesive Sports Bandages', blurb: 'Self-adhesive sports bandages.' },
};

/** Set by the owner: $50 CAD per piece, $80 CAD for one top plus one bottom. Mirrors the Shopify automatic discount. */
export const PRICING = { currency: 'CAD', piece: 50, bundle: 80 } as const;
