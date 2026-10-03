// Reconstruct the approved pre-W-20261003-009 Crown JSON for older audits.
// The W-009 test checks current Crown data and guards the permitted moves.
import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-009-evidence.json', import.meta.url), 'utf8'));
export const crownW03009Slug = slug => Object.hasOwn(evidence.products, slug);
export function beforeCrownW03009(product, slug) {
  const prior = evidence.products[slug];
  if (!prior) return product;
  const copy = structuredClone(product);
  copy.specifications = prior.beforeSpecifications;
  copy.io = prior.beforeIo;
  copy.issues = prior.beforeIssues;
  if (prior.beforeSources) copy.sources = prior.beforeSources;
  if (['dci-2-300n','dci-2-600n','dci-4-300n','dci-4-600n'].includes(slug)) delete copy.portMap;
  return copy;
}
