#!/usr/bin/env node
/**
 * Browser check for the scroll-animation layer (Playwright + the pre-installed Chromium).
 *
 *   BASE=http://localhost:3100 npm run audit:motion
 *
 * Verifies, against a running build:
 *   1. hero parallax moves with scroll, and returns to rest at the top
 *   2. scroll-linked layers are REVERSIBLE: same scroll position → same transform
 *      on the way down and on the way back up
 *   3. reveals replay in both directions (rise from below, drop from above)
 *   4. prefers-reduced-motion: no scroll-linked transforms, nothing hidden
 *   5. phone viewport: motion still active, amplitude reduced, no horizontal overflow
 *   6. no console errors
 * Exits non-zero on any failure.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3100';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const CONSENT = encodeURIComponent(JSON.stringify({ version: 1, timestamp: new Date().toISOString(), categories: { necessary: true, preferences: false, analytics: false, marketing: false } }));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? `  — ${detail}` : ''}`);
};
const close = (a, b, eps = 0.01) => Math.abs(a - b) <= eps;

/** Reads translateY / scale / rotation(deg) / opacity of the first element matching `selector`. */
const probe = (page, selector, exclude = null) =>
  page.evaluate(
    ({ selector, exclude }) => {
      const el = [...document.querySelectorAll(selector)].find((n) => !exclude || !String(n.className).includes(exclude));
      if (!el) return null;
      const cs = getComputedStyle(el);
      const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform);
      return { y: m.m42, scale: Math.hypot(m.a, m.b), rotate: (Math.atan2(m.b, m.a) * 180) / Math.PI, opacity: Number(cs.opacity) };
    },
    { selector, exclude },
  );

// `instant`: the site sets `scroll-behavior: smooth`, which would make positions non-deterministic here.
const jump = (page, y) => page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);

const scrollTo = async (page, y, wait = 450) => {
  await jump(page, y);
  await page.waitForTimeout(wait);
};

/** Scroll to a section so that its top sits at `fraction` of the viewport height. */
const sectionY = (page, type, fraction = 0.1) =>
  page.evaluate(({ type, fraction }) => {
    const el = document.querySelector(`[data-section-type="${type}"]`);
    return Math.max(0, el.getBoundingClientRect().top + window.scrollY - window.innerHeight * fraction);
  }, { type, fraction });

async function newPage(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  await context.addCookies([{ name: 'a3gk_consent', value: CONSENT, url: BASE }]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // `_clientMiddlewareManifest.js` / HMR noise only exists under `next dev`.
    if (m.type() === 'error' && !/_clientMiddlewareManifest|favicon/.test(m.text())) errors.push(`console: ${m.text().slice(0, 160)}`);
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  // Let web fonts and lazy images settle: they change heights above the target, and the
  // scroll maths (correctly) follows the final layout.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  return { page, context, errors };
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

/* ── 1 + 2. Desktop: parallax + reversibility ──────────────────────────── */
{
  const { page, context, errors } = await newPage(browser);
  const MEDIA = '[class*="heroMedia"]';
  const CONTENT = '[class*="heroContent"]';
  const LAYER = '[class*="hotspotLayer"]';

  const top = { media: await probe(page, MEDIA, 'heroMediaInner'), content: await probe(page, CONTENT) };
  check('hero is at rest at the top (no offset, fully visible)', close(top.media.y, 0, 0.5) && close(top.content.y, 0, 0.5) && close(top.content.opacity, 1), JSON.stringify({ mediaY: top.media.y, contentOpacity: top.content.opacity }));

  await scrollTo(page, 420);
  const mid = { media: await probe(page, MEDIA, 'heroMediaInner'), content: await probe(page, CONTENT) };
  check('hero media drifts down relative to the page (parallax)', mid.media.y > 20, `media translateY=${mid.media.y.toFixed(1)}px`);
  check('hero copy lifts and fades while scrolling out', mid.content.y < -10 && mid.content.opacity < 0.95, `y=${mid.content.y.toFixed(1)}px opacity=${mid.content.opacity.toFixed(2)}`);

  await scrollTo(page, 0);
  const back = { media: await probe(page, MEDIA, 'heroMediaInner'), content: await probe(page, CONTENT) };
  check('hero returns exactly to rest when scrolled back to the top', close(back.media.y, 0, 0.5) && close(back.content.opacity, 1, 0.01), `mediaY=${back.media.y.toFixed(2)} opacity=${back.content.opacity.toFixed(2)}`);

  // Showcase image: record on the way DOWN, then UP, at identical positions.
  // `base` = the scroll position where the image's CENTRE is at the viewport centre (progress 0.5).
  const base = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
  }, LAYER);
  const stops = [base - 900, base - 450, base, base + 450, base + 900];
  const down = [];
  for (const y of stops) {
    await scrollTo(page, y, 350);
    down.push(await probe(page, LAYER));
  }
  const up = [];
  for (const y of [...stops].reverse()) {
    await scrollTo(page, y, 350);
    up.push(await probe(page, LAYER));
  }
  up.reverse();
  const symmetric = down.every((d, i) => close(d.scale, up[i].scale, 0.003) && close(d.rotate, up[i].rotate, 0.05));
  check('showcase image transform is identical scrolling down and back up (reversible)', symmetric, `scale ${down.map((d) => d.scale.toFixed(3)).join(' → ')}`);
  const scales = down.map((d) => d.scale);
  const rotations = down.map((d) => d.rotate);
  check('showcase image scales gently (stays within 0.99–1.10)', Math.min(...scales) >= 0.99 && Math.max(...scales) <= 1.1 && Math.max(...scales) - Math.min(...scales) > 0.01, `range ${Math.min(...scales).toFixed(3)}–${Math.max(...scales).toFixed(3)}`);
  check('showcase image rotates gently (|angle| ≤ 2°) and is level, at rest, mid-screen', Math.max(...rotations.map(Math.abs)) <= 2 && Math.abs(down[2].rotate) < 0.1 && close(down[2].scale, 1, 0.005), `angles ${rotations.map((r) => r.toFixed(2)).join(', ')}°`);

  // Studio photo: same primitive on a different element — settles to rest mid-screen, zoomed on approach.
  const STUDIO = '[class*="studioPhotoLayer"]';
  const studioCentre = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return r.top + window.scrollY + r.height / 2 - window.innerHeight / 2;
  }, STUDIO);
  await scrollTo(page, studioCentre - 600, 350);
  const studioEarly = await probe(page, STUDIO);
  await scrollTo(page, studioCentre, 350);
  const studioMid = await probe(page, STUDIO);
  await scrollTo(page, studioCentre - 600, 350);
  const studioEarlyAgain = await probe(page, STUDIO);
  check('studio photo zooms gently on approach and rests mid-screen, with no rotation', studioEarly.scale > 1.02 && studioEarly.scale <= 1.1 && close(studioMid.scale, 1, 0.005) && close(studioMid.rotate, 0, 0.01) && close(studioEarly.rotate, 0, 0.01), `scale ${studioEarly.scale.toFixed(3)} → ${studioMid.scale.toFixed(3)}`);
  check('studio photo is reversible (same scale on the way back)', close(studioEarly.scale, studioEarlyAgain.scale, 0.003), `${studioEarly.scale.toFixed(3)} vs ${studioEarlyAgain.scale.toFixed(3)}`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal overflow on desktop', overflow <= 0, `scrollWidth - innerWidth = ${overflow}`);

  /* ── 3. Reveals replay in both directions ──────────────────────────── */
  const HEADER = '[data-section-type="featured-products"] .section__header';
  const { headerTop, headerHeight } = await page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return { headerTop: r.top + window.scrollY, headerHeight: r.height };
  }, HEADER);
  const vh = 900;
  // Regression: we are currently far BELOW the heading (it last left through the top). Jumping
  // straight back to the top skips the viewport entirely, so IntersectionObserver reports no
  // crossing — the entrance direction must still come out right when it later scrolls into view.
  await scrollTo(page, 0, 300);
  await scrollTo(page, headerTop - vh * 1.0, 700); // heading's top is just below the fold
  const waiting = await probe(page, HEADER);
  check('reveal waits hidden below the fold', waiting.opacity < 0.1, `opacity=${waiting.opacity.toFixed(2)}`);

  await jump(page, headerTop - vh * 0.55); // comfortably inside
  await page.waitForTimeout(90);
  const enteringFromBelow = await probe(page, HEADER);
  await page.waitForTimeout(1400);
  const shown = await probe(page, HEADER);
  check('scrolling DOWN: heading rises into place (starts below, ends at rest, visible)', enteringFromBelow.y > 1 && close(shown.y, 0, 0.5) && shown.opacity > 0.99, `early y=${enteringFromBelow.y.toFixed(1)} → ${shown.y.toFixed(1)}, opacity ${shown.opacity.toFixed(2)}`);

  await scrollTo(page, headerTop + headerHeight + 1500, 900); // well past it
  const above = await probe(page, HEADER);
  check('after scrolling past, it resets (hidden above the viewport)', above.opacity < 0.1, `opacity=${above.opacity.toFixed(2)}`);

  await jump(page, headerTop + headerHeight - 40); // its bottom edge re-enters from the top
  await page.waitForTimeout(90);
  const enteringFromAbove = await probe(page, HEADER);
  await page.waitForTimeout(1400);
  const shownAgain = await probe(page, HEADER);
  check('scrolling UP: heading drops in from above (starts above, ends at rest, visible)', enteringFromAbove.y < -1 && close(shownAgain.y, 0, 0.5) && shownAgain.opacity > 0.99, `early y=${enteringFromAbove.y.toFixed(1)} → ${shownAgain.y.toFixed(1)}, opacity ${shownAgain.opacity.toFixed(2)}`);

  check('desktop run: no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await context.close();
}

/* ── 4. Reduced motion ─────────────────────────────────────────────────── */
{
  const { page, context, errors } = await newPage(browser, { reducedMotion: 'reduce' });
  await scrollTo(page, 420);
  const content = await probe(page, '[class*="heroContent"]');
  const media = await probe(page, '[class*="heroMedia"]', 'heroMediaInner');
  check('reduced motion: hero copy is not faded or moved', close(content.opacity, 1) && close(content.y, 0, 0.5), `opacity=${content.opacity} y=${content.y}`);
  check('reduced motion: hero media does not parallax', close(media.y, 0, 0.5), `y=${media.y}`);

  const gy = await sectionY(page, 'product-gallery', 0.3);
  await scrollTo(page, gy - 200);
  const layer = await probe(page, '[class*="hotspotLayer"]');
  check('reduced motion: showcase image is not scaled or rotated', close(layer.scale, 1, 0.001) && close(layer.rotate, 0, 0.01), `scale=${layer.scale} rotate=${layer.rotate}`);

  await scrollTo(page, 0, 200);
  await scrollTo(page, 2600, 300);
  await scrollTo(page, 0, 300);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.section__header')].filter((n) => Number(getComputedStyle(n).opacity) < 0.99).length);
  check('reduced motion: no reveal ever hides content', hidden === 0, `${hidden} element(s) faded`);
  check('reduced-motion run: no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await context.close();
}

/* ── 5. Phone ──────────────────────────────────────────────────────────── */
{
  const { page, context, errors } = await newPage(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await scrollTo(page, 420);
  const media = await probe(page, '[class*="heroMedia"]', 'heroMediaInner');
  check('phone: hero parallax still active', media.y > 5, `media translateY=${media.y.toFixed(1)}px`);

  let worstOverflow = 0;
  let maxRotate = 0;
  for (const type of ['featured-products', 'product-gallery', 'customizer-teaser', 'stats-counter', 'social-feed']) {
    const y = await sectionY(page, type, 0.3);
    for (const dy of [-300, 0, 300]) {
      await scrollTo(page, Math.max(0, y + dy), 250);
      worstOverflow = Math.max(worstOverflow, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      const l = await probe(page, '[class*="hotspotLayer"]');
      if (l) maxRotate = Math.max(maxRotate, Math.abs(l.rotate));
    }
  }
  check('phone: no horizontal overflow at any scroll position', worstOverflow <= 0, `worst scrollWidth - innerWidth = ${worstOverflow}`);
  check('phone: rotation amplitude is halved (≤ 0.8°)', maxRotate <= 0.8, `max |rotate| = ${maxRotate.toFixed(2)}°`);
  check('phone run: no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
