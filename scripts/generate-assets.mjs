#!/usr/bin/env node
/**
 * Generates the NEUTRAL PLACEHOLDER images that keep every photo slot rendering
 * until real photography is dropped in, plus the brand icons, a typographic
 * social card and the Draco decoder.
 *
 *   public/images/products/*.webp   one slot per image in data/products.json (1200²)
 *   public/images/hero.webp         1920×1080
 *   public/images/showcase.webp     1200²
 *   public/images/studio.webp       1200×900
 *   public/images/social/*.webp     800²
 *   public/images/og.png            1200×630, typography only
 *   public/icons/*, favicon.ico     brand mark
 *   public/draco/*                  decoder for compressed GLB models
 *
 * These are deliberately NOT illustrations: flat studio-grey frames with a
 * label saying what photograph belongs there. Replace any file (same name) with
 * a real photo and nothing else needs to change.
 *
 *   npm run assets                 # everything
 *   npm run assets -- placeholders # just the photo slots
 *
 * Existing files are never overwritten unless you pass --force, so running this
 * after you have added real photos cannot destroy them.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createCanvas, GlobalFonts, Path2D } from '@napi-rs/canvas';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, 'public', ...p);
const force = process.argv.includes('--force');
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));

GlobalFonts.registerFromPath(path.join(root, 'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff'), 'Bebas Neue');

const VOLT = '#d4ff3a';
const BRAND_MARK = 'M24 3 L45 45 H34.5 L24 24.5 L13.5 45 H3 Z M14 33 H34 V38.5 H14 Z';

const exists = (file) => fs.access(file).then(() => true, () => false);

/* ── Neutral placeholder frame ─────────────────────────────────────────── */

/**
 * @param {{ width: number, height: number, label: string, caption?: string }} o
 * @returns {Buffer} PNG
 */
function placeholderPng({ width, height, label, caption }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const min = Math.min(width, height);

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#181c22');
  bg.addColorStop(1, '#0d0f13');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // fine diagonal hairlines — reads as "image goes here", not as artwork
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -height; x < width; x += 28) {
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
  }
  ctx.stroke();

  // frame
  const inset = Math.round(min * 0.035);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  // camera glyph
  const g = min * 0.09;
  const cx = width / 2;
  const cy = height / 2 - min * 0.03;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = Math.max(2, min * 0.004);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.roundRect(cx - g, cy - g * 0.62, g * 2, g * 1.35, g * 0.18);
  ctx.moveTo(cx - g * 0.38, cy - g * 0.62);
  ctx.lineTo(cx - g * 0.22, cy - g * 0.92);
  ctx.lineTo(cx + g * 0.22, cy - g * 0.92);
  ctx.lineTo(cx + g * 0.38, cy - g * 0.62);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + g * 0.05, g * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `400 ${Math.round(min * 0.045)}px "Bebas Neue"`;
  ctx.fillText(label.toUpperCase(), cx, cy + g * 1.75);
  if (caption) {
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.font = `400 ${Math.round(min * 0.03)}px "Bebas Neue"`;
    ctx.fillText(caption.toUpperCase(), cx, cy + g * 1.75 + min * 0.05);
  }

  // brand mark, bottom-left
  ctx.save();
  ctx.translate(inset + min * 0.025, height - inset - min * 0.025 - min * 0.045);
  ctx.scale((min * 0.045) / 48, (min * 0.045) / 48);
  ctx.fillStyle = VOLT;
  ctx.globalAlpha = 0.8;
  ctx.fill(new Path2D(BRAND_MARK));
  ctx.restore();

  return canvas.toBuffer('image/png');
}

async function writeSlot(file, spec, quality = 80) {
  if (!force && (await exists(file))) return false;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(placeholderPng(spec)).webp({ quality, effort: 4 }).toFile(file);
  return true;
}

async function placeholders() {
  const products = JSON.parse(await fs.readFile(path.join(root, 'data/products.json'), 'utf8')).products;
  let written = 0;
  let kept = 0;
  const tally = (ok) => (ok ? (written += 1) : (kept += 1));

  for (const p of products) {
    for (const [i, img] of p.images.entries()) {
      tally(await writeSlot(out('images', 'products', `${img.file}.webp`), { width: 1200, height: 1200, label: 'Product photo', caption: `${p.title} · ${i + 1}` }));
    }
  }
  tally(await writeSlot(out('images', 'hero.webp'), { width: 1920, height: 1080, label: 'Hero photograph', caption: '1920 × 1080 · goalkeeper in action' }, 72));
  tally(await writeSlot(out('images', 'showcase.webp'), { width: 1200, height: 1200, label: 'Showcase photograph', caption: 'Close-up of the hero product · hotspots overlay this' }));
  tally(await writeSlot(out('images', 'studio.webp'), { width: 1200, height: 900, label: 'Design Studio photograph', caption: 'Custom jersey, studio lit' }));
  for (let i = 1; i <= 6; i += 1) {
    tally(await writeSlot(out('images', 'social', `social-${i}.webp`), { width: 800, height: 800, label: 'Sample social post', caption: `Tile ${i}` }, 74));
  }
  console.log(`  ${written} placeholder(s) written, ${kept} existing file(s) kept${force ? '' : ' (use --force to overwrite)'}`);
}

/* ── Brand icons + typographic social card ─────────────────────────────── */

function iconSvg(size, { padding = 0.18, bg = '#07080a' } = {}) {
  const inner = size * (1 - padding * 2);
  const scale = inner / 48;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/>
    <g transform="translate(${size * padding} ${size * padding}) scale(${scale})" fill="${VOLT}"><path d="${BRAND_MARK}"/></g></svg>`;
}

function pngToIco(png, size) {
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

async function icons() {
  await fs.mkdir(out('icons'), { recursive: true });
  await fs.writeFile(out('icons', 'icon.svg'), iconSvg(512));
  for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await sharp(Buffer.from(iconSvg(size))).png().toFile(out('icons', name));
  }
  await sharp(Buffer.from(iconSvg(512, { padding: 0.28 }))).png().toFile(out('icons', 'icon-maskable-512.png'));
  const fav = await sharp(Buffer.from(iconSvg(48, { padding: 0.12 }))).resize(32, 32).png().toBuffer();
  await fs.writeFile(out('favicon.ico'), pngToIco(fav, 32));
}

/** Typography-only share card: no imagery to misrepresent anything. */
async function og() {
  const w = 1200;
  const h = 630;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#171b21');
  bg.addColorStop(1, '#07080a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.15, 10, w * 0.82, h * 0.15, 520);
  glow.addColorStop(0, 'rgba(212,255,58,0.18)');
  glow.addColorStop(1, 'rgba(212,255,58,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = VOLT;
  ctx.save();
  ctx.translate(80, 78);
  ctx.scale(1.5, 1.5);
  ctx.fill(new Path2D(BRAND_MARK));
  ctx.restore();
  ctx.fillStyle = '#f3f5f7';
  ctx.font = '400 190px "Bebas Neue"';
  ctx.fillText('A3GK', 76, 360);
  ctx.fillStyle = VOLT;
  ctx.font = '400 66px "Bebas Neue"';
  ctx.fillText('ADVANCED ATHLETIC GEAR FOR GOALKEEPERS', 80, 450);
  await sharp(canvas.toBuffer('image/png')).png({ compressionLevel: 9 }).toFile(out('images', 'og.png'));
}

async function draco() {
  const from = path.join(root, 'node_modules/three/examples/jsm/libs/draco/gltf');
  await fs.mkdir(out('draco'), { recursive: true });
  for (const f of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
    await fs.copyFile(path.join(from, f), out('draco', f));
  }
}

const steps = { placeholders, icons, og, draco };
await fs.mkdir(out('images'), { recursive: true });
for (const [name, fn] of Object.entries(steps)) {
  if (only && only !== name) continue;
  console.log(`▸ ${name}`);
  await fn();
}
console.log('✔ done');
