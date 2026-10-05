// W-024 changes only three existing MPF photos and their provenance.
// Historical tests use the exact pre-W-024 Git bytes; the live-photo contract is tested separately.
import { readFileSync } from 'node:fs';

const slugs = ['mp008f', 'mp012f', 'mp016f'];
const before = new Map(slugs.map(slug => [slug,
  readFileSync(new URL(`fixtures/w024-mpf-before/${slug}.json`, import.meta.url), 'utf8')]));
const catalog = JSON.parse(readFileSync(new URL('fixtures/w024-mpf-before/catalog.json', import.meta.url), 'utf8'));

export const isW024Name = name => before.has(name.replace(/\.json$/, ''));
export const beforeW024Raw = (raw, slug) => before.get(slug) ?? raw;
export const beforeW024 = (product, slug) => before.has(slug) ? JSON.parse(before.get(slug)) : product;
export const beforeW024Catalog = item => catalog[item.slug] ?? item;
