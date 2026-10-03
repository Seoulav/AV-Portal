import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-004-evidence.json', import.meta.url), 'utf8'));

// Older Samsung audits assert their own historical snapshots. Reconstruct only
// the three approved hotel-TV fields changed by W-20261003-004 for those audits.
export function beforeHotelTvIo(product, slug) {
  const before = evidence.products[slug];
  if (!before) return structuredClone(product);
  const restored = structuredClone(product);
  restored.io = structuredClone(before.previousIo);
  restored.sources = structuredClone(before.previousSources);
  restored.issues = structuredClone(before.previousIssues);
  return restored;
}
