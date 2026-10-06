import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Restore only the approved W-001 JBL card field at historical hash points.
// Every current non-card field remains visible to those older assertions.
const prior = JSON.parse(readFileSync(new URL('../Work/기록/W-20261006-001-prior-facts.json', import.meta.url), 'utf8'));
export const jblW06001Slugs = new Set(Object.keys(prior));
const sha = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

export function beforeJblW06001Product(current, slug) {
  if (!jblW06001Slugs.has(slug)) return current;
  const record = prior[slug];
  if (sha(current.keyFacts) !== record.approved)
    throw new Error(`${slug}: unexpected W-001 keyFacts change`);
  return { ...structuredClone(current), keyFacts: structuredClone(record.prior) };
}

export function beforeJblW06001Raw(raw, slug) {
  if (!jblW06001Slugs.has(slug)) return raw;
  return JSON.stringify(beforeJblW06001Product(JSON.parse(raw), slug), null, 2) + '\n';
}
