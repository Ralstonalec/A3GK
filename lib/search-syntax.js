/**
 * Shopify search-syntax subset: parser + evaluator.
 *
 * The Storefront API `products(query:)` argument accepts this syntax.  In
 * Shopify mode the string is forwarded untouched; in demo mode this module
 * evaluates it against the mock catalog so both modes behave identically.
 *
 *   gloves                                 free text
 *   product_type:Gloves                    field match (case-insensitive)
 *   tag:pro AND available_for_sale:true    boolean ops (implicit AND)
 *   (tag:pro OR tag:match) -tag:junior     grouping + negation
 *   variants.price:>=50 variants.price:<150
 *   title:apex*                            trailing wildcard
 *   vendor:"A3GK Labs"                     quoted values
 */

const MAX_QUERY_LENGTH = 400;

/* ── Tokeniser ─────────────────────────────────────────────────────────── */

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i += 1;
    } else if (ch === '(' || ch === ')') {
      tokens.push({ type: ch });
      i += 1;
    } else {
      let word = '';
      let quoted = false;
      while (i < input.length && (quoted || (!/\s/.test(input[i]) && input[i] !== '(' && input[i] !== ')'))) {
        if (input[i] === '"') quoted = !quoted;
        word += input[i];
        i += 1;
      }
      tokens.push({ type: 'word', value: word });
    }
  }
  return tokens;
}

/* ── Parser (recursive descent) ────────────────────────────────────────── */

function parseTerm(word) {
  let negate = false;
  let text = word;
  if (text.startsWith('-') && text.length > 1) {
    negate = true;
    text = text.slice(1);
  }
  const colon = text.indexOf(':');
  let field = null;
  let value = text;
  if (colon > 0 && /^[a-z_.]+$/i.test(text.slice(0, colon))) {
    field = text.slice(0, colon).toLowerCase();
    value = text.slice(colon + 1);
  }
  let op = ':';
  const opMatch = /^(>=|<=|>|<)/.exec(value);
  if (opMatch) {
    op = opMatch[1];
    value = value.slice(op.length);
  }
  value = value.replace(/^"(.*)"$/, '$1');
  const node = { kind: 'term', field, op, value };
  return negate ? { kind: 'not', child: node } : node;
}

export function parseQuery(query) {
  const tokens = tokenize(String(query || '').slice(0, MAX_QUERY_LENGTH));
  let pos = 0;
  const peek = () => tokens[pos];

  function parseOr() {
    const nodes = [parseAnd()];
    while (peek() && peek().type === 'word' && peek().value.toUpperCase() === 'OR') {
      pos += 1;
      nodes.push(parseAnd());
    }
    return nodes.length === 1 ? nodes[0] : { kind: 'or', children: nodes };
  }

  function parseAnd() {
    const nodes = [parseUnary()];
    while (peek() && peek().type !== ')' && !(peek().type === 'word' && peek().value.toUpperCase() === 'OR')) {
      if (peek().type === 'word' && peek().value.toUpperCase() === 'AND') pos += 1;
      if (!peek() || peek().type === ')') break;
      nodes.push(parseUnary());
    }
    return nodes.length === 1 ? nodes[0] : { kind: 'and', children: nodes };
  }

  function parseUnary() {
    const token = peek();
    if (token && token.type === 'word' && token.value.toUpperCase() === 'NOT') {
      pos += 1;
      return { kind: 'not', child: parseUnary() };
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const token = peek();
    if (!token) return { kind: 'all' };
    if (token.type === '(') {
      pos += 1;
      const inner = parseOr();
      if (peek() && peek().type === ')') pos += 1;
      return inner;
    }
    if (token.type === ')') {
      pos += 1;
      return { kind: 'all' };
    }
    pos += 1;
    return parseTerm(token.value);
  }

  if (tokens.length === 0) return { kind: 'all' };
  const ast = parseOr();
  return ast;
}

/* ── Evaluator ─────────────────────────────────────────────────────────── */

function textMatches(haystack, needle) {
  const h = String(haystack ?? '').toLowerCase();
  const n = String(needle).toLowerCase();
  if (n.endsWith('*')) return h.includes(n.slice(0, -1));
  return h === n || h.split(/[\s,/-]+/).includes(n) || (n.length > 2 && h.includes(n));
}

function compareNumber(actual, op, expected) {
  const target = Number.parseFloat(expected);
  if (!Number.isFinite(target)) return false;
  switch (op) {
    case '>=': return actual >= target;
    case '<=': return actual <= target;
    case '>': return actual > target;
    case '<': return actual < target;
    default: return actual === target;
  }
}

function matchTerm(node, product) {
  const { field, op, value } = node;
  switch (field) {
    case null:
      return [product.title, product.vendor, product.productType, product.description, ...product.tags].some((f) => textMatches(f, value));
    case 'title':
      return textMatches(product.title, value);
    case 'product_type':
    case 'type':
      return textMatches(product.productType, value);
    case 'category':
      return String(product.category).toLowerCase() === value.toLowerCase();
    case 'vendor':
      return textMatches(product.vendor, value);
    case 'tag':
      return product.tags.some((t) => t.toLowerCase() === value.toLowerCase());
    case 'tag_not':
      return !product.tags.some((t) => t.toLowerCase() === value.toLowerCase());
    case 'sku':
      return product.variants.some((v) => textMatches(v.sku, value));
    case 'handle':
      return product.handle === value;
    case 'available_for_sale':
      return product.availableForSale === (value.toLowerCase() === 'true');
    case 'variants.price':
    case 'price': {
      const dollars = product.variants.map((v) => v.priceCents / 100);
      return dollars.some((p) => compareNumber(p, op === ':' ? '=' : op, value));
    }
    default:
      return false;
  }
}

export function evaluate(node, product) {
  switch (node.kind) {
    case 'all': return true;
    case 'and': return node.children.every((c) => evaluate(c, product));
    case 'or': return node.children.some((c) => evaluate(c, product));
    case 'not': return !evaluate(node.child, product);
    case 'term': return matchTerm(node, product);
    default: return false;
  }
}

export function filterProducts(products, query) {
  if (!query || !String(query).trim()) return products;
  const ast = parseQuery(query);
  return products.filter((p) => evaluate(ast, p));
}

/* ── Builder used by the filter UI ─────────────────────────────────────── */

const quote = (v) => (/\s/.test(v) ? `"${v}"` : v);

/**
 * Build a Storefront-compatible query string from filter state.
 * @param {{ productTypes?: string[], tags?: string[], minPrice?: number, maxPrice?: number, availableOnly?: boolean, text?: string }} f
 */
export function buildProductQuery({ productTypes = [], tags = [], minPrice, maxPrice, availableOnly, text } = {}) {
  const clauses = [];
  const cleanText = String(text || '').replace(/[():"]/g, ' ').trim();
  if (cleanText) clauses.push(cleanText);
  if (productTypes.length) {
    const group = productTypes.map((t) => `product_type:${quote(t)}`).join(' OR ');
    clauses.push(productTypes.length > 1 ? `(${group})` : group);
  }
  for (const tag of tags) clauses.push(`tag:${quote(tag)}`);
  if (Number.isFinite(minPrice) && minPrice > 0) clauses.push(`variants.price:>=${minPrice}`);
  if (Number.isFinite(maxPrice) && maxPrice > 0) clauses.push(`variants.price:<=${maxPrice}`);
  if (availableOnly) clauses.push('available_for_sale:true');
  return clauses.join(' AND ');
}

export const SEARCH_QUERY_MAX_LENGTH = MAX_QUERY_LENGTH;
