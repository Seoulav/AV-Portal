import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const { fields } = JSON.parse(readFileSync(new URL('./fixtures/w13005-ds8s-history.json', import.meta.url), 'utf8'));
const digest = value => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');

// Older whole-product checks must still see every current, unapproved field.
// Restore only the six fields changed by the rear diagram work, after checking
// that each exactly matches the reviewed result.
export function beforeW13005Product(current, slug) {
  if (slug !== 'ds-8s') return current;
  const result = structuredClone(current);
  for (const [field, { prior, approved }] of Object.entries(fields)) {
    if (digest(current[field]) !== approved) throw new Error(`ds-8s: unexpected W-005 ${field} change`);
    if (prior === null && field === 'portMap') delete result[field];
    else result[field] = structuredClone(prior);
  }
  return result;
}

export function beforeW13005Raw(raw, slug) {
  if (slug !== 'ds-8s') return raw;
  return JSON.stringify(beforeW13005Product(JSON.parse(raw), slug), null, 2) + '\n';
}

export const isW13006Manual = name => name === 'vs-ent-ds-8s-setting-guide-ko.pdf';
