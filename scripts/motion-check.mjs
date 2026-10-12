#!/usr/bin/env node
/**
 * Browser check for the scroll-animation layer (Playwright + the pre-installed Chromium).
 *
 *   BASE=http://localhost:3100 npm run audit:motion
 *
 * Verifies, against a running build:
 *   0. hero entrance: image curtain + headline lines animate in, then rest (and are instant under reduced motion)
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

/* ── 0. Hero entrance (CSS-driven; runs on a fresh load) ──────────────── */
{
  const read = (page) =>
    page.evaluate(() => {
      const reveal = document.querySelector('[class*="heroReveal"]');
      const line = document.querySelector('[class*="heroLineInner"]');
      const m = new DOMMatrix(getComputedStyle(line).transform === 'none' ? undefined : getComputedStyle(line).transform);
      return { clip: getComputedStyle(reveal).clipPath, lineY: m.m42 };
    });
  for (const reduced of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(reduced ? { reducedMotion: 'reduce' } : {}) });
    await context.addCookies([{ name: 'a3gk_consent', value: CONSENT, url: BASE }]);
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: 'commit' });
    await page.waitForSelector('[class*="heroLineInner"]', { state: 'attached' });
    const early = await read(page);
    await page.waitForTimeout(3200);
    const late = await read(page);
    if (!reduced) {
      check('hero entrance: the image curtain starts (mostly) closed and the headline starts below its mask', Number(early.clip.match(/inset\(([\d.]+)%/)?.[1]) > 50 && early.lineY > 10, `clip ${early.clip}, headline y=${early.lineY.toFixed(0)}px`);
    } else {
      check('reduced motion: hero is already in its final state (no curtain, no rising text)', !(Number(early.clip.match(/inset\(([\d.]+)%/)?.[1]) > 1) && Math.abs(early.lineY) < 1, `clip ${early.clip}, headline y=${early.lineY.toFixed(1)}px`);
    }
    const open = /^(none|inset\(0(px|%)?( 0(px|%)?){0,3}\))$/.test(late.clip.trim());
    check(`${reduced ? 'reduced motion: ' : ''}hero entrance ends at rest (full frame, headline in place)`, open && Math.abs(late.lineY) < 0.5, `clip ${late.clip}, headline y=${late.lineY.toFixed(1)}px`);
    await context.close();
  }
}

/* ── 1 + 2. Desktop: parallax + reversibility ──────────────────────────── */
{
  const { page, context, errors } = await newPage(browser);
  const MEDIA = '[class*="heroMedia"]';
  const CONTENT = '[class*="heroContent"]';
  const LAYER = '[class*="spotlightFrame"]';

  const top = { media: await probe(page, MEDIA, 'heroMediaInner'), content: await probe(page, CONTENT) };
  check('hero is at rest at the top (no offset, fully visible)', close(top.media.y, 0, 0.5) && close(top.content.y, 0, 0.5) && close(top.content.opacity, 1), JSON.stringify({ mediaY: top.media.y, contentOpacity: top.content.opacity }));

  await scrollTo(page, 420);
  const mid = { media: await probe(page, MEDIA, 'heroMediaInner'), content: await probe(page, CONTENT) };
  check('hero media drifts down relative to the page (parallax)', mid.media.y > 20, `media translateY=${mid.media.y.toFixed(1)}px`);
  check('hero copy lifts and fades while scrolling out', mid.content.y < -10 && mid.content.opacity < 0.95, `y=${mid.content.y.toFixed(1)}px opacity=${mid.content.opacity.toFixed(2)}`);

  await scrollTo(page, 0);
  const back = { media: await probe(page, MEDIA, 'heroMediaInner'), content: await probe(page, CONTENT) };
  check('hero returns exactly to rest when scrolled back to the top', close(back.media.y, 0, 0.5) && close(back.content.opacity, 1, 0.01), `mediaY=${back.media.y.toFixed(2)} opacity=${back.content.opacity.toFixed(2)}`);

  // Product spotlight frame: record on the way DOWN, then UP, at identical positions.
  // `base` = the scroll position where the frame's CENTRE is at the viewport centre (progress 0.5).
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
  check('spotlight frame transform is identical scrolling down and back up (reversible)', symmetric, `scale ${down.map((d) => d.scale.toFixed(3)).join(' → ')}`);
  const scales = down.map((d) => d.scale);
  check('spotlight frame grows gently into place (0.84–1.00, never above 1)', Math.min(...scales) >= 0.84 && Math.max(...scales) <= 1.0005 && Math.max(...scales) - Math.min(...scales) > 0.05, `range ${Math.min(...scales).toFixed(3)}–${Math.max(...scales).toFixed(3)}`);
  check('spotlight frame is level and at full size when mid-screen', Math.abs(down[2].rotate) < 0.1 && close(down[2].scale, 1, 0.005), `scale ${down[2].scale.toFixed(3)} rotate ${down[2].rotate.toFixed(2)}°`);

  // Staged range: pinned on desktop, steps through the categories, and steps back on the way up.
  const stage = await page.evaluate(() => {
    const el = document.querySelector('[class*="rangeStage"]');
    if (!el || getComputedStyle(el).display === 'none') return null;
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, h: r.height };
  });
  check('staged range is shown on desktop with motion allowed', Boolean(stage), stage ? `track ${Math.round(stage.h)}px` : 'display:none');
  if (stage) {
    const travel = stage.h - 900;
    const activeIndex = () => page.evaluate(() => [...document.querySelectorAll('[class*="rangeItem"]')].filter((n) => n.tagName === 'A').findIndex((n) => String(n.className).includes('rangeItemActive')));
    const stickyTop = () => page.evaluate(() => document.querySelector('[class*="rangeSticky"]').getBoundingClientRect().top);
    const seq = [];
    const pins = [];
    for (const f of [0.04, 0.3, 0.55, 0.95]) {
      await scrollTo(page, stage.top + travel * f, 500);
      seq.push(await activeIndex());
      pins.push(Math.round(await stickyTop()));
    }
    check('staged range advances one category at a time while scrolling down', JSON.stringify(seq) === JSON.stringify([0, 1, 2, 3]), `active rows ${seq.join(' → ')}`);
    check('the stage stays pinned while it steps (no scroll hijacking: the page itself scrolls)', pins.every((t) => Math.abs(t - pins[0]) <= 2), `sticky top ${pins.join(', ')}px`);
    const back = [];
    for (const f of [0.55, 0.3, 0.04]) {
      await scrollTo(page, stage.top + travel * f, 500);
      back.push(await activeIndex());
    }
    check('scrolling back up steps the staged range back', JSON.stringify(back) === JSON.stringify([2, 1, 0]), `active rows ${back.join(' → ')}`);
    // Keyboard: focusing a row shows that category (nothing is reachable only by scrolling).
    await scrollTo(page, stage.top + travel * 0.04, 400);
    await page.locator('[class*="rangeItem"]').filter({ hasText: 'Pants' }).first().focus();
    await page.waitForTimeout(300);
    check('keyboard focus on a row shows that category', (await activeIndex()) === 2, `active row ${await activeIndex()}`);
  }

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

  // Its bottom edge re-enters from the top. The heading waits 28px ABOVE its slot, so aim well inside
  // (a few px of overlap would sit on the observer's edge and prove nothing about direction).
  await jump(page, headerTop + headerHeight - 100);
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

  const gy = await sectionY(page, 'collection-list', 0.3);
  await scrollTo(page, gy - 200);
  const display = await page.evaluate(() => ({ stage: getComputedStyle(document.querySelector('[class*="rangeStage"]')).display, grid: getComputedStyle(document.querySelector('[class*="rangeGridWrap"]')).display }));
  check('reduced motion: nothing is pinned (tile grid shown, staged range hidden)', display.stage === 'none' && display.grid !== 'none', JSON.stringify(display));
  const layer = await probe(page, '[class*="categoryLayer"]');
  check('reduced motion: category photo is not scaled or rotated', close(layer.scale, 1, 0.001) && close(layer.rotate, 0, 0.01), `scale=${layer.scale} rotate=${layer.rotate}`);
  const frame = await probe(page, '[class*="spotlightFrame"]');
  check('reduced motion: spotlight frame is not scaled', close(frame.scale, 1, 0.001), `scale=${frame.scale}`);

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
  let maxScale = 0;
  let minFrame = 1;
  const phone = await page.evaluate(() => ({ stage: getComputedStyle(document.querySelector('[class*="rangeStage"]')).display }));
  check('phone: no pinned section (tile grid instead)', phone.stage === 'none', JSON.stringify(phone));
  for (const type of ['collection-list', 'product-spotlight', 'featured-products']) {
    const y = await sectionY(page, type, 0.3);
    for (const dy of [-300, 0, 300]) {
      await scrollTo(page, Math.max(0, y + dy), 250);
      worstOverflow = Math.max(worstOverflow, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      const l = await probe(page, '[class*="categoryLayer"]');
      if (l) maxScale = Math.max(maxScale, l.scale);
      const f = await probe(page, '[class*="spotlightFrame"]');
      if (f) minFrame = Math.min(minFrame, f.scale);
    }
  }
  check('phone: no horizontal overflow at any scroll position', worstOverflow <= 0, `worst scrollWidth - innerWidth = ${worstOverflow}`);
  check('phone: zoom amplitude is halved (≤ 1.045)', maxScale <= 1.045, `max scale = ${maxScale.toFixed(3)}`);
  check('phone: spotlight frame travel is halved (≥ 0.92)', minFrame >= 0.92, `min scale = ${minFrame.toFixed(3)}`);
  check('phone run: no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await context.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
