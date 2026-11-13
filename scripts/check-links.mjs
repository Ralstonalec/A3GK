// Crawls the site's own pages and fails if any internal link, robots.txt or sitemap.xml returns an error.
// Run against a local production build (`next build` + `next start`) or a URL: node scripts/check-links.mjs https://www.a3gk.ca
const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const seen = new Map(); // path -> page it was first linked from
const queue = [['/', '(start)']];
const bad = [];
const SKIP = /^\/(api|auth|customer|account)\b/; // sign-in and API routes redirect elsewhere or need a session

while (queue.length) {
  const [path, from] = queue.shift();
  if (seen.has(path)) continue;
  seen.set(path, from);
  const res = await fetch(base + path, { redirect: 'manual' });
  if (res.status >= 400) { bad.push(`${res.status} ${path} (linked from ${from})`); continue; }
  if (res.status >= 300 || !(res.headers.get('content-type') ?? '').includes('text/html')) continue;
  const html = await res.text();
  for (const m of html.matchAll(/<a\b[^>]*\bhref="(\/[^"#?]*)/g)) {
    const next = m[1].replace(/\/$/, '') || '/';
    if (!next.startsWith('//') && !SKIP.test(next) && !seen.has(next)) queue.push([next, path]);
  }
}
for (const file of ['/robots.txt', '/sitemap.xml']) {
  const res = await fetch(base + file);
  if (res.status !== 200) bad.push(`${res.status} ${file}`);
  else if (file === '/sitemap.xml') {
    for (const m of (await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const path = new URL(m[1]).pathname;
      const r = await fetch(base + path, { redirect: 'manual' });
      if (r.status !== 200) bad.push(`${r.status} ${path} (listed in sitemap.xml)`);
    }
  }
}
console.log(`Checked ${seen.size} pages on ${base}`);
if (bad.length) { console.log('Broken:\n  ' + bad.join('\n  ')); process.exit(1); }
console.log('No broken internal links.');
