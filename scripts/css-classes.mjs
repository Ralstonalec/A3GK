#!/usr/bin/env node
/**
 * Dev utility: compares `styles.xxx` references in JS against the classes
 * defined in each CSS module. Exits non-zero if any referenced class is missing.
 *
 *   node scripts/css-classes.mjs          # report
 *   node scripts/css-classes.mjs --list   # print needed classes per module
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'ShopifyTheme', '.git', 'coverage'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
};

const files = walk(root);
const modules = {};
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const imports = [...src.matchAll(/import\s+(\w+)\s+from\s+'@\/styles\/([\w.-]+\.module\.css)'/g)];
  for (const [, ident, mod] of imports) {
    const used = new Set();
    for (const m of src.matchAll(new RegExp(`\\b${ident}\\.(\\w+)`, 'g'))) used.add(m[1]);
    // dynamic: styles[`name_${x}`] → record prefix
    for (const m of src.matchAll(new RegExp(`\\b${ident}\\[\`([\\w-]+)_\\$\\{`, 'g'))) used.add(`${m[1]}_*`);
    modules[mod] ??= new Set();
    used.forEach((u) => modules[mod].add(u));
  }
}

let missingTotal = 0;
for (const [mod, used] of Object.entries(modules)) {
  const cssFile = path.join(root, 'styles', mod);
  const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : '';
  const defined = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
  const missing = [...used].filter((u) => (u.endsWith('_*') ? ![...defined].some((d) => d.startsWith(u.slice(0, -1))) : !defined.has(u)));
  if (process.argv.includes('--list')) console.log(`\n## ${mod}\n${[...used].sort().join(' ')}`);
  if (missing.length) {
    missingTotal += missing.length;
    console.log(`✗ ${mod}: missing ${missing.length}\n   ${missing.sort().join(' ')}`);
  } else {
    console.log(`✓ ${mod}: all ${used.size} classes defined`);
  }
}
process.exit(missingTotal ? 1 : 0);
