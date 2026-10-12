/**
 * Renders every brand-derived raster from the supplied logo files: favicon, PWA /
 * Apple icons and the 1200×630 social card (the full lockup is used there when given). With no logo it renders a neutral
 * text-only fallback (the brand NAME in type — no invented symbol).
 *
 * Used by scripts/brand.mjs (`npm run brand`) and scripts/generate-assets.mjs.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';

const ACCENT = '#d4ff3a';
let fontReady = false;
function ensureFont(root) {
  if (fontReady) return;
  GlobalFonts.registerFromPath(path.join(root, 'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff'), 'Bebas Neue');
  fontReady = true;
}

/** PNG-in-ICO (single 32×32 image) — supported by every current browser. */
export function pngToIco(png, size = 32) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size, 6);
  header.writeUInt8(size, 7);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  return Buffer.concat([header, png]);
}

/** Average perceived luminance (0–1) of the opaque pixels, to warn about dark logos on a dark tile. */
export async function averageLuminance(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let weight = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const a = data[i + 3] / 255;
    if (a < 0.05) continue;
    sum += ((0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255) * a;
    weight += a;
  }
  return weight ? sum / weight : 0;
}

/**
 * Dark artwork on a light background (typically a black logo on white, JPEG or not) →
 * white-on-transparent PNG, trimmed to the artwork. The site is dark, so a black logo
 * would otherwise vanish. The soft ramp removes JPEG haze but keeps anti-aliased edges.
 * @param {string|Buffer} input
 * @returns {Promise<Buffer>} PNG
 */
export async function knockout(input, { lo = 30, hi = 225, pad = 0.04 } = {}) {
  const { data, info } = await sharp(input).flatten({ background: '#ffffff' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  // Sanity: the corners must be light, or this is not dark-on-light artwork.
  const patch = Math.max(2, Math.round(Math.min(w, h) * 0.03));
  let sum = 0;
  let n = 0;
  for (const [x0, y0] of [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]]) {
    for (let y = y0; y < y0 + patch; y++) for (let x = x0; x < x0 + patch; x++) { sum += data[y * w + x]; n++; }
  }
  if (sum / n < 190) throw new Error('--knockout expects dark artwork on a light background, but the corners of this image are dark.');

  const rgba = Buffer.alloc(w * h * 4);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < w * h; i++) {
    const alpha = Math.round(Math.min(1, Math.max(0, (hi - data[i]) / (hi - lo))) * 255);
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = alpha;
    if (alpha > 40) {
      const x = i % w;
      const y = (i / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('--knockout found no artwork in this image.');
  const px = Math.round((maxX - minX) * pad);
  const py = Math.round((maxY - minY) * pad);
  const left = Math.max(0, minX - px);
  const top = Math.max(0, minY - py);
  const width = Math.min(w - left, maxX - minX + 1 + px * 2);
  const height = Math.min(h - top, maxY - minY + 1 + py * 2);
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).extract({ left, top, width, height }).png({ compressionLevel: 9 }).toBuffer();
}

async function rasterise(file, maxEdge = 1024) {
  return sharp(file, { density: 300 }).resize({ width: maxEdge, height: maxEdge, fit: 'inside', withoutEnlargement: false }).png().toBuffer();
}

/** Square app-icon tile: rounded dark square with the logo (or the name) centred. */
async function iconTile({ size, padding, bg, markPng, name, root }) {
  const tile = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${bg}"/></svg>`);
  const base = sharp(tile);
  if (markPng) {
    const inner = Math.round(size * (1 - padding * 2));
    const fitted = await sharp(markPng).resize({ width: inner, height: inner, fit: 'inside' }).png().toBuffer();
    return base.composite([{ input: fitted, gravity: 'center' }]).png().toBuffer();
  }
  ensureFont(root);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(await loadImage(await sharp(tile).png().toBuffer()), 0, 0);
  const letters = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'A';
  ctx.fillStyle = ACCENT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${Math.round(size * (letters.length > 1 ? 0.52 : 0.64))}px "Bebas Neue"`;
  ctx.fillText(letters, size / 2, size / 2 + size * 0.03);
  return canvas.toBuffer('image/png');
}

/**
 * Files may be paths or Buffers.
 * @param {{ root: string, name?: string, logoFile?: string|Buffer|null, markFile?: string|Buffer|null, lockupFile?: string|Buffer|null, bg?: string }} o
 * @returns {Promise<{ warnings: string[] }>}
 */
export async function renderBrandAssets({ root, name = 'A3GK', logoFile = null, markFile = null, lockupFile = null, bg = '#07080a' }) {
  const out = (...p) => path.join(root, 'public', ...p);
  const warnings = [];
  await fs.mkdir(out('icons'), { recursive: true });
  await fs.mkdir(out('images'), { recursive: true });

  const logoPng = logoFile ? await rasterise(logoFile) : null;
  const markPng = markFile ? await rasterise(markFile) : logoPng;
  const lockupPng = lockupFile ? await rasterise(lockupFile) : null;

  if (markPng && /^#0[0-9a-f]/i.test(bg) && (await averageLuminance(markPng)) < 0.3) {
    warnings.push('Your logo looks dark; on the dark app-icon tile it may be hard to see. Supply a light/white version, or pass --bg "#ffffff" for a light tile.');
  }

  for (const [file, size, padding] of [['icon-192.png', 192, 0.16], ['icon-512.png', 512, 0.16], ['apple-touch-icon.png', 180, 0.16], ['icon-maskable-512.png', 512, 0.28]]) {
    await fs.writeFile(out('icons', file), await iconTile({ size, padding, bg, markPng, name, root }));
  }
  const fav = await sharp(await iconTile({ size: 128, padding: 0.1, bg, markPng, name, root })).resize(32, 32).png().toBuffer();
  await fs.writeFile(out('favicon.ico'), pngToIco(fav, 32));

  // 1200×630 social card: logo (or the name in type) + the tagline.
  ensureFont(root);
  const w = 1200;
  const h = 630;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#171b21');
  gradient.addColorStop(1, '#07080a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.15, 10, w * 0.82, h * 0.15, 520);
  glow.addColorStop(0, 'rgba(212,255,58,0.16)');
  glow.addColorStop(1, 'rgba(212,255,58,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const cardLogo = lockupPng || logoPng;
  if (cardLogo) {
    // The full lockup is the tall one: give it more room than a wide wordmark.
    const box = lockupPng ? { width: 600, height: 300 } : { width: 640, height: 220 };
    const fitted = await sharp(cardLogo).resize({ ...box, fit: 'inside' }).png().toBuffer();
    const img = await loadImage(fitted);
    ctx.drawImage(img, 80, 110 + (box.height - img.height) / 2, img.width, img.height);
  } else {
    ctx.fillStyle = '#f3f5f7';
    ctx.font = '400 190px "Bebas Neue"';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, 76, 330);
  }
  ctx.fillStyle = ACCENT;
  ctx.font = '400 62px "Bebas Neue"';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('ADVANCED ATHLETIC GEAR FOR GOALKEEPERS', 80, lockupPng ? 500 : 450);
  await sharp(canvas.toBuffer('image/png')).png({ compressionLevel: 9 }).toFile(out('images', 'og.png'));

  return { warnings };
}
