/**
 * Pure cart helpers shared by the browser store (lib/cart.js) and the server
 * (lib/cart-service.js).  No I/O, no React.
 */

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(',')}}`;
}

/** FNV-1a 32-bit → base36. Non-cryptographic; only used to merge identical lines. */
export function hashString(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Two adds of the same variant + same design collapse into one line. */
export function lineKey(variantId, customization) {
  return customization ? `${variantId}#${hashString(stableStringify(customization))}` : variantId;
}

export function summarize(lines) {
  return {
    totalQuantity: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0),
  };
}

export function emptyCart() {
  return { id: null, source: 'local', currencyCode: 'USD', lines: [], totalQuantity: 0, subtotalCents: 0, checkoutUrl: null, notices: [] };
}

export function withLines(cart, lines) {
  return { ...cart, lines, ...summarize(lines) };
}

/** Add (or merge) a priced line. `max` caps the merged quantity. */
export function addLine(cart, line, max = Infinity) {
  const existing = cart.lines.find((l) => l.id === line.id);
  const cap = Math.min(max, line.maxQuantity ?? Infinity);
  const lines = existing
    ? cart.lines.map((l) => (l.id === line.id ? { ...l, quantity: Math.min(cap, l.quantity + line.quantity) } : l))
    : [...cart.lines, { ...line, quantity: Math.min(cap, line.quantity) }];
  return withLines(cart, lines);
}

export function setLineQuantity(cart, lineId, quantity, max = Infinity) {
  if (quantity <= 0) return removeLine(cart, lineId);
  const lines = cart.lines.map((l) =>
    l.id === lineId ? { ...l, quantity: Math.min(quantity, max, l.maxQuantity ?? Infinity) } : l,
  );
  return withLines(cart, lines);
}

export function removeLine(cart, lineId) {
  return withLines(cart, cart.lines.filter((l) => l.id !== lineId));
}
