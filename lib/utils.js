/** Small, dependency-free helpers shared by client and server. */

/** Join truthy class names. */
export function cn(...parts) {
  return parts.flat().filter(Boolean).join(' ');
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function isBrowser() {
  return typeof window !== 'undefined';
}

/* ── Money ────────────────────────────────────────────────────────────────
 * All arithmetic is done in integer cents. Shopify returns decimal strings
 * ("49.99"); convert at the boundary and never add floats.
 */

export function toCents(amount) {
  if (amount == null || amount === '') return 0;
  const n = typeof amount === 'number' ? amount : Number.parseFloat(amount);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function centsToAmount(cents) {
  return (cents / 100).toFixed(2);
}

export function formatMoney(cents, { currency = 'USD', locale = 'en-US', trimZeros = false } = {}) {
  const value = (Number(cents) || 0) / 100;
  const whole = trimZeros && Number.isInteger(value);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(value);
}

/* ── Strings ───────────────────────────────────────────────────────────── */

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Strip tags and control characters from free text (defence in depth; React escapes on output). */
export function sanitizeText(value, maxLength = 200) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/* ── Colour ────────────────────────────────────────────────────────────── */

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isValidHex(value) {
  return HEX_RE.test(value);
}

export function normalizeHex(value, fallback = '#000000') {
  if (typeof value !== 'string') return fallback;
  let v = value.trim();
  if (!v.startsWith('#')) v = `#${v}`;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return HEX_RE.test(v) ? v.toLowerCase() : fallback;
}

export function hexToRgb(hex) {
  const v = normalizeHex(hex);
  return { r: parseInt(v.slice(1, 3), 16), g: parseInt(v.slice(3, 5), 16), b: parseInt(v.slice(5, 7), 16) };
}

/** WCAG relative luminance. */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(hexA, hexB) {
  const [hi, lo] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads best on `hex`. */
export function readableOn(hex) {
  return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#ffffff') ? '#000000' : '#ffffff';
}

/** Mix two hex colours (t=0 → a, t=1 → b). */
export function mixHex(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const ch = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
  return `#${ch(A.r, B.r)}${ch(A.g, B.g)}${ch(A.b, B.b)}`;
}

/* ── Dates ─────────────────────────────────────────────────────────────── */

/** Add business days (Mon–Fri). */
export function addBusinessDays(from, days) {
  const d = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

export function formatShortDate(date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

/**
 * Estimated delivery window.
 * @param {{ from?: Date, processingDays: number, minDays: number, maxDays: number }} o
 */
export function estimateDelivery({ from = new Date(), processingDays, minDays, maxDays }) {
  const earliest = addBusinessDays(from, processingDays + minDays);
  const latest = addBusinessDays(from, processingDays + maxDays);
  return { earliest, latest, label: `${formatShortDate(earliest)} – ${formatShortDate(latest)}` };
}

/* ── Safe browser storage (can throw in private mode / blocked storage) ── */

export const safeStorage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function debounce(fn, wait = 200) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/** Short, URL-safe random id (not for secrets). */
export function shortId(length = 10) {
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
