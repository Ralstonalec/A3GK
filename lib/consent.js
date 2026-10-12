import { useSyncExternalStore } from 'react';
import { isAnalyticsEnabled } from './config';
import { FEATURES } from './features';

/**
 * Consent manager.
 *
 * Granular categories, nothing pre-ticked, "reject all" as prominent as
 * "accept all", Global Privacy Control honoured, decision stored with a
 * timestamp + policy version and re-requested after 6 months.
 *
 * NOTE: this is a TCF-*aligned* first-party consent store, NOT a registered IAB
 * TCF 2.x CMP (that requires IAB Europe registration and Global Vendor List
 * integration). See COMPLIANCE.md for the swap-in path.
 */

export const CONSENT_COOKIE = 'a3gk_consent';
export const CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182; // ~6 months

/**
 * Only categories the site actually uses are offered. "Preferences" exists for the
 * Design Studio (custom kit), "analytics" only when an analytics destination is
 * configured, and "marketing" has no integration — a switch that controls nothing
 * would be a misleading claim.
 */
export const CONSENT_CATEGORIES = [
  {
    id: 'necessary',
    label: 'Strictly necessary',
    description: 'Cart, checkout, security and your cookie choice. These cannot be switched off.',
    required: true,
    tcfPurposes: [],
  },
  ...(FEATURES.customKit
    ? [
        {
          id: 'preferences',
          label: 'Preferences',
          description: 'Remembers non-essential choices such as your last design in the Design Studio.',
          required: false,
          tcfPurposes: [],
        },
      ]
    : []),
  ...(isAnalyticsEnabled()
    ? [
        {
          id: 'analytics',
          label: 'Analytics',
          description: 'Usage and performance measurement that helps us improve the store. Uses a random identifier stored in your browser.',
          required: false,
          tcfPurposes: [7, 8, 9, 10],
        },
      ]
    : []),
];

/** False while there is nothing optional to consent to: no banner, no settings link. */
export const HAS_OPTIONAL_CONSENT = CONSENT_CATEGORIES.some((c) => !c.required);

export const DENY_ALL = Object.freeze({ necessary: true, preferences: false, analytics: false, marketing: false });
export const ALLOW_ALL = Object.freeze({ necessary: true, preferences: FEATURES.customKit, analytics: isAnalyticsEnabled(), marketing: false });

/** Global Privacy Control — legally an opt-out signal in California and other US states. */
export function gpcEnabled() {
  return typeof navigator !== 'undefined' && navigator.globalPrivacyControl === true;
}

function readCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1)));
    if (parsed.version !== CONSENT_VERSION || !parsed.categories) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCookie(record) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

/* ── Tiny external store so React and non-React code share state ───────── */

let state = { ready: false, decided: false, categories: DENY_ALL, timestamp: null, gpc: false, panelOpen: false };
const listeners = new Set();

function emit(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function initConsent() {
  if (typeof window === 'undefined' || state.ready) return;
  const stored = readCookie();
  const gpc = gpcEnabled();
  if (stored) {
    emit({ ready: true, decided: true, categories: { ...DENY_ALL, ...stored.categories, necessary: true }, timestamp: stored.timestamp, gpc });
  } else {
    emit({ ready: true, decided: false, categories: DENY_ALL, gpc });
  }
}

export function saveConsent(categories) {
  const clean = { ...DENY_ALL, ...categories, necessary: true };
  // GPC means "do not sell/share": marketing stays off regardless of UI state.
  if (gpcEnabled()) clean.marketing = false;
  const record = { version: CONSENT_VERSION, timestamp: new Date().toISOString(), categories: clean };
  writeCookie(record);
  emit({ decided: true, categories: clean, timestamp: record.timestamp, panelOpen: false });
  window.dispatchEvent(new CustomEvent('a3gk:consent', { detail: record }));
}

export const acceptAll = () => saveConsent(ALLOW_ALL);
export const rejectAll = () => saveConsent(DENY_ALL);
export const openConsentPanel = () => emit({ panelOpen: true });
export const closeConsentPanel = () => emit({ panelOpen: false });

export function getConsent() {
  return state;
}

export function hasConsent(category) {
  return state.decided && Boolean(state.categories[category]);
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverState = { ready: false, decided: false, categories: DENY_ALL, timestamp: null, gpc: false, panelOpen: false };

export function useConsent() {
  return useSyncExternalStore(subscribe, getConsent, () => serverState);
}

/** Test helper. */
export function __resetConsentForTests() {
  state = { ready: false, decided: false, categories: DENY_ALL, timestamp: null, gpc: false, panelOpen: false };
  listeners.clear();
}
