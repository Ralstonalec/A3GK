// Fails if any "To confirm" marker is still rendered. Run after `next build` + `next start`, or against a URL.
const base = process.argv[2] ?? 'http://localhost:3000';
const pages = ['/', '/products/padded-base-layer', '/products/grip-socks', '/products/sports-bandages', '/size-guide', '/about', '/help'];
let bad = 0;
for (const p of pages) {
  const html = await (await fetch(base + p)).text();
  const n = (html.match(/data-tbc/g) ?? []).length;
  if (n) { console.log(`${p}: ${n} unresolved`); bad += n; }
}
process.exit(bad ? 1 : 0);
