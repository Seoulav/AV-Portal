import { readFileSync } from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261002-014-evidence.json', import.meta.url), 'utf8'));

// Restore the two active products to their pre-W-014 state for earlier audit snapshots.
// The historical Work records remain unchanged while the active JSON drops foreign URLs.
export function beforeSamsungForeignPurge(product, slug) {
  const old = evidence.products[slug];
  if (!old) return structuredClone(product);
  const restored = structuredClone(product);
  restored.sources = restored.sources.filter(source => source.code !== 'S5');
  restored.sources.splice(1, 0, old.previousSourceEntry);
  restored.verificationSummary = old.previousVerificationSummary;
  restored.issues = old.previousIssues;
  restored.keyFacts = old.previousKeyFacts;
  restored.specifications.length = old.previousSpecificationsLength;
  for (const kind of ['specifications', 'io']) {
    for (const change of old.affected[kind]) restored[kind][change.index] = change.previousRow;
  }
  return restored;
}
