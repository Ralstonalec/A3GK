#!/usr/bin/env node
/**
 * Install your logo.
 *
 *   npm run brand -- path/to/logo.svg
 *   npm run brand -- logo.png --lockup full-logo.png --mark square-mark.png
 *   npm run brand -- black-logo.jpg --knockout          # dark-on-white artwork → white on transparent
 *   npm run brand -- logo.svg --name "Your Company" --bg "#ffffff"
 *   npm run brand -- --reset                            # back to the neutral text wordmark
 *
 * What it does:
 *   1. copies the logo to public/brand/ and records its size in data/brand.json
 *      (the header, and the footer, pick it up on the next build)
 *   2. regenerates favicon.ico, the PWA / Apple icons and the social-share card
 *      (public/images/og.png) from it
 *
 *   logo      shown in the header (and in the footer when there is no lockup). Best as a compact
 *             mark or a wide wordmark: the header is only ~40px tall.
 *   --lockup  optional full logo (symbol + name/strapline) shown larger in the footer and on the
 *             social card, where small text stays readable.
 *   --mark    optional square symbol for the favicon / app icons (defaults to the logo).
 *   --knockout  your artwork is dark on a light background (e.g. black on white, JPEG fine):
 *             convert it to white-on-transparent so it reads on the dark site. Applies to every
 *             file you pass. Keep your originals — this installs the converted copies.
 *
 * Without --knockout, use a logo that is already readable on a DARK background: a light or white
 * version, ideally SVG or a PNG/WebP with transparency.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { knockout, renderBrandAssets } from './lib/brand-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = path.join(root, 'public', 'brand');
const brandJson = path.join(root, 'data', 'brand.json');
const ALLOWED = new Set(['.svg', '.png', '.webp', '.jpg', '.jpeg']);
const MAX_BYTES = 2 * 1024 * 1024;
const VALUE_FLAGS = ['--mark', '--lockup', '--name', '--bg'];

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
const knockoutOn = args.includes('--knockout');

async function validate(file, label) {
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED.has(ext)) fail(`${label}: use an .svg, .png, .webp or .jpg file (got "${ext || 'no extension'}").`);
  const stat = await fs.stat(file).catch(() => null);
  if (!stat || !stat.isFile()) fail(`${label}: file not found: ${file}`);
  if (stat.size > MAX_BYTES) fail(`${label}: ${(stat.size / 1024 / 1024).toFixed(1)} MB is too large (max 2 MB). Optimise it first.`);
  if ((ext === '.jpg' || ext === '.jpeg') && !knockoutOn) {
    fail(`${label}: a JPEG has no transparency, so it would show as a white box on the dark site. If it is dark artwork on a white background, re-run with --knockout; otherwise export a PNG, WebP or SVG with a transparent background.`);
  }
  if (ext === '.svg') {
    const text = await fs.readFile(file, 'utf8');
    if (/<script[\s>]|javascript:|\son[a-z]+\s*=|<foreignObject/i.test(text)) fail(`${label}: the SVG contains scripts, event handlers or foreignObject. Export a clean SVG (no interactivity).`);
  }
  return ext;
}

async function clearBrandDir() {
  await fs.mkdir(brandDir, { recursive: true });
  for (const f of await fs.readdir(brandDir)) if (/^(logo|mark|lockup)\.(svg|png|webp)$/.test(f)) await fs.rm(path.join(brandDir, f));
}

/**
 * Validate one input and return what to install: the bytes, the extension to store under, and its size.
 * With --knockout the converted PNG is what ships.
 */
async function prepare(arg, label) {
  const file = path.resolve(arg);
  const ext = await validate(file, label);
  if (knockoutOn && ext !== '.svg') {
    const png = await knockout(file).catch((error) => fail(`${label}: ${error.message}`));
    const meta = await sharp(png).metadata();
    return { label, ext: '.png', bytes: png, width: meta.width, height: meta.height };
  }
  const meta = await sharp(file, { density: 144 }).metadata();
  if (!meta.width || !meta.height) fail(`${label}: could not read the image dimensions.`);
  return { label, ext, bytes: await fs.readFile(file), width: meta.width, height: meta.height };
}

/** Store the intrinsic size (CSS scales it); cap huge rasters in the recorded size only. */
const sizeOf = (p) => {
  const scale = Math.min(1, 1200 / Math.max(p.width, p.height));
  return { width: Math.round(p.width * scale), height: Math.round(p.height * scale) };
};

async function main() {
  const current = JSON.parse(await fs.readFile(brandJson, 'utf8'));
  const name = flag('--name') || current.name || 'A3GK';
  const empty = { src: null, width: null, height: null };

  if (args.includes('--reset')) {
    await clearBrandDir();
    await fs.writeFile(brandJson, `${JSON.stringify({ ...current, name, logo: empty, lockup: empty, mark: { src: null }, iconSvg: false }, null, 2)}\n`);
    await renderBrandAssets({ root, name });
    console.log('✔ Reset to the neutral text wordmark.');
    return;
  }

  const logoArg = positional[0];
  if (!logoArg) fail('Usage: npm run brand -- path/to/logo.svg  [--lockup full.png] [--mark square.png] [--knockout] [--name "Company"] [--bg "#07080a"]  |  --reset');
  const logo = await prepare(logoArg, 'Logo');
  const lockup = flag('--lockup') ? await prepare(flag('--lockup'), 'Lockup') : null;
  const mark = flag('--mark') ? await prepare(flag('--mark'), 'Mark') : null;

  await clearBrandDir();
  const installed = {};
  for (const [key, part] of [['logo', logo], ['lockup', lockup], ['mark', mark]]) {
    if (!part) continue;
    await fs.writeFile(path.join(brandDir, `${key}${part.ext}`), part.bytes);
    installed[key] = { src: `/brand/${key}${part.ext}`, ...sizeOf(part) };
  }

  const next = {
    ...current,
    name,
    logo: installed.logo,
    lockup: installed.lockup || empty,
    mark: { src: installed.mark?.src || null },
    iconSvg: false,
  };
  await fs.writeFile(brandJson, `${JSON.stringify(next, null, 2)}\n`);

  const { warnings } = await renderBrandAssets({
    root,
    name,
    logoFile: logo.bytes,
    markFile: mark?.bytes || null,
    lockupFile: lockup?.bytes || null,
    bg: flag('--bg') || '#07080a',
  });

  const summary = Object.entries(installed).map(([key, v]) => `${key}${path.extname(v.src)} (${v.width}×${v.height})`).join(', ');
  console.log(`✔ Installed in public/brand/: ${summary}${knockoutOn ? ' — converted to white on transparent' : ''}`);
  console.log('✔ Regenerated favicon.ico, icons/*.png and images/og.png');
  warnings.forEach((w) => console.warn(`⚠ ${w}`));
  console.log('\nNext: commit the changes, then redeploy (or run `npm run build`) to see the logo in the header and footer.');
}

main().catch((error) => fail(error.message));
