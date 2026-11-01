/** The site's own origin from a configured value. Tolerates a missing scheme ("a3gk.ca") and stray slashes or paths. */
export function siteOriginFrom(value: string | undefined | null, fallback: string): string {
  const v = (value ?? '').trim();
  if (!v) return fallback;
  for (const candidate of [v, `https://${v.replace(/^\/+/, '')}`]) {
    try { return new URL(candidate).origin; } catch { /* try the next form */ }
  }
  return fallback;
}
