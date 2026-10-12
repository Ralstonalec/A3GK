/**
 * Design Studio option catalogue — shared by the UI, the pricing engine,
 * validation and the server.  Prices are integer cents, per unit.
 */

export const PALETTE = [
  { name: 'Volt', hex: '#d4ff3a' },
  { name: 'Obsidian', hex: '#111318' },
  { name: 'Signal', hex: '#ff5a36' },
  { name: 'Glacier', hex: '#7fd6ff' },
  { name: 'Royal', hex: '#2447ff' },
  { name: 'Magenta', hex: '#ff2e93' },
  { name: 'Bone', hex: '#f4f5f7' },
  { name: 'Emerald', hex: '#12b886' },
  { name: 'Gold', hex: '#ffc21a' },
  { name: 'Violet', hex: '#7c4dff' },
];

export const PATTERNS = [
  { id: 'solid', label: 'Solid', priceCents: 0 },
  { id: 'stripes', label: 'Stripes', priceCents: 0 },
  { id: 'hoops', label: 'Hoops', priceCents: 0 },
  { id: 'shadow', label: 'Tonal shadow', priceCents: 0 },
  { id: 'gradient', label: 'Gradient', priceCents: 600 },
  { id: 'chevron', label: 'Chevron', priceCents: 600 },
];

export const FABRICS = [
  { id: 'dry-mesh', label: 'Dry Mesh', priceCents: 0 },
  { id: 'pro-knit', label: 'Pro Knit', priceCents: 1200 },
  { id: 'thermal', label: 'Thermal Fleece', priceCents: 1800 },
];

export const FONTS = [
  { id: 'archivo', label: 'Archivo Extended', family: '"Archivo Variable"', weight: 800, css: 'archivo' },
  { id: 'bebas', label: 'Bebas Neue', family: '"Bebas Neue"', weight: 400, css: 'bebas' },
  { id: 'inter', label: 'Inter Black', family: '"Inter Variable"', weight: 900, css: 'inter' },
];

export const LOGO_PLACEMENT_IDS = ['chest-left', 'chest-center', 'lower-front', 'upper-back'];

export const EXTRAS = {
  playerName: { label: 'Player name', priceCents: 700 },
  playerNumber: { label: 'Squad number', priceCents: 500 },
  logo: { label: 'Custom logo', priceCents: 1200 },
};

export const SIZES = ['YM', 'YL', 'S', 'M', 'L', 'XL', 'XXL'];

export const CUSTOM_PRODUCT_HANDLE = 'custom-keeper-jersey';

export const DEFAULT_CONFIG = Object.freeze({
  baseColor: '#111318',
  accentColor: '#d4ff3a',
  trimColor: '#f4f5f7',
  pattern: 'stripes',
  fabric: 'dry-mesh',
  playerName: '',
  playerNumber: '',
  font: 'archivo',
  textColor: '#d4ff3a',
  logo: Object.freeze({ enabled: false, placement: 'chest-left', offsetX: 0, offsetY: 0, scale: 1 }),
});

export function cloneDefaultConfig() {
  return { ...DEFAULT_CONFIG, logo: { ...DEFAULT_CONFIG.logo } };
}
