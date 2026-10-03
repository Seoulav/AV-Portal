import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-008-evidence.json', import.meta.url), 'utf8'));

// Older audits compare their own pre-W-008 state. Restore only this approved
// AMX batch's editable fields for those historical, byte-level assertions.
export const beforeAmxW03008 = (product, slug) => {
  const previous = evidence.products[slug]?.before;
  if (!previous) return product;
  const restored = structuredClone(product);
  for (const field of ['specifications', 'io', 'sources']) restored[field] = structuredClone(previous[field]);
  return restored;
};

export const amxW03008Slug = slug => Object.hasOwn(evidence.products, slug);
