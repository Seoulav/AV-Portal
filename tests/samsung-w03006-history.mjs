import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-006-evidence.json', import.meta.url), 'utf8'));

// Older Samsung audits intentionally assert their own historical product state.
export const beforeSamsungWhiteboard = (product, slug) => {
  const previous = evidence.products[slug]?.before;
  if (!previous) return product;
  const restored = structuredClone(product);
  for (const field of ['specifications', 'io', 'sources', 'issues', 'keyFacts']) {
    restored[field] = structuredClone(previous[field]);
  }
  return restored;
};
