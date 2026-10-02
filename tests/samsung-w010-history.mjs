import {readFileSync} from 'node:fs';

const evidence = JSON.parse(readFileSync(new URL('../Work/기록/W-20261002-010-evidence.json', import.meta.url), 'utf8'));

// Historical audits compare the product as it stood before this source cleanup.
// Keep their evidence JSON unchanged and reverse only W-010's recorded edits.
export function beforeSamsungSourceCleanup(product, slug) {
  const previous = structuredClone(product);
  const changes = evidence.products[slug];
  if (!changes) return previous;
  for (const {index, source} of [...changes.removedSources].sort((a,b) => a.index-b.index)) {
    previous.sources.splice(index, 0, source);
  }
  for (const {index, before} of changes.changedSources) previous.sources[index] = before;
  for (const {kind, index, before} of changes.downgraded) {
    previous[kind][index].source = before.source;
    previous[kind][index].verification = before.verification;
  }
  for (const {kind, index, before} of changes.domesticReplacements ?? []) {
    previous[kind][index].source = before.source;
    previous[kind][index].verification = before.verification;
    previous[kind][index].value = before.value;
  }
  if (changes.keyFactChange) previous.keyFacts = changes.keyFactChange.before;
  return previous;
}

export function currentKeyFactAnchors(slug) {
  return evidence.products[slug]?.keyFactChange ?? null;
}
