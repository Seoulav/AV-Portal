import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261003-003-evidence.json', import.meta.url), 'utf8'));

// Older Samsung audits describe the published state before this approved
// QH115FX specifications batch. Restore only its specification/source fields.
export function beforeSamsung115ManualSpecs(product, slug) {
  const restored = structuredClone(product);
  if (slug !== evidence.slug) return restored;
  restored.specifications = structuredClone(evidence.before.specifications);
  restored.sources = structuredClone(evidence.before.sources);
  return restored;
}
