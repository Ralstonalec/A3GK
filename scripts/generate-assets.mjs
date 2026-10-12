#!/usr/bin/env node
/**
 * Generates the NEUTRAL PLACEHOLDER images that keep every photo slot rendering
 * until real photography is dropped in, plus the brand icons / social card
 * (via scripts/lib/brand-assets.mjs) and the Draco decoder.
 *
 *   public/images/products/*.webp     one slot per image in data/products.json (1200²)
 *   public/images/categories/*.webp   one 4:5 tile per category (home page)
 *   public/images/hero.webp           1920×1080
 *   public/images/showcase.webp       1200² (only shown once showcase hotspots exist)
 *   public/images/studio.webp         1200×900 (custom kit — feature-flagged)
 *   public/icons/*, favicon.ico, public/images/og.png   from your logo (npm run brand) or the plain name
 *   public/draco/*                    decoder for compressed GLB models
 *
 * These are deliberately NOT illustrations and carry NO invented logo: flat
 * studio-grey frames with a label saying what photograph belongs there. Replace
 * any file (same name) with a real photo and nothing else needs to change.
 *
 *   npm run assets                 # everything
 *   npm run assets -- placeholders # just the photo slots
 *
 * Existing placeholder files are never overwritten unless you pass --force, so
 * running this after you have added real photos cannot destroy them. (Icons and
 * the social card are always regenerated from the current brand.)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { renderBrandAssets } from './lib/brand-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(root, 'public', ...p);
const force = process.argv.includes('--force');
const only = process.argv.slice(2).find((a) => !a.startsWith('--'));

GlobalFonts.registerFromPath(path.join(root, 'node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff'), 'Bebas Neue');

const readJson = async (...p) => JSON.parse(await fs.readFile(path.join(root, ...p), 'utf8'));
const flagOn = (v) => /^(1|true|on|yes)$/i.test(v || '');

const exists = (file) => fs.access(file).then(() => true, () => false);

/* ── Neutral placeholder frame ─────────────────────────────────────────── */

/**
 * @param {{ width: number, height: number, label: string, caption?: string, corner?: boolean }} o  `corner`: small label bottom-right, no centre glyph (for full-bleed slots with text on top)
 * @returns {Buffer} PNG
 */
function placeholderPng({ width, height, label, caption, corner = false }) {
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

  if (corner) {
    // Full-bleed slot with copy over it: keep the label out of the way, bottom-right.
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `400 ${Math.round(min * 0.034)}px "Bebas Neue"`;
    ctx.fillText(label.toUpperCase(), width - inset * 2, height - inset * 2 - (caption ? min * 0.04 : 0));
    if (caption) {
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.font = `400 ${Math.round(min * 0.026)}px "Bebas Neue"`;
      ctx.fillText(caption.toUpperCase(), width - inset * 2, height - inset * 2);
    }
    return canvas.toBuffer('image/png');
  }

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

  return canvas.toBuffer('image/png');
}

async function writeSlot(file, spec, quality = 80) {
  if (!force && (await exists(file))) return false;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await sharp(placeholderPng(spec)).webp({ quality, effort: 4 }).toFile(file);
  return true;
}

async function placeholders() {
  const media = await readJson('data/media.json');
  const sources = [(await readJson('data/products.json')).products];
  // Dormant ranges only get slots once their feature flag is on (same env vars as lib/features.js).
  if (flagOn(process.env.NEXT_PUBLIC_FEATURE_GLOVES)) sources.push((await readJson('data/future/gloves.json')).products);
  if (flagOn(process.env.NEXT_PUBLIC_FEATURE_CUSTOM_KIT)) sources.push((await readJson('data/future/custom-kit.json')).products);
  let written = 0;
  let kept = 0;
  const tally = (ok) => (ok ? (written += 1) : (kept += 1));

  for (const p of sources.flat()) {
    for (const [i, img] of p.images.entries()) {
      tally(await writeSlot(out('images', 'products', `${img.file}.webp`), { width: 1200, height: 1200, label: 'Product photo', caption: `${p.title} · ${i + 1}` }));
    }
  }
  const categoryLabels = { 'base-layers': 'Base layers', jerseys: 'Jerseys', bottoms: 'Pants & shorts', accessories: 'Tape & socks', gloves: 'Gloves' };
  for (const [id, src] of Object.entries(media.categories.images)) {
    if (id === 'gloves' && !flagOn(process.env.NEXT_PUBLIC_FEATURE_GLOVES)) continue;
    tally(await writeSlot(path.join(root, 'public', src), { width: 800, height: 1000, label: 'Category photo', caption: categoryLabels[id] || id }));
  }
  tally(await writeSlot(out('images', 'hero.webp'), { width: 1920, height: 1080, label: 'Hero photograph', caption: '1920 × 1080 · goalkeeper in action', corner: true }, 72));
  tally(await writeSlot(out('images', 'showcase.webp'), { width: 1200, height: 1200, label: 'Showcase photograph', caption: 'Close-up of a product · hotspots overlay this' }));
  tally(await writeSlot(out('images', 'studio.webp'), { width: 1200, height: 900, label: 'Design Studio photograph', caption: 'Custom kit, studio lit' }));
  console.log(`  ${written} placeholder(s) written, ${kept} existing file(s) kept${force ? '' : ' (use --force to overwrite)'}`);
}

/* ── Brand icons + social card (from your logo, or the plain name) ─────── */

async function brand() {
  const cfg = await readJson('data/brand.json');
  const file = (src) => (src ? path.join(root, 'public', src.replace(/^\//, '')) : null);
  const { warnings } = await renderBrandAssets({ root, name: cfg.name, logoFile: file(cfg.logo?.src), markFile: file(cfg.mark?.src), lockupFile: file(cfg.lockup?.src) });
  warnings.forEach((w) => console.warn(`  ! ${w}`));
  console.log(cfg.logo?.src ? `  icons + social card built from ${cfg.logo.src}` : '  no logo installed yet: icons and social card use the plain name (run `npm run brand -- your-logo.svg`)');
}

async function draco() {
  const from = path.join(root, 'node_modules/three/examples/jsm/libs/draco/gltf');
  await fs.mkdir(out('draco'), { recursive: true });
  for (const f of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
    await fs.copyFile(path.join(from, f), out('draco', f));
  }
}

const steps = { placeholders, brand, draco };
await fs.mkdir(out('images'), { recursive: true });
for (const [name, fn] of Object.entries(steps)) {
  if (only && only !== name) continue;
  console.log(`▸ ${name}`);
  await fn();
}
console.log('✔ done');
