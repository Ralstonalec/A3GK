#!/usr/bin/env node
/**
 * Install your logo.
 *
 *   npm run brand -- path/to/logo.svg
 *   npm run brand -- path/to/logo.png --mark path/to/square-mark.svg
 *   npm run brand -- path/to/logo.svg --name "Your Company" --bg "#ffffff"
 *   npm run brand -- --reset            # back to the neutral text wordmark
 *
 * What it does:
 *   1. copies the logo to public/brand/ and records its size in data/brand.json
 *      (the header and footer pick it up on the next build)
 *   2. regenerates favicon.ico, the PWA / Apple icons and the social-share card
 *      (public/images/og.png) from it
 *
 * Use a logo that is readable on a DARK background (the site is dark): a light or
 * white version, ideally SVG. `--mark` is an optional square symbol for the app
 * icons when your full logo is a wide wordmark.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { renderBrandAssets } from './lib/brand-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = path.join(root, 'public', 'brand');
const brandJson = path.join(root, 'data', 'brand.json');
const ALLOWED = new Set(['.svg', '.png', '.webp']);
const MAX_BYTES = 2 * 1024 * 1024;

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && !['--mark', '--name', '--bg'].includes(args[i - 1]));

async function validate(file, label) {
  const ext = path.extname(file).toLowerCase();
  if (!ALLOWED.has(ext)) fail(`${label}: use an .svg, .png or .webp file (got "${ext || 'no extension'}").`);
  const stat = await fs.stat(file).catch(() => null);
  if (!stat || !stat.isFile()) fail(`${label}: file not found: ${file}`);
  if (stat.size > MAX_BYTES) fail(`${label}: ${(stat.size / 1024 / 1024).toFixed(1)} MB is too large (max 2 MB). Optimise it first.`);
  if (ext === '.svg') {
    const text = await fs.readFile(file, 'utf8');
    if (/<script[\s>]|javascript:|\son[a-z]+\s*=|<foreignObject/i.test(text)) fail(`${label}: the SVG contains scripts, event handlers or foreignObject. Export a clean SVG (no interactivity).`);
  }
  return ext;
}

async function clearBrandDir() {
  await fs.mkdir(brandDir, { recursive: true });
  for (const f of await fs.readdir(brandDir)) if (/^(logo|mark)\.(svg|png|webp)$/.test(f)) await fs.rm(path.join(brandDir, f));
}

async function main() {
  const current = JSON.parse(await fs.readFile(brandJson, 'utf8'));
  const name = flag('--name') || current.name || 'A3GK';

  if (args.includes('--reset')) {
    await clearBrandDir();
    const next = { ...current, name, logo: { src: null, width: null, height: null }, mark: { src: null }, iconSvg: false };
    await fs.writeFile(brandJson, `${JSON.stringify(next, null, 2)}\n`);
    await renderBrandAssets({ root, name });
    console.log('✔ Reset to the neutral text wordmark.');
    return;
  }

  const logoArg = positional[0];
  if (!logoArg) fail('Usage: npm run brand -- path/to/logo.svg  [--mark square.svg] [--name "Company"] [--bg "#07080a"]  |  --reset');
  const logoPath = path.resolve(logoArg);
  const logoExt = await validate(logoPath, 'Logo');
  const markArg = flag('--mark');
  const markPath = markArg ? path.resolve(markArg) : null;
  const markExt = markPath ? await validate(markPath, 'Mark') : null;

  const meta = await sharp(logoPath, { density: 144 }).metadata();
  if (!meta.width || !meta.height) fail('Could not read the logo dimensions.');
  // Store the intrinsic size (the header scales it with CSS height); cap huge rasters.
  const scale = Math.min(1, 1200 / Math.max(meta.width, meta.height));
  const width = Math.round(meta.width * scale);
  const height = Math.round(meta.height * scale);

  await clearBrandDir();
  await fs.copyFile(logoPath, path.join(brandDir, `logo${logoExt}`));
  if (markPath) await fs.copyFile(markPath, path.join(brandDir, `mark${markExt}`));

  const next = {
    ...current,
    name,
    logo: { src: `/brand/logo${logoExt}`, width, height },
    mark: { src: markPath ? `/brand/mark${markExt}` : null },
    iconSvg: false,
  };
  await fs.writeFile(brandJson, `${JSON.stringify(next, null, 2)}\n`);

  const { warnings } = await renderBrandAssets({
    root,
    name,
    logoFile: logoPath,
    markFile: markPath,
    bg: flag('--bg') || '#07080a',
  });

  console.log(`✔ Logo installed: public/brand/logo${logoExt} (${width}×${height})${markPath ? ` + mark${markExt}` : ''}`);
  console.log('✔ Regenerated favicon.ico, icons/*.png and images/og.png');
  warnings.forEach((w) => console.warn(`⚠ ${w}`));
  console.log('\nNext: commit the changes, then redeploy (or run `npm run build`) to see the logo in the header and footer.');
}

main().catch((error) => fail(error.message));
