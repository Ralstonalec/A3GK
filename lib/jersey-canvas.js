import { ANCHORS, ELBOW_PATCHES, JERSEY_PATHS, JERSEY_SIZE } from './jersey-geometry.js';
import { FONTS } from './customizer-options.js';
import { luminance, mixHex, readableOn } from './utils.js';

/**
 * Framework-free jersey renderer (Canvas 2D).
 *
 * The ONE drawing routine behind:
 *   • components/design/CanvasPreview.js   (live Design Studio, browser)
 *   • scripts/generate-assets.mjs          (shop artwork, Node + @napi-rs/canvas)
 *   • ShopifyTheme/assets/a3gk-jersey-canvas.js (copied by `npm run theme:sync`)
 *
 * Keep it dependency-free and DOM-free: everything it needs arrives through
 * the `ctx` and `options` arguments.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} config            customization config (see lib/validation.js)
 * @param {{
 *   view?: 'front'|'back',
 *   logoImage?: CanvasImageSource|null,
 *   Path2DCtor?: typeof Path2D,
 *   clear?: boolean,
 *   showPlaceholder?: boolean
 * }} [options]
 */
export function drawJersey(ctx, config, options = {}) {
  const { view = 'front', logoImage = null, clear = true, showPlaceholder = true } = options;
  const P = options.Path2DCtor || Path2D;
  const { width, height } = JERSEY_SIZE;
  const base = config.baseColor;
  const accent = config.accentColor;
  const trim = config.trimColor;
  const path = (d) => new P(d);
  const body = path(JERSEY_PATHS.body);

  if (clear) ctx.clearRect(0, 0, width, height);
  ctx.save();

  /* Ground shadow */
  const shadow = ctx.createRadialGradient(300, 612, 10, 300, 612, 250);
  shadow.addColorStop(0, 'rgba(0,0,0,0.45)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.save();
  ctx.translate(0, 612);
  ctx.scale(1, 0.1);
  ctx.translate(0, -612);
  ctx.fillRect(20, 380, 560, 480);
  ctx.restore();

  /* Base fabric */
  ctx.fillStyle = base;
  ctx.fill(body);

  /* Everything below is clipped to the silhouette */
  ctx.save();
  ctx.clip(body);

  drawPattern(ctx, config.pattern, base, accent, width, height);
  drawFabricTexture(ctx, config.fabric, width, height);

  // Soft form shading: lit from upper-left
  const vertical = ctx.createLinearGradient(0, 60, 0, 610);
  vertical.addColorStop(0, 'rgba(255,255,255,0.10)');
  vertical.addColorStop(0.5, 'rgba(255,255,255,0)');
  vertical.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, width, height);

  const horizontal = ctx.createLinearGradient(0, 0, width, 0);
  horizontal.addColorStop(0, 'rgba(0,0,0,0.28)');
  horizontal.addColorStop(0.2, 'rgba(0,0,0,0)');
  horizontal.addColorStop(0.62, 'rgba(255,255,255,0.04)');
  horizontal.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = horizontal;
  ctx.fillRect(0, 0, width, height);

  // Armpit occlusion + drape folds
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (const [cx, cy] of [[188, 300], [412, 300]]) {
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46);
    g.addColorStop(0, 'rgba(0,0,0,0.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 50, cy - 50, 100, 100);
  }
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  for (const d of ['M230 330 C240 400 232 470 244 560', 'M372 340 C360 410 372 480 360 560', 'M118 330 C112 380 100 420 88 460', 'M486 330 C492 380 504 420 516 460']) {
    ctx.stroke(path(d));
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  for (const d of ['M262 250 C268 330 262 420 270 520', 'M338 250 C332 330 338 420 330 520']) ctx.stroke(path(d));

  /* Elbow guards */
  // Dark kit: lift the patch so it reads as padding; light kit: darken it.
  const patchColor = luminance(base) < 0.12 ? mixHex(base, '#ffffff', 0.16) : mixHex(base, '#000000', 0.3);
  for (const patch of ELBOW_PATCHES) {
    ctx.save();
    ctx.translate(patch.cx, patch.cy);
    ctx.rotate(patch.rotation);
    ctx.beginPath();
    ctx.ellipse(0, 0, patch.rx, patch.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = patchColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = luminance(patchColor) < 0.2 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, patch.rx - 5, patch.ry - 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /* Trim: cuffs + hem band */
  ctx.fillStyle = trim;
  ctx.fill(path(JERSEY_PATHS.cuffRight));
  ctx.fill(path(JERSEY_PATHS.cuffLeft));
  ctx.globalAlpha = 0.92;
  ctx.fill(path(JERSEY_PATHS.hem));
  ctx.globalAlpha = 1;
  // Trim shading so it reads as fabric, not flat colour
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill(path(JERSEY_PATHS.cuffRight));
  ctx.fill(path(JERSEY_PATHS.cuffLeft));

  /* Seams */
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.38)';
  ctx.stroke(path(JERSEY_PATHS.sleeveRight));
  ctx.stroke(path(JERSEY_PATHS.sleeveLeft));
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.5;
  ctx.stroke(path('M232 84 L170 112'));
  ctx.stroke(path('M368 84 L430 112'));
  ctx.setLineDash([]);

  ctx.restore(); // end silhouette clip

  /* Silhouette edge */
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.stroke(body);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke(body);

  /* Neck */
  const isBack = view === 'back';
  ctx.fillStyle = isBack ? mixHex(base, '#000000', 0.55) : '#06070a';
  ctx.fill(path(isBack ? JERSEY_PATHS.neckHoleBack : JERSEY_PATHS.neckHoleFront));
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.strokeStyle = trim;
  ctx.stroke(path(isBack ? JERSEY_PATHS.collarBack : JERSEY_PATHS.collarFront));
  ctx.lineWidth = 11;
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.stroke(path(isBack ? JERSEY_PATHS.collarBack : JERSEY_PATHS.collarFront));

  /* Artwork + type, clipped so nothing leaks past the torso */
  ctx.save();
  ctx.clip(path(JERSEY_PATHS.torso));
  drawLogo(ctx, config, view, logoImage, showPlaceholder);
  drawLettering(ctx, config, view);
  ctx.restore();

  ctx.restore();
}

/* ── Patterns ──────────────────────────────────────────────────────────── */

function drawPattern(ctx, pattern, base, accent, width, height) {
  switch (pattern) {
    case 'stripes': {
      ctx.fillStyle = accent;
      for (let x = 22; x < width; x += 62) ctx.fillRect(x, 0, 28, height);
      break;
    }
    case 'hoops': {
      ctx.fillStyle = accent;
      for (let y = 150; y < 620; y += 84) ctx.fillRect(0, y, width, 38);
      break;
    }
    case 'shadow': {
      ctx.fillStyle = mixHex(base, '#ffffff', 0.12);
      ctx.beginPath();
      ctx.moveTo(0, 120); ctx.lineTo(width, 330); ctx.lineTo(width, 470); ctx.lineTo(0, 260); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = mixHex(base, '#000000', 0.2);
      ctx.beginPath();
      ctx.moveTo(0, 360); ctx.lineTo(width, 570); ctx.lineTo(width, 640); ctx.lineTo(0, 640); ctx.closePath();
      ctx.fill();
      break;
    }
    case 'gradient': {
      const g = ctx.createLinearGradient(110, 80, 480, 600);
      g.addColorStop(0, base);
      g.addColorStop(0.42, base);
      g.addColorStop(1, accent);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case 'chevron': {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 34;
      ctx.lineJoin = 'miter';
      for (let k = 0; k < 5; k += 1) {
        const y = 210 + k * 74;
        ctx.beginPath();
        ctx.moveTo(150, y); ctx.lineTo(300, y + 78); ctx.lineTo(450, y);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
}

function drawFabricTexture(ctx, fabric, width, height) {
  if (fabric === 'dry-mesh') {
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    for (let y = 4; y < height; y += 9) {
      for (let x = ((y / 9) % 2) * 4.5 + 2; x < width; x += 9) ctx.fillRect(x, y, 1.6, 1.6);
    }
  } else if (fabric === 'pro-knit') {
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -height; x < width; x += 7) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x + height, height);
    }
    ctx.stroke();
  } else if (fabric === 'thermal') {
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = 3; y < height; y += 5) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }
}

/* ── Logo ──────────────────────────────────────────────────────────────── */

export function logoBox(config, view) {
  const logo = config.logo;
  const placement = logo.placement;
  const isBackSlot = placement === 'upper-back';
  if ((view === 'back') !== isBackSlot) return null; // slot lives on the other side
  const anchors = isBackSlot ? ANCHORS.back : ANCHORS.front;
  const anchor = anchors[placement];
  const size = 92 * logo.scale;
  return { cx: anchor.x + logo.offsetX, cy: anchor.y + logo.offsetY, size };
}

function drawLogo(ctx, config, view, logoImage, showPlaceholder) {
  if (!config.logo || !config.logo.enabled) return;
  const box = logoBox(config, view);
  if (!box) return;
  const { cx, cy, size } = box;

  if (logoImage) {
    const w = logoImage.width || logoImage.naturalWidth || 1;
    const h = logoImage.height || logoImage.naturalHeight || 1;
    const ratio = Math.min(size / w, size / h);
    ctx.drawImage(logoImage, cx - (w * ratio) / 2, cy - (h * ratio) / 2, w * ratio, h * ratio);
  } else if (showPlaceholder) {
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '700 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOUR LOGO', cx, cy);
    ctx.restore();
  }
}

/* ── Lettering ─────────────────────────────────────────────────────────── */

function fontFor(config) {
  return FONTS.find((f) => f.id === config.font) || FONTS[0];
}

/** Draw text centred, with manual letter-spacing (ctx.letterSpacing is not universal). */
function spacedText(ctx, text, cx, cy, spacing, maxWidth) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  let total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let scale = 1;
  if (total > maxWidth) scale = maxWidth / total;
  total *= scale;
  let x = cx - total / 2;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.translate(0, cy);
  for (let i = 0; i < chars.length; i += 1) {
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(scale, 1);
    ctx.strokeText(chars[i], 0, 0);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
    x += (widths[i] + spacing) * scale;
  }
  ctx.restore();
}

function drawLettering(ctx, config, view) {
  const font = fontFor(config);
  const fill = config.textColor;
  // Opposite-tone outline keeps lettering legible on any pattern.
  // (readableOn → black means the fill is light, so outline dark.)
  const outline = readableOn(fill) === '#000000' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.fillStyle = fill;
  ctx.strokeStyle = outline;

  if (view === 'back') {
    if (config.playerName) {
      ctx.font = `${font.weight} 46px ${font.family}, sans-serif`;
      ctx.lineWidth = 7;
      spacedText(ctx, config.playerName, ANCHORS.back.name.x, ANCHORS.back.name.y, 5, 236);
    }
    if (config.playerNumber) {
      ctx.font = `${font.weight} 210px ${font.family}, sans-serif`;
      ctx.lineWidth = 10;
      spacedText(ctx, config.playerNumber, ANCHORS.back.number.x, ANCHORS.back.number.y, 6, 230);
    }
  } else if (config.playerNumber) {
    ctx.font = `${font.weight} 70px ${font.family}, sans-serif`;
    ctx.lineWidth = 6;
    spacedText(ctx, config.playerNumber, ANCHORS.front.number.x, ANCHORS.front.number.y + 40, 4, 120);
  }
}
